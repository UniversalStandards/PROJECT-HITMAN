import { db } from "../db";
import { employees } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";
import * as bcrypt from "bcryptjs";

export class EmployeeVerificationService {
  // Parse CSV and bulk create employees with comprehensive government fields
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
      const employeeData: any = {};
      
      // Map values to headers
      headers.forEach((header, index) => {
        employeeData[header] = values[index];
      });
      
      try {
        // Parse and validate date
        const dobParts = employeeData.date_of_birth.split('/');
        const dob = new Date(
          parseInt(dobParts[2]), 
          parseInt(dobParts[0]) - 1, 
          parseInt(dobParts[1])
        );
        
        const hireDateParts = employeeData.hire_date.split('/');
        const hireDate = new Date(
          parseInt(hireDateParts[2]),
          parseInt(hireDateParts[0]) - 1,
          parseInt(hireDateParts[1])
        );
        
        // Build employee record with comprehensive fields
        const employeeRecord: any = {
          organizationId,
          employeeId: employeeData.employee_id,
          firstName: employeeData.first_name,
          lastName: employeeData.last_name,
          dateOfBirth: dob,
          email: employeeData.email,
          department: employeeData.department,
          position: employeeData.position,
          hireDate: hireDate,
          startDate: hireDate,
          employmentType: employeeData.employment_type || 'full-time',
          employmentStatus: 'active',
          isVerified: false,
          verificationAttempts: 0,
          verificationMethod: 'csv-upload',
          importSource: 'csv',
          importDate: new Date(),
        };
        
        // Add optional personal fields
        if (employeeData.middle_name) employeeRecord.middleName = employeeData.middle_name;
        if (employeeData.suffix) employeeRecord.suffix = employeeData.suffix;
        if (employeeData.phone) employeeRecord.phone = employeeData.phone;
        if (employeeData.ssn_last4) employeeRecord.ssn = employeeData.ssn_last4.slice(-4);
        
        // Add demographics
        if (employeeData.gender) employeeRecord.gender = employeeData.gender;
        if (employeeData.ethnicity) employeeRecord.ethnicity = employeeData.ethnicity;
        if (employeeData.race) {
          employeeRecord.race = employeeData.race.includes(';') 
            ? employeeData.race.split(';').map((r: string) => r.trim())
            : [employeeData.race];
        }
        if (employeeData.citizenship_status) employeeRecord.citizenshipStatus = employeeData.citizenship_status;
        if (employeeData.disability_status) employeeRecord.disabilityStatus = employeeData.disability_status;
        if (employeeData.marital_status) employeeRecord.maritalStatus = employeeData.marital_status;
        
        // Add federal employment fields
        if (employeeData.federal_grade) employeeRecord.federalGrade = employeeData.federal_grade;
        if (employeeData.federal_step) employeeRecord.federalStep = parseInt(employeeData.federal_step);
        if (employeeData.occupational_series) employeeRecord.occupationalSeries = employeeData.occupational_series;
        if (employeeData.bargaining_unit) employeeRecord.bargainingUnit = employeeData.bargaining_unit;
        if (employeeData.flsa_status) employeeRecord.flsaStatus = employeeData.flsa_status;
        if (employeeData.appointment_type) employeeRecord.appointmentType = employeeData.appointment_type;
        
        // Add security clearance
        if (employeeData.clearance_level) employeeRecord.clearanceLevel = employeeData.clearance_level;
        if (employeeData.clearance_status) employeeRecord.clearanceStatus = employeeData.clearance_status;
        
        // Add military/veteran fields
        if (employeeData.veteran_status !== undefined) {
          employeeRecord.veteranStatus = employeeData.veteran_status === 'true' || employeeData.veteran_status === '1';
        }
        if (employeeData.military_branch) employeeRecord.militaryBranch = employeeData.military_branch;
        if (employeeData.military_rank) employeeRecord.militaryRank = employeeData.military_rank;
        if (employeeData.discharge_type) employeeRecord.militaryDischargeType = employeeData.discharge_type;
        if (employeeData.disability_rating) employeeRecord.militaryDisabilityRating = parseInt(employeeData.disability_rating);
        
        // Add address fields
        if (employeeData.address) employeeRecord.address = employeeData.address;
        if (employeeData.city) employeeRecord.city = employeeData.city;
        if (employeeData.state) employeeRecord.state = employeeData.state;
        if (employeeData.zip_code) employeeRecord.zipCode = employeeData.zip_code;
        if (employeeData.county) employeeRecord.county = employeeData.county;
        
        // Add compensation fields
        if (employeeData.salary) employeeRecord.salary = parseFloat(employeeData.salary);
        if (employeeData.pay_frequency) employeeRecord.payFrequency = employeeData.pay_frequency;
        if (employeeData.locality_pay_area) employeeRecord.localityPayArea = employeeData.locality_pay_area;
        
        // Check if employee already exists
        const existing = await db.select()
          .from(employees)
          .where(eq(employees.employeeId, employeeData.employee_id));
        
        if (existing.length > 0) {
          // Update existing employee
          delete employeeRecord.organizationId; // Don't update org ID
          delete employeeRecord.verificationAttempts; // Keep existing attempts
          await db.update(employees)
            .set({
              ...employeeRecord,
              updatedAt: new Date(),
            })
            .where(eq(employees.employeeId, employeeData.employee_id));
        } else {
          // Insert new employee
          await db.insert(employees).values(employeeRecord);
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