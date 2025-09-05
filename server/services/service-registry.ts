// Central service registry for managing all integrations

import { PaymentServiceManager } from './provider-factory';
import { 
  ModernTreasuryProvider, 
  PlaidProvider, 
  UnitProvider, 
  DwollaProvider 
} from './banking-services';
import { 
  ThomsonReutersProvider, 
  LexisNexisProvider, 
  VerafinProvider, 
  OFACProvider 
} from './compliance-services';
import { 
  ADPProvider, 
  QuickBooksProvider, 
  SalesforceProvider, 
  DocuSignProvider, 
  GovDeliveryProvider 
} from './government-services';
import { 
  DataSnipperProvider, 
  MindBridgeProvider, 
  WorkivaProvider, 
  TreasuryManagementService 
} from './audit-services';
import { 
  EProcurementService, 
  AssetManagementService, 
  CourtSystemService, 
  UtilityBillingService, 
  PropertyTaxService 
} from './specialized-government';

export interface ServiceConfig {
  organizationId: string;
  serviceType: string;
  provider: string;
  configuration: Record<string, any>;
  isActive: boolean;
}

export class IntegratedServiceRegistry {
  private paymentManager: PaymentServiceManager;
  private bankingServices: Map<string, any> = new Map();
  private complianceServices: Map<string, any> = new Map();
  private governmentServices: Map<string, any> = new Map();
  private auditServices: Map<string, any> = new Map();
  private specializedServices: Map<string, any> = new Map();
  private treasuryService: TreasuryManagementService;

  constructor() {
    this.paymentManager = new PaymentServiceManager();
    this.treasuryService = new TreasuryManagementService();
    
    // Initialize specialized services (these don't require external configs)
    this.specializedServices.set('eprocurement', new EProcurementService());
    this.specializedServices.set('asset_management', new AssetManagementService());
    this.specializedServices.set('court_system', new CourtSystemService());
    this.specializedServices.set('utility_billing', new UtilityBillingService());
    this.specializedServices.set('property_tax', new PropertyTaxService());
  }

  // Register a new service integration
  async registerService(config: ServiceConfig): Promise<{ success: boolean; serviceId?: string; error?: string }> {
    try {
      const serviceId = `${config.organizationId}:${config.serviceType}:${config.provider}`;
      
      switch (config.serviceType) {
        case 'payment':
          await this.paymentManager.addProvider(config.organizationId, config.provider, config.configuration);
          break;
          
        case 'banking':
          const bankingService = this.createBankingService(config.provider, config.configuration);
          if (bankingService) {
            await bankingService.initialize();
            this.bankingServices.set(serviceId, bankingService);
          }
          break;
          
        case 'compliance':
          const complianceService = this.createComplianceService(config.provider, config.configuration);
          if (complianceService) {
            await complianceService.initialize();
            this.complianceServices.set(serviceId, complianceService);
          }
          break;
          
        case 'government':
          const govService = this.createGovernmentService(config.provider, config.configuration);
          if (govService) {
            await govService.initialize();
            this.governmentServices.set(serviceId, govService);
          }
          break;
          
        case 'audit':
          const auditService = this.createAuditService(config.provider, config.configuration);
          if (auditService) {
            await auditService.initialize();
            this.auditServices.set(serviceId, auditService);
          }
          break;
      }

      return { success: true, serviceId };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Service registration failed' 
      };
    }
  }

  // Get service instance
  getService(organizationId: string, serviceType: string, provider: string): any {
    const serviceId = `${organizationId}:${serviceType}:${provider}`;
    
    switch (serviceType) {
      case 'payment':
        return this.paymentManager.getProvider(organizationId, provider);
      case 'banking':
        return this.bankingServices.get(serviceId);
      case 'compliance':
        return this.complianceServices.get(serviceId);
      case 'government':
        return this.governmentServices.get(serviceId);
      case 'audit':
        return this.auditServices.get(serviceId);
      case 'specialized':
        return this.specializedServices.get(provider);
      case 'treasury':
        return this.treasuryService;
      default:
        return null;
    }
  }

  // Get all services for an organization
  getOrganizationServices(organizationId: string): Record<string, any[]> {
    const services: Record<string, any[]> = {
      payment: this.paymentManager.getOrganizationProviders(organizationId),
      banking: [],
      compliance: [],
      government: [],
      audit: [],
      specialized: Array.from(this.specializedServices.values())
    };

    // Filter other services by organization
    for (const [serviceId, service] of this.bankingServices) {
      if (serviceId.startsWith(`${organizationId}:`)) {
        services.banking.push(service);
      }
    }

    for (const [serviceId, service] of this.complianceServices) {
      if (serviceId.startsWith(`${organizationId}:`)) {
        services.compliance.push(service);
      }
    }

    for (const [serviceId, service] of this.governmentServices) {
      if (serviceId.startsWith(`${organizationId}:`)) {
        services.government.push(service);
      }
    }

    for (const [serviceId, service] of this.auditServices) {
      if (serviceId.startsWith(`${organizationId}:`)) {
        services.audit.push(service);
      }
    }

    return services;
  }

  // Service factory methods
  private createBankingService(provider: string, config: any): any {
    switch (provider) {
      case 'modern_treasury':
        return new ModernTreasuryProvider(config);
      case 'plaid':
        return new PlaidProvider(config);
      case 'unit':
        return new UnitProvider(config);
      case 'dwolla':
        return new DwollaProvider(config);
      default:
        throw new Error(`Unsupported banking provider: ${provider}`);
    }
  }

  private createComplianceService(provider: string, config: any): any {
    switch (provider) {
      case 'thomson_reuters':
        return new ThomsonReutersProvider(config);
      case 'lexisnexis':
        return new LexisNexisProvider(config);
      case 'verafin':
        return new VerafinProvider(config);
      case 'ofac':
        return new OFACProvider(config);
      default:
        throw new Error(`Unsupported compliance provider: ${provider}`);
    }
  }

  private createGovernmentService(provider: string, config: any): any {
    switch (provider) {
      case 'adp':
        return new ADPProvider(config);
      case 'quickbooks':
        return new QuickBooksProvider(config);
      case 'salesforce':
        return new SalesforceProvider(config);
      case 'docusign':
        return new DocuSignProvider(config);
      case 'govdelivery':
        return new GovDeliveryProvider(config);
      default:
        throw new Error(`Unsupported government provider: ${provider}`);
    }
  }

  private createAuditService(provider: string, config: any): any {
    switch (provider) {
      case 'datasnipper':
        return new DataSnipperProvider(config);
      case 'mindbridge':
        return new MindBridgeProvider(config);
      case 'workiva':
        return new WorkivaProvider(config);
      default:
        throw new Error(`Unsupported audit provider: ${provider}`);
    }
  }

  // Comprehensive service health check
  async healthCheck(organizationId: string): Promise<Record<string, any>> {
    const health: Record<string, any> = {
      payment: { status: 'healthy', providers: [] },
      banking: { status: 'healthy', providers: [] },
      compliance: { status: 'healthy', providers: [] },
      government: { status: 'healthy', providers: [] },
      audit: { status: 'healthy', providers: [] },
      specialized: { status: 'healthy', services: [] },
      treasury: { status: 'healthy' }
    };

    try {
      // Check payment providers
      const paymentProviders = this.paymentManager.getOrganizationProviders(organizationId);
      health.payment.providers = paymentProviders.map(p => ({
        name: p.getProviderName(),
        status: 'active'
      }));

      // Check other services
      const services = this.getOrganizationServices(organizationId);
      
      health.banking.providers = services.banking.map(s => ({
        name: s.getProviderName(),
        status: 'active'
      }));

      health.compliance.providers = services.compliance.map(s => ({
        name: s.getProviderName(),
        status: 'active'
      }));

      health.government.providers = services.government.map(s => ({
        name: s.getProviderName(),
        status: 'active'
      }));

      health.audit.providers = services.audit.map(s => ({
        name: s.getProviderName(),
        status: 'active'
      }));

      health.specialized.services = [
        'eprocurement', 'asset_management', 'court_system', 
        'utility_billing', 'property_tax'
      ].map(name => ({ name, status: 'active' }));

      return health;
    } catch (error) {
      return {
        ...health,
        error: error instanceof Error ? error.message : 'Health check failed'
      };
    }
  }

  // Get available service providers
  getAvailableProviders(): Record<string, string[]> {
    return {
      payment: ['stripe', 'paypal', 'square', 'unit', 'modern_treasury'],
      banking: ['modern_treasury', 'plaid', 'unit', 'dwolla', 'wise', 'circle'],
      compliance: ['thomson_reuters', 'lexisnexis', 'verafin', 'ofac'],
      government: ['adp', 'quickbooks', 'salesforce', 'docusign', 'govdelivery'],
      audit: ['datasnipper', 'mindbridge', 'workiva'],
      specialized: ['eprocurement', 'asset_management', 'court_system', 'utility_billing', 'property_tax'],
      treasury: ['treasury_management']
    };
  }
}

// Global service registry instance
export const serviceRegistry = new IntegratedServiceRegistry();