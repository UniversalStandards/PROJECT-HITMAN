import { BaseProvider, BaseProviderConfig, ProviderFactory } from './base-provider';
import { StripeProvider, StripeConfig } from './stripe-provider';
import { PayPalProvider, PayPalConfig } from './paypal-provider';

// Additional provider classes would be imported here
// import { SquareProvider } from './square-provider';
// import { UnitProvider } from './unit-provider';
// import { ModernTreasuryProvider } from './modern-treasury-provider';

export class PaymentProviderFactory implements ProviderFactory {
  createProvider(providerType: string, config: BaseProviderConfig): BaseProvider {
    switch (providerType.toLowerCase()) {
      case 'stripe':
        return new StripeProvider(config as StripeConfig);
      case 'paypal':
        return new PayPalProvider(config as PayPalConfig);
      // case 'square':
      //   return new SquareProvider(config as SquareConfig);
      // case 'unit':
      //   return new UnitProvider(config as UnitConfig);
      // case 'modern_treasury':
      //   return new ModernTreasuryProvider(config as ModernTreasuryConfig);
      default:
        throw new Error(`Unsupported provider type: ${providerType}`);
    }
  }

  getSupportedProviders(): string[] {
    return [
      'stripe',
      'paypal',
      // 'square',
      // 'unit',
      // 'modern_treasury',
      // 'saltedge',
      // 'plaid',
      // 'dwolla',
      // 'wise',
      // 'circle',
      // 'coinbase'
    ];
  }
}

// Service manager for coordinating multiple providers
export class PaymentServiceManager {
  private providers: Map<string, BaseProvider> = new Map();
  private factory: PaymentProviderFactory;

  constructor() {
    this.factory = new PaymentProviderFactory();
  }

  async addProvider(organizationId: string, providerType: string, config: BaseProviderConfig): Promise<void> {
    const provider = this.factory.createProvider(providerType, config);
    await provider.initialize();
    this.providers.set(`${organizationId}:${providerType}`, provider);
  }

  getProvider(organizationId: string, providerType: string): BaseProvider | undefined {
    return this.providers.get(`${organizationId}:${providerType}`);
  }

  async removeProvider(organizationId: string, providerType: string): Promise<void> {
    this.providers.delete(`${organizationId}:${providerType}`);
  }

  getOrganizationProviders(organizationId: string): BaseProvider[] {
    const providers: BaseProvider[] = [];
    for (const [key, provider] of this.providers) {
      if (key.startsWith(`${organizationId}:`)) {
        providers.push(provider);
      }
    }
    return providers;
  }

  async processPaymentWithFallback(
    organizationId: string, 
    preferredProviders: string[], 
    amount: number, 
    currency: string,
    metadata?: Record<string, any>
  ): Promise<{ provider: string; result: any }> {
    for (const providerType of preferredProviders) {
      const provider = this.getProvider(organizationId, providerType);
      if (provider && provider.processPayment) {
        try {
          const result = await provider.processPayment(amount, currency, metadata);
          if (result.success) {
            return { provider: providerType, result };
          }
        } catch (error) {
          console.error(`Payment failed with ${providerType}:`, error);
          continue;
        }
      }
    }
    throw new Error('All payment providers failed');
  }
}

// Global service manager instance
export const paymentServiceManager = new PaymentServiceManager();