import { db } from "../db";
import { employees } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";
import * as bcrypt from "bcryptjs";

export class EmployeeVerificationService {
  // Parse CSV and bulk create employees
  async uploadEmployees(csvData: string, organizationId: string): Promise<{
    success: number;
    errors: string[];
  }> {
    const lines = csvData.trim().split('\n');
    const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
    
    // Validate required headers
    const requiredHeaders = ['employee_id', 'first_name', 'last_name', 'date_of_birth', 'department', 'position', 'email', 'hire_date'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    
    if (missingHeaders.length > 0) {
      throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`);
    }
    
    const errors: string[] = [];
    let successCount = 0;
    
    // Process each row
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const employee: any = {};
      
      // Map values to headers
      headers.forEach((header, index) => {
        employee[header] = values[index];
      });
      
      try {
        // Parse and validate date
        const dobParts = employee.date_of_birth.split('/');
        const dob = new Date(
          parseInt(dobParts[2]), 
          parseInt(dobParts[0]) - 1, 
          parseInt(dobParts[1])
        );
        
        const hireDateParts = employee.hire_date.split('/');
        const hireDate = new Date(
          parseInt(hireDateParts[2]),
          parseInt(hireDateParts[0]) - 1,
          parseInt(hireDateParts[1])
        );
        
        // Check if employee already exists
        const existing = await db.select()
          .from(employees)
          .where(eq(employees.employeeId, employee.employee_id));
        
        if (existing.length > 0) {
          // Update existing employee
          await db.update(employees)
            .set({
              firstName: employee.first_name,
              lastName: employee.last_name,
              dateOfBirth: dob,
              email: employee.email,
              department: employee.department,
              position: employee.position,
              hireDate: hireDate,
              startDate: hireDate,
              employmentType: employee.employment_type || 'full-time',
              phone: employee.phone || null,
            })
            .where(eq(employees.employeeId, employee.employee_id));
        } else {
          // Insert new employee
          await db.insert(employees).values({
            organizationId,
            employeeId: employee.employee_id,
            firstName: employee.first_name,
            lastName: employee.last_name,
            dateOfBirth: dob,
            email: employee.email,
            department: employee.department,
            position: employee.position,
            hireDate: hireDate,
            startDate: hireDate,
            employmentType: employee.employment_type || 'full-time',
            employmentStatus: 'active',
            isVerified: false,
            verificationAttempts: 0,
          });
        }
        
        successCount++;
      } catch (error) {
        errors.push(`Row ${i + 1}: ${error.message}`);
      }
    }
    
    return { success: successCount, errors };
  }
  
  // Verify employee and link to user account
  async verifyEmployee(
    userId: string, 
    employeeId: string, 
    lastName: string, 
    dateOfBirth: string
  ): Promise<{ 
    success: boolean; 
    message: string;
    employee?: any;
  }> {
    try {
      // Parse DOB
      const dobParts = dateOfBirth.split('-');
      const dob = new Date(
        parseInt(dobParts[0]),
        parseInt(dobParts[1]) - 1,
        parseInt(dobParts[2])
      );
      
      // Find employee by employee ID
      const [employee] = await db.select()
        .from(employees)
        .where(eq(employees.employeeId, employeeId));
      
      if (!employee) {
        return { 
          success: false, 
          message: "Employee ID not found in our records" 
        };
      }
      
      // Check if already verified by another user
      if (employee.userId && employee.userId !== userId) {
        return { 
          success: false, 
          message: "This employee account is already linked to another user" 
        };
      }
      
      // Update verification attempts
      await db.update(employees)
        .set({
          verificationAttempts: (employee.verificationAttempts || 0) + 1,
          lastVerificationAttempt: new Date(),
        })
        .where(eq(employees.id, employee.id));
      
      // Check if too many attempts
      if ((employee.verificationAttempts || 0) >= 5) {
        return { 
          success: false, 
          message: "Too many verification attempts. Please contact HR." 
        };
      }
      
      // Verify last name (case insensitive)
      if (employee.lastName.toLowerCase() !== lastName.toLowerCase()) {
        return { 
          success: false, 
          message: "Last name does not match our records" 
        };
      }
      
      // Verify DOB
      const employeeDob = new Date(employee.dateOfBirth);
      if (
        employeeDob.getFullYear() !== dob.getFullYear() ||
        employeeDob.getMonth() !== dob.getMonth() ||
        employeeDob.getDate() !== dob.getDate()
      ) {
        return { 
          success: false, 
          message: "Date of birth does not match our records" 
        };
      }
      
      // Verification successful - link user to employee
      await db.update(employees)
        .set({
          userId,
          isVerified: true,
          verifiedAt: new Date(),
          verificationAttempts: 0, // Reset attempts
        })
        .where(eq(employees.id, employee.id));
      
      return { 
        success: true, 
        message: "Verification successful! You now have access to the employee portal.",
        employee: { ...employee, userId, isVerified: true }
      };
      
    } catch (error) {
      console.error("Verification error:", error);
      return { 
        success: false, 
        message: "An error occurred during verification. Please try again." 
      };
    }
  }
  
  // Check if user is verified employee
  async getVerifiedEmployee(userId: string): Promise<any | null> {
    const [employee] = await db.select()
      .from(employees)
      .where(and(
        eq(employees.userId, userId),
        eq(employees.isVerified, true)
      ));
    
    return employee || null;
  }
  
  // Get employee by user ID
  async getEmployeeByUserId(userId: string): Promise<any | null> {
    const [employee] = await db.select()
      .from(employees)
      .where(eq(employees.userId, userId));
    
    return employee || null;
  }
}

export const employeeVerificationService = new EmployeeVerificationService();