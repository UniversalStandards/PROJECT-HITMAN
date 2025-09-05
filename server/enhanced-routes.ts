// Enhanced API routes for comprehensive government platform

import type { Express } from "express";
import { isAuthenticated } from "./replitAuth";
import { enhancedStorage } from "./enhanced-storage";
import { serviceRegistry } from "./services/service-registry";
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

  // ========== EMPLOYEE ROUTES ==========
  
  // Employee dashboard data
  app.get("/api/employee/dashboard", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await enhancedStorage.getUser(userId);
      
      if (!user?.organizationId) {
        return res.status(400).json({ message: "Employee not associated with organization" });
      }
      
      // Get employee-specific data
      const cards = await enhancedStorage.getCardsByHolder(userId);
      const expenses = await enhancedStorage.getExpenses(user.organizationId);
      const userExpenses = expenses.filter(e => e.submittedBy === userId);
      const grants = await enhancedStorage.getGrantsByManager(userId);
      
      res.json({
        cards,
        expenses: userExpenses,
        managedGrants: grants,
        organization: await enhancedStorage.getOrganization(user.organizationId)
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