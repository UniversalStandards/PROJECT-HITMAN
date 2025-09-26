// Enhanced API routes for comprehensive government platform

import type { Express } from "express";
import { isAuthenticated } from "./replitAuth";
import { enhancedStorage } from "./enhanced-storage";
import { serviceRegistry } from "./services/service-registry";
import bulkOperationsRouter from "./routes/bulk-operations";
import { employeeVerificationService } from "./services/employee-verification";
import { z } from "zod";
import {
  insertPaymentProviderSchema,
  insertIntegrationSchema,
  insertIssuedCardSchema,
  insertBankAccountSchema,
  insertComplianceRecordSchema,
  insertAuditLogSchema,
  insertGrantSchema,
  insertAssetSchema,
  insertProcurementSchema,
  insertCitizenServiceSchema,
  insertEnhancedTransactionSchema,
} from "@shared/schema";

export function registerEnhancedRoutes(app: Express) {
  // ========== BULK OPERATIONS ROUTES ==========
  app.use('/api', bulkOperationsRouter);
  
  // ========== CITIZEN ROUTES ==========
  
  // Public services listing
  app.get("/api/public/services", async (req, res) => {
    try {
      const services = [
        { id: 'tax-payment', name: 'Property Tax Payment', category: 'tax', description: 'Pay your property taxes online' },
        { id: 'utility-bill', name: 'Utility Bill Payment', category: 'utility', description: 'Pay water, electricity, and gas bills' },
        { id: 'permits', name: 'Permits & Licenses', category: 'permit', description: 'Apply for building permits and business licenses' },
        { id: 'court-fines', name: 'Court Fines & Fees', category: 'fine', description: 'Pay traffic tickets and court fees' },
        { id: 'parking', name: 'Parking Permits', category: 'permit', description: 'Purchase monthly or annual parking permits' },
      ];
      res.json(services);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch public services" });
    }
  });

  // Citizen payment processing
  app.post("/api/citizen/payment", async (req: any, res) => {
    try {
      const { serviceType, amount, citizenInfo, paymentMethod } = req.body;
      
      // Create citizen service record
      const service = await enhancedStorage.createCitizenService({
        organizationId: 'public', // Default public org
        serviceName: serviceType,
        serviceType: serviceType,
        citizenIdentifier: citizenInfo.accountNumber || citizenInfo.email,
        citizenName: citizenInfo.name,
        citizenEmail: citizenInfo.email,
        citizenPhone: citizenInfo.phone,
        amount: amount.toString(),
        paymentStatus: 'pending',
        paymentMethod,
      });

      // Process payment through selected provider
      const provider = serviceRegistry.getService('public', 'payment', paymentMethod);
      if (provider && provider.processPayment) {
        const result = await provider.processPayment(amount, 'USD', {
          serviceId: service.id,
          citizenEmail: citizenInfo.email
        });

        if (result.success) {
          await enhancedStorage.updateCitizenService(service.id, {
            paymentStatus: 'completed',
            transactionId: result.transactionId
          });
        }

        res.json({ success: result.success, serviceId: service.id, transactionId: result.transactionId });
      } else {
        res.status(400).json({ message: "Payment provider not available" });
      }
    } catch (error) {
      console.error("Citizen payment error:", error);
      res.status(500).json({ message: "Payment processing failed" });
    }
  });

  // Check payment status
  app.get("/api/citizen/payment/:serviceId", async (req, res) => {
    try {
      const services = await enhancedStorage.getCitizenServices('public');
      const service = services.find(s => s.id === req.params.serviceId);
      
      if (!service) {
        return res.status(404).json({ message: "Service record not found" });
      }
      
      res.json(service);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payment status" });
    }
  });

  // ========== VENDOR ROUTES ==========
  
  // Vendor registration
  app.post("/api/vendor/register", async (req, res) => {
    try {
      const vendorData = req.body;
      
      // Perform compliance screening
      const complianceService = serviceRegistry.getService('public', 'compliance', 'thomson_reuters');
      if (complianceService) {
        const screening = await complianceService.verifyBusiness(vendorData);
        
        if (!screening.approved) {
          return res.status(400).json({ message: "Vendor failed compliance screening", details: screening });
        }
      }
      
      // Create vendor record
      const vendor = await enhancedStorage.createVendor({
        ...vendorData,
        organizationId: 'public',
        status: 'pending_approval'
      });
      
      res.json({ success: true, vendorId: vendor.id, status: vendor.status });
    } catch (error) {
      console.error("Vendor registration error:", error);
      res.status(500).json({ message: "Vendor registration failed" });
    }
  });

  // Get open procurements (public)
  app.get("/api/vendor/procurements", async (req, res) => {
    try {
      const procurements = await enhancedStorage.getOpenProcurements('public');
      res.json(procurements);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch procurements" });
    }
  });

  // Submit bid
  app.post("/api/vendor/bid", isAuthenticated, async (req: any, res) => {
    try {
      const { procurementId, bidAmount, proposal } = req.body;
      
      // Create bid record (simplified - would be more complex)
      const procurement = await enhancedStorage.getProcurement(procurementId);
      if (!procurement) {
        return res.status(404).json({ message: "Procurement not found" });
      }
      
      // Process bid submission
      const eProcurement = serviceRegistry.getService('public', 'specialized', 'eprocurement');
      const bidResult = await eProcurement.manageBidding(procurementId, {
        vendorId: req.user.claims.sub,
        bidAmount,
        proposal
      });
      
      res.json({ success: true, bidStatus: bidResult });
    } catch (error) {
      console.error("Bid submission error:", error);
      res.status(500).json({ message: "Bid submission failed" });
    }
  });

  // ========== CARD MANAGEMENT ROUTES ==========
  
  // Get all issued cards (admin)
  app.get("/api/cards", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await enhancedStorage.getUser(userId);
      
      if ((user as any)?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const cards = await enhancedStorage.getIssuedCards(user.organizationId);
      res.json(cards || []);
    } catch (error) {
      console.error("Cards fetch error:", error);
      res.status(500).json({ message: "Failed to fetch cards" });
    }
  });
  
  // Issue new card
  app.post("/api/cards/issue", isAuthenticated, async (req: any, res) => {
    try {
      const { holderName, employeeId, cardType, spendingLimit, limitPeriod, department } = req.body;
      const userId = req.user.claims.sub;
      const user = await enhancedStorage.getUser(userId);
      
      if ((user as any)?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      // Issue card through Stripe provider
      const provider = serviceRegistry.getService(user.organizationId, 'payment', 'stripe');
      if (provider && provider.issueCard) {
        const limits = { [limitPeriod]: spendingLimit };
        const cardResult = await provider.issueCard(holderName, cardType, limits);
        
        if (cardResult.success) {
          // Store card in database
          await enhancedStorage.saveIssuedCard({
            id: cardResult.cardId,
            organizationId: user.organizationId,
            holderName,
            employeeId,
            cardType,
            cardNumber: cardResult.cardNumber,
            expiryDate: cardResult.expiryDate,
            status: cardResult.status || 'active',
            spendingLimit,
            limitPeriod,
            department,
            issuedAt: new Date(),
            currentSpend: 0,
          });
          
          res.json(cardResult);
        } else {
          res.status(400).json({ message: cardResult.error });
        }
      } else {
        res.status(400).json({ message: "Card issuance not available" });
      }
    } catch (error) {
      console.error("Card issuance error:", error);
      res.status(500).json({ message: "Failed to issue card" });
    }
  });
  
  // Freeze/Unfreeze card
  app.patch("/api/cards/:cardId/:action", isAuthenticated, async (req: any, res) => {
    try {
      const { cardId, action } = req.params;
      const userId = req.user.claims.sub;
      const user = await enhancedStorage.getUser(userId);
      
      if ((user as any)?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      if (action !== 'freeze' && action !== 'unfreeze') {
        return res.status(400).json({ message: "Invalid action" });
      }
      
      // Update card status
      await enhancedStorage.updateCardStatus(cardId, action === 'freeze' ? 'frozen' : 'active');
      res.json({ success: true, message: `Card ${action}d successfully` });
    } catch (error) {
      console.error("Card status update error:", error);
      res.status(500).json({ message: "Failed to update card status" });
    }
  });

  // ========== DIRECT DEPOSIT ROUTES ==========
  
  // Get direct deposit transfers
  app.get("/api/direct-deposits", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await enhancedStorage.getUser(userId);
      
      if ((user as any)?.role === 'admin') {
        const transfers = await enhancedStorage.getACHTransfers(user.organizationId);
        res.json(transfers || []);
      } else {
        // Employee sees only their deposits
        const transfers = await enhancedStorage.getEmployeeDeposits(userId);
        res.json(transfers || []);
      }
    } catch (error) {
      console.error("Direct deposits fetch error:", error);
      res.status(500).json({ message: "Failed to fetch direct deposits" });
    }
  });
  
  // Process ACH transfer
  app.post("/api/direct-deposits/transfer", isAuthenticated, async (req: any, res) => {
    try {
      const transferData = req.body;
      const userId = req.user.claims.sub;
      const user = await enhancedStorage.getUser(userId);
      
      if ((user as any)?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      // Process through provider
      const provider = serviceRegistry.getService(user.organizationId, 'payment', 'stripe');
      if (provider && provider.processACH) {
        const result = await provider.processACH(
          transferData.amount,
          'main-account', // From account
          transferData.recipientAccount,
          transferData.transferSpeed
        );
        
        if (result.success) {
          // Store transfer record
          await enhancedStorage.saveACHTransfer({
            ...transferData,
            organizationId: user.organizationId,
            transferId: result.transferId,
            status: result.status,
            estimatedSettlement: result.estimatedSettlement,
            fees: result.fees,
            createdAt: new Date(),
          });
          
          res.json(result);
        } else {
          res.status(400).json({ message: result.error });
        }
      } else {
        res.status(400).json({ message: "ACH transfers not available" });
      }
    } catch (error) {
      console.error("ACH transfer error:", error);
      res.status(500).json({ message: "Failed to process ACH transfer" });
    }
  });
  
  // Employee direct deposit enrollment
  app.get("/api/direct-deposit/enrollment", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const employee = await employeeVerificationService.getEmployeeByUserId(userId);
      
      if (!employee) {
        return res.json({ isEnrolled: false });
      }
      
      const enrollment = await enhancedStorage.getDirectDepositEnrollment(employee.id);
      res.json(enrollment || { isEnrolled: false });
    } catch (error) {
      console.error("Enrollment fetch error:", error);
      res.status(500).json({ message: "Failed to fetch enrollment status" });
    }
  });
  
  // Enroll in direct deposit
  app.post("/api/direct-deposit/enroll", isAuthenticated, async (req: any, res) => {
    try {
      const enrollmentData = req.body;
      const userId = req.user.claims.sub;
      const employee = await employeeVerificationService.getEmployeeByUserId(userId);
      
      if (!employee) {
        return res.status(400).json({ message: "Employee verification required" });
      }
      
      // Save enrollment
      await enhancedStorage.saveDirectDepositEnrollment({
        employeeId: employee.id,
        ...enrollmentData,
        isEnrolled: true,
        enrolledAt: new Date(),
        last4: enrollmentData.accountNumber.slice(-4),
      });
      
      res.json({ success: true, message: "Direct deposit enrollment successful" });
    } catch (error) {
      console.error("Enrollment error:", error);
      res.status(500).json({ message: "Failed to enroll in direct deposit" });
    }
  });

  // ========== PAYMENT HUB ROUTES ==========
  
  // Get payment providers status
  app.get("/api/payment-providers", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await enhancedStorage.getUser(userId);
      
      const providers = [
        { name: 'stripe', status: 'active', methods: ['ach', 'wire', 'card'] },
        { name: 'paypal', status: 'active', methods: ['instant', 'card'] },
        { name: 'dwolla', status: 'active', methods: ['ach'] },
        { name: 'wise', status: 'inactive', methods: ['wire', 'international'] },
        { name: 'square', status: 'inactive', methods: ['card', 'ach'] },
      ];
      
      res.json(providers);
    } catch (error) {
      console.error("Providers fetch error:", error);
      res.status(500).json({ message: "Failed to fetch providers" });
    }
  });
  
  // Get all payments
  app.get("/api/payments/all", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await enhancedStorage.getUser(userId);
      
      if ((user as any)?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const payments = await enhancedStorage.getPayments(user.organizationId);
      res.json(payments || []);
    } catch (error) {
      console.error("Payments fetch error:", error);
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });
  
  // Process unified payment
  app.post("/api/payments/process", isAuthenticated, async (req: any, res) => {
    try {
      const paymentData = req.body;
      const userId = req.user.claims.sub;
      const user = await enhancedStorage.getUser(userId);
      
      if ((user as any)?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      // Process through selected provider
      const provider = serviceRegistry.getService(
        user.organizationId, 
        'payment', 
        paymentData.provider
      );
      
      if (!provider) {
        return res.status(400).json({ message: "Payment provider not available" });
      }
      
      let result;
      
      // Route to appropriate payment method
      if (paymentData.paymentMethod === 'ach') {
        result = await provider.processACH?.(
          paymentData.amount,
          'main-account',
          paymentData.recipientAccount,
          'standard'
        );
      } else if (paymentData.paymentMethod === 'wire') {
        result = await provider.processWire?.(
          paymentData.amount,
          'main-account',
          paymentData.recipientAccount,
          paymentData.currency === 'USD' ? 'domestic' : 'international'
        );
      } else {
        result = await provider.processPayment?.(
          paymentData.amount,
          paymentData.currency,
          paymentData
        );
      }
      
      if (result?.success) {
        // Store payment record
        await enhancedStorage.savePayment({
          ...paymentData,
          organizationId: user.organizationId,
          transactionId: result.transactionId,
          status: 'completed',
          createdAt: new Date(),
        });
        
        res.json(result);
      } else {
        res.status(400).json({ message: result?.error || "Payment failed" });
      }
    } catch (error) {
      console.error("Payment processing error:", error);
      res.status(500).json({ message: "Failed to process payment" });
    }
  });
  
  // Schedule payment
  app.post("/api/payments/schedule", isAuthenticated, async (req: any, res) => {
    try {
      const scheduleData = req.body;
      const userId = req.user.claims.sub;
      const user = await enhancedStorage.getUser(userId);
      
      if ((user as any)?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      // Save scheduled payment
      await enhancedStorage.saveScheduledPayment({
        ...scheduleData,
        organizationId: user.organizationId,
        status: 'scheduled',
        createdAt: new Date(),
      });
      
      res.json({ success: true, message: "Payment scheduled successfully" });
    } catch (error) {
      console.error("Schedule payment error:", error);
      res.status(500).json({ message: "Failed to schedule payment" });
    }
  });
  
  // Get scheduled payments
  app.get("/api/payments/scheduled", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await enhancedStorage.getUser(userId);
      
      if ((user as any)?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const scheduled = await enhancedStorage.getScheduledPayments(user.organizationId);
      res.json(scheduled || []);
    } catch (error) {
      console.error("Scheduled payments fetch error:", error);
      res.status(500).json({ message: "Failed to fetch scheduled payments" });
    }
  });

  // ========== EMPLOYEE ROUTES ==========
  
  // Check if user is verified employee
  app.get("/api/employee/verification-status", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const employee = await employeeVerificationService.getEmployeeByUserId(userId);
      
      res.json({
        isVerified: employee?.isVerified || false,
        employee: employee || null,
        requiresVerification: !employee || !employee.isVerified
      });
    } catch (error) {
      console.error("Verification status error:", error);
      res.status(500).json({ message: "Failed to check verification status" });
    }
  });
  
  // Verify employee identity
  app.post("/api/employee/verify", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { employeeId, lastName, dateOfBirth } = req.body;
      
      if (!employeeId || !lastName || !dateOfBirth) {
        return res.status(400).json({ message: "Missing required verification fields" });
      }
      
      const result = await employeeVerificationService.verifyEmployee(
        userId, 
        employeeId, 
        lastName, 
        dateOfBirth
      );
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error("Employee verification error:", error);
      res.status(500).json({ message: "Failed to verify employee" });
    }
  });
  
  // Employee dashboard data (requires verification)
  app.get("/api/employee/dashboard", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const employee = await employeeVerificationService.getVerifiedEmployee(userId);
      
      // Require verification
      if (!employee) {
        return res.json({
          cards: [],
          expenses: [],
          managedGrants: [],
          organization: null,
          requiresVerification: true,
          message: "Please verify your employee information to access the dashboard."
        });
      }
      
      // Get employee-specific data
      const cards = await enhancedStorage.getCardsByHolder(userId);
      const expenses = await enhancedStorage.getExpenses(employee.organizationId);
      const userExpenses = expenses.filter(e => e.submittedBy === userId);
      const grants = await enhancedStorage.getGrantsByManager(userId);
      
      res.json({
        cards,
        expenses: userExpenses,
        managedGrants: grants,
        organization: await enhancedStorage.getOrganization(employee.organizationId),
        employee,
        requiresVerification: false
      });
    } catch (error) {
      console.error("Employee dashboard error:", error);
      res.status(500).json({ message: "Failed to fetch employee dashboard" });
    }
  });

  // Request card issuance
  app.post("/api/employee/card/request", isAuthenticated, async (req: any, res) => {
    try {
      const { cardType, spendingLimit, justification } = req.body;
      const userId = req.user.claims.sub;
      const user = await enhancedStorage.getUser(userId);
      
      if (!user?.organizationId) {
        return res.status(400).json({ message: "Employee not associated with organization" });
      }
      
      // Issue card through provider
      const provider = serviceRegistry.getService(user.organizationId, 'payment', 'stripe');
      if (provider && provider.issueCard) {
        const cardResult = await provider.issueCard(
          `${user.firstName} ${user.lastName}`,
          cardType,
          { monthly: spendingLimit }
        );
        
        if (cardResult.success) {
          // Save card record
          const card = await enhancedStorage.createIssuedCard({
            cardNumber: cardResult.cardNumber!,
            cardType: cardType as any,
            holderName: `${user.firstName} ${user.lastName}`,
            holderId: userId,
            organizationId: user.organizationId,
            provider: 'stripe',
            externalCardId: cardResult.cardId,
            monthlyLimit: spendingLimit.toString(),
            status: 'pending'
          });
          
          res.json({ success: true, cardId: card.id });
        } else {
          res.status(400).json({ message: cardResult.error });
        }
      } else {
        res.status(400).json({ message: "Card issuance not available" });
      }
    } catch (error) {
      console.error("Card request error:", error);
      res.status(500).json({ message: "Card request failed" });
    }
  });

  // ========== ADMINISTRATOR ROUTES ==========
  
  // Upload employees CSV
  app.post("/api/admin/employees/upload", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await enhancedStorage.getUser(userId);
      
      // Check admin role
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      if (!user?.organizationId) {
        return res.status(400).json({ message: "Admin must be associated with an organization" });
      }
      
      const { csvData } = req.body;
      if (!csvData) {
        return res.status(400).json({ message: "CSV data is required" });
      }
      
      const result = await employeeVerificationService.uploadEmployees(
        csvData,
        user.organizationId
      );
      
      res.json({
        message: `Successfully uploaded ${result.success} employees`,
        success: result.success,
        errors: result.errors
      });
    } catch (error) {
      console.error("Employee upload error:", error);
      res.status(500).json({ message: error.message || "Failed to upload employees" });
    }
  });
  
  // Get all employees for admin
  app.get("/api/admin/employees", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await enhancedStorage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      if (!user?.organizationId) {
        return res.status(400).json({ message: "Admin must be associated with an organization" });
      }
      
      const employees = await enhancedStorage.getEmployees(user.organizationId);
      res.json(employees);
    } catch (error) {
      console.error("Get employees error:", error);
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });
  
  // Get comprehensive analytics
  app.get("/api/admin/analytics", isAuthenticated, async (req: any, res) => {
    try {
      const user = await enhancedStorage.getUser(req.user.claims.sub);
      
      if (!user?.organizationId || user.role !== 'admin') {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const analytics = await enhancedStorage.getComprehensiveAnalytics(user.organizationId);
      const providerStats = await enhancedStorage.getProviderAnalytics(user.organizationId);
      const complianceStats = await enhancedStorage.getComplianceAnalytics(user.organizationId);
      const grantStats = await enhancedStorage.getGrantAnalytics(user.organizationId);
      
      res.json({
        overview: analytics,
        providers: providerStats,
        compliance: complianceStats,
        grants: grantStats
      });
    } catch (error) {
      console.error("Analytics error:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Configure payment provider
  app.post("/api/admin/providers", isAuthenticated, async (req: any, res) => {
    try {
      const user = await enhancedStorage.getUser(req.user.claims.sub);
      
      if (!user?.organizationId || user.role !== 'admin') {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const validatedData = insertPaymentProviderSchema.parse({
        ...req.body,
        organizationId: user.organizationId
      });
      
      // Register with service registry
      await serviceRegistry.registerService({
        organizationId: user.organizationId,
        serviceType: 'payment',
        provider: validatedData.provider,
        configuration: validatedData.configuration as any,
        isActive: validatedData.isActive || true
      });
      
      // Save to database
      const provider = await enhancedStorage.createPaymentProvider(validatedData);
      
      res.json({ success: true, provider });
    } catch (error) {
      console.error("Provider configuration error:", error);
      res.status(500).json({ message: "Failed to configure provider" });
    }
  });

  // Configure integration
  app.post("/api/admin/integrations", isAuthenticated, async (req: any, res) => {
    try {
      const user = await enhancedStorage.getUser(req.user.claims.sub);
      
      if (!user?.organizationId || user.role !== 'admin') {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const validatedData = insertIntegrationSchema.parse({
        ...req.body,
        organizationId: user.organizationId
      });
      
      // Register with service registry
      await serviceRegistry.registerService({
        organizationId: user.organizationId,
        serviceType: validatedData.type as string,
        provider: validatedData.provider,
        configuration: validatedData.configuration as any,
        isActive: true
      });
      
      // Save to database
      const integration = await enhancedStorage.createIntegration(validatedData);
      
      res.json({ success: true, integration });
    } catch (error) {
      console.error("Integration configuration error:", error);
      res.status(500).json({ message: "Failed to configure integration" });
    }
  });

  // System health check
  app.get("/api/admin/health", isAuthenticated, async (req: any, res) => {
    try {
      const user = await enhancedStorage.getUser(req.user.claims.sub);
      
      if (!user?.organizationId || user.role !== 'admin') {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const health = await serviceRegistry.healthCheck(user.organizationId);
      res.json(health);
    } catch (error) {
      console.error("Health check error:", error);
      res.status(500).json({ message: "Health check failed" });
    }
  });

  // ========== COMPLIANCE ROUTES ==========
  
  // Screen entity
  app.post("/api/compliance/screen", isAuthenticated, async (req: any, res) => {
    try {
      const { entityType, entityId, entityData } = req.body;
      const user = await enhancedStorage.getUser(req.user.claims.sub);
      
      if (!user?.organizationId) {
        return res.status(400).json({ message: "Organization not found" });
      }
      
      // Run multiple compliance checks
      const providers = ['thomson_reuters', 'lexisnexis', 'verafin', 'ofac'];
      const results = [];
      
      for (const providerName of providers) {
        const provider = serviceRegistry.getService(user.organizationId, 'compliance', providerName);
        if (provider && provider.screenEntity) {
          const result = await provider.screenEntity(entityType, entityData);
          results.push({ provider: providerName, result });
        }
      }
      
      // Calculate aggregate risk score
      const avgRiskScore = results.reduce((sum, r) => sum + (r.result.riskScore || 0), 0) / results.length;
      const requiresReview = avgRiskScore > 5;
      const approved = avgRiskScore <= 7 && !results.some(r => !r.result.approved);
      
      // Save compliance record
      const record = await enhancedStorage.createComplianceRecord({
        entityType,
        entityId,
        organizationId: user.organizationId,
        screeningType: 'comprehensive',
        status: requiresReview ? 'pending_review' : (approved ? 'compliant' : 'non_compliant'),
        provider: 'multi_provider',
        results: results as any,
        riskScore: Math.round(avgRiskScore),
        flags: results.flatMap(r => r.result.flags || [])
      });
      
      res.json({
        success: true,
        recordId: record.id,
        approved,
        riskScore: avgRiskScore,
        requiresReview,
        results
      });
    } catch (error) {
      console.error("Compliance screening error:", error);
      res.status(500).json({ message: "Compliance screening failed" });
    }
  });

  // ========== AUDIT ROUTES ==========
  
  // Get audit trail
  app.get("/api/audit/trail/:entityType/:entityId", isAuthenticated, async (req: any, res) => {
    try {
      const { entityType, entityId } = req.params;
      const logs = await enhancedStorage.getAuditLogsByEntity(entityType, entityId);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch audit trail" });
    }
  });

  // Log audit event
  app.post("/api/audit/log", isAuthenticated, async (req: any, res) => {
    try {
      const user = await enhancedStorage.getUser(req.user.claims.sub);
      
      if (!user?.organizationId) {
        return res.status(400).json({ message: "Organization not found" });
      }
      
      const log = await enhancedStorage.createAuditLog({
        ...req.body,
        organizationId: user.organizationId,
        userId: req.user.claims.sub,
        ipAddress: req.ip
      });
      
      res.json({ success: true, logId: log.id });
    } catch (error) {
      res.status(500).json({ message: "Failed to create audit log" });
    }
  });

  // ========== GRANT ROUTES ==========
  
  // Create grant application
  app.post("/api/grants", isAuthenticated, async (req: any, res) => {
    try {
      const user = await enhancedStorage.getUser(req.user.claims.sub);
      
      if (!user?.organizationId) {
        return res.status(400).json({ message: "Organization not found" });
      }
      
      const validatedData = insertGrantSchema.parse({
        ...req.body,
        organizationId: user.organizationId,
        managedBy: req.user.claims.sub
      });
      
      const grant = await enhancedStorage.createGrant(validatedData);
      res.json(grant);
    } catch (error) {
      console.error("Grant creation error:", error);
      res.status(500).json({ message: "Failed to create grant" });
    }
  });

  // Get active grants
  app.get("/api/grants/active", isAuthenticated, async (req: any, res) => {
    try {
      const user = await enhancedStorage.getUser(req.user.claims.sub);
      
      if (!user?.organizationId) {
        return res.status(400).json({ message: "Organization not found" });
      }
      
      const grants = await enhancedStorage.getActiveGrants(user.organizationId);
      res.json(grants);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch active grants" });
    }
  });

  // ========== ASSET ROUTES ==========
  
  // Get assets
  app.get("/api/assets", isAuthenticated, async (req: any, res) => {
    try {
      const user = await enhancedStorage.getUser(req.user.claims.sub);
      
      if (!user?.organizationId) {
        return res.status(400).json({ message: "Organization not found" });
      }
      
      const { category } = req.query;
      const assets = category 
        ? await enhancedStorage.getAssetsByCategory(user.organizationId, category as string)
        : await enhancedStorage.getAssets(user.organizationId);
      
      res.json(assets);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch assets" });
    }
  });

  // Schedule maintenance
  app.post("/api/assets/maintenance", isAuthenticated, async (req: any, res) => {
    try {
      const { assetIds, maintenanceType } = req.body;
      
      // Use asset management service
      const assetService = serviceRegistry.getService('public', 'specialized', 'asset_management');
      const schedule = await assetService.scheduleMaintenance(assetIds, maintenanceType);
      
      res.json({ success: true, schedule });
    } catch (error) {
      console.error("Maintenance scheduling error:", error);
      res.status(500).json({ message: "Failed to schedule maintenance" });
    }
  });

  // ========== PROCUREMENT ROUTES ==========
  
  // Create RFP
  app.post("/api/procurement/rfp", isAuthenticated, async (req: any, res) => {
    try {
      const user = await enhancedStorage.getUser(req.user.claims.sub);
      
      if (!user?.organizationId) {
        return res.status(400).json({ message: "Organization not found" });
      }
      
      const validatedData = insertProcurementSchema.parse({
        ...req.body,
        organizationId: user.organizationId,
        managedBy: req.user.claims.sub,
        procurementNumber: `RFP-${Date.now()}`
      });
      
      const procurement = await enhancedStorage.createProcurement(validatedData);
      
      // Create RFP through e-procurement service
      const eProcurement = serviceRegistry.getService('public', 'specialized', 'eprocurement');
      const rfp = await eProcurement.createRFP(procurement);
      
      res.json({ success: true, procurement, rfp });
    } catch (error) {
      console.error("RFP creation error:", error);
      res.status(500).json({ message: "Failed to create RFP" });
    }
  });

  // ========== TREASURY ROUTES ==========
  
  // Cash flow forecasting
  app.get("/api/treasury/cashflow", isAuthenticated, async (req: any, res) => {
    try {
      const user = await enhancedStorage.getUser(req.user.claims.sub);
      
      if (!user?.organizationId) {
        return res.status(400).json({ message: "Organization not found" });
      }
      
      // Get historical transaction data
      const transactions = await enhancedStorage.getEnhancedTransactions(user.organizationId);
      
      // Use treasury management service
      const treasuryService = serviceRegistry.getService('public', 'treasury', 'treasury_management');
      const forecast = await treasuryService.cashFlowForecasting(transactions);
      
      res.json(forecast);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate cash flow forecast" });
    }
  });

  // ========== UTILITY & TAX ROUTES ==========
  
  // Process utility payment
  app.post("/api/utility/payment", async (req, res) => {
    try {
      const { accountNumber, amount, utilityType } = req.body;
      
      const utilityService = serviceRegistry.getService('public', 'specialized', 'utility_billing');
      const payment = await utilityService.processUtilityPayments({
        accountNumber,
        paymentAmount: amount,
        utilityType
      });
      
      res.json(payment);
    } catch (error) {
      console.error("Utility payment error:", error);
      res.status(500).json({ message: "Utility payment failed" });
    }
  });

  // Process property tax payment
  app.post("/api/tax/property", async (req, res) => {
    try {
      const { parcelNumber, amount, taxYear } = req.body;
      
      const taxService = serviceRegistry.getService('public', 'specialized', 'property_tax');
      const payment = await taxService.processPayments({
        parcelNumber,
        paymentAmount: amount,
        taxYear
      });
      
      res.json(payment);
    } catch (error) {
      console.error("Property tax payment error:", error);
      res.status(500).json({ message: "Property tax payment failed" });
    }
  });

  // ========== COURT SYSTEM ROUTES ==========
  
  // Process court fine payment
  app.post("/api/court/fine", async (req, res) => {
    try {
      const { caseNumber, amount, fineType } = req.body;
      
      const courtService = serviceRegistry.getService('public', 'specialized', 'court_system');
      const payment = await courtService.processFines({
        caseNumber,
        amount,
        fineType
      });
      
      res.json(payment);
    } catch (error) {
      console.error("Court fine payment error:", error);
      res.status(500).json({ message: "Court fine payment failed" });
    }
  });

  // ========== REPORTING ROUTES ==========
  
  // Generate comprehensive report
  app.post("/api/reports/generate", isAuthenticated, async (req: any, res) => {
    try {
      const { reportType, period, format } = req.body;
      const user = await enhancedStorage.getUser(req.user.claims.sub);
      
      if (!user?.organizationId) {
        return res.status(400).json({ message: "Organization not found" });
      }
      
      // Use appropriate reporting service based on type
      let report;
      switch (reportType) {
        case 'gasb':
          const workiva = serviceRegistry.getService(user.organizationId, 'audit', 'workiva');
          report = await workiva.generateGASBReport({ period, organizationId: user.organizationId });
          break;
        case 'audit':
          const datasnipper = serviceRegistry.getService(user.organizationId, 'audit', 'datasnipper');
          report = await datasnipper.generateAuditReport(`audit_${Date.now()}`);
          break;
        case 'financial':
          const quickbooks = serviceRegistry.getService(user.organizationId, 'government', 'quickbooks');
          report = await quickbooks.getFinancialReports('comprehensive', period);
          break;
        default:
          report = { type: reportType, period, data: 'Report data placeholder' };
      }
      
      res.json({ success: true, report });
    } catch (error) {
      console.error("Report generation error:", error);
      res.status(500).json({ message: "Report generation failed" });
    }
  });
}