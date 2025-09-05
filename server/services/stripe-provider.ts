import Stripe from 'stripe';
import { BaseProvider, BaseProviderConfig, PaymentResult, TransferResult, CardIssueResult, ComplianceResult } from './base-provider';

export interface StripeConfig extends BaseProviderConfig {
  stripeSecretKey: string;
  stripePublishableKey: string;
}

export class StripeProvider extends BaseProvider {
  private stripe: Stripe;

  constructor(config: StripeConfig) {
    super(config);
    this.stripe = new Stripe(config.stripeSecretKey, {
      apiVersion: '2025-08-27.basil',
    });
  }

  async initialize(): Promise<void> {
    try {
      // Test connection
      await this.stripe.accounts.retrieve();
      this.logTransaction('initialize', { status: 'success' });
    } catch (error) {
      this.logTransaction('initialize', { status: 'error', error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  validateConfig(): boolean {
    return !!(this.config as StripeConfig).stripeSecretKey;
  }

  getProviderName(): string {
    return 'stripe';
  }

  async processPayment(amount: number, currency: string = 'usd', metadata?: Record<string, any>): Promise<PaymentResult> {
    try {
      if (!this.validateAmount(amount)) {
        return { success: false, error: 'Invalid amount' };
      }

      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: this.formatAmount(amount),
        currency: currency.toLowerCase(),
        metadata: metadata || {},
        automatic_payment_methods: { enabled: true },
      });

      this.logTransaction('processPayment', { 
        amount, 
        currency, 
        paymentIntentId: paymentIntent.id 
      });

      return {
        success: true,
        transactionId: paymentIntent.id,
        providerTransactionId: paymentIntent.id,
        metadata: { clientSecret: paymentIntent.client_secret }
      };
    } catch (error) {
      this.logTransaction('processPayment', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Payment processing failed' 
      };
    }
  }

  async processACH(
    amount: number, 
    fromAccount: string, 
    toAccount: string, 
    type: 'standard' | 'same_day' | 'next_day' = 'standard'
  ): Promise<TransferResult> {
    try {
      // Create ACH transfer using Stripe Connect
      const transfer = await this.stripe.transfers.create({
        amount: this.formatAmount(amount),
        currency: 'usd',
        destination: toAccount,
        metadata: { 
          fromAccount, 
          type,
          transferType: 'ach' 
        }
      });

      const estimatedSettlement = new Date();
      switch (type) {
        case 'same_day':
          estimatedSettlement.setHours(estimatedSettlement.getHours() + 6);
          break;
        case 'next_day':
          estimatedSettlement.setDate(estimatedSettlement.getDate() + 1);
          break;
        default:
          estimatedSettlement.setDate(estimatedSettlement.getDate() + 3);
      }

      this.logTransaction('processACH', { 
        amount, 
        type, 
        transferId: transfer.id 
      });

      return {
        success: true,
        transferId: transfer.id,
        providerTransactionId: transfer.id,
        status: 'pending',
        estimatedSettlement,
        fees: 0 // Stripe fees would be calculated based on type
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'ACH transfer failed' 
      };
    }
  }

  async issueCard(
    holderName: string, 
    type: 'debit' | 'credit' | 'virtual' = 'virtual',
    limits?: Record<string, number>
  ): Promise<CardIssueResult> {
    try {
      // Create card using Stripe Issuing
      const card = await this.stripe.issuing.cards.create({
        cardholder: await this.createCardHolder(holderName),
        currency: 'usd',
        type: type === 'virtual' ? 'virtual' : 'physical',
        spending_controls: limits ? {
          spending_limits: Object.entries(limits).map(([interval, amount]) => ({
            interval: interval as 'per_authorization' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all_time',
            amount: this.formatAmount(amount)
          }))
        } : undefined
      });

      this.logTransaction('issueCard', { 
        holderName, 
        type, 
        cardId: card.id 
      });

      return {
        success: true,
        cardId: card.id,
        providerTransactionId: card.id,
        cardNumber: `****-****-****-${card.last4}`,
        expiryDate: `${card.exp_month}/${card.exp_year}`,
        status: card.status as 'active' | 'pending' | 'blocked'
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Card issuance failed' 
      };
    }
  }

  async blockCard(cardId: string): Promise<PaymentResult> {
    try {
      await this.stripe.issuing.cards.update(cardId, {
        status: 'canceled'
      });

      this.logTransaction('blockCard', { cardId });

      return { success: true, transactionId: cardId };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Card blocking failed' 
      };
    }
  }

  async activateCard(cardId: string): Promise<PaymentResult> {
    try {
      await this.stripe.issuing.cards.update(cardId, {
        status: 'active'
      });

      this.logTransaction('activateCard', { cardId });

      return { success: true, transactionId: cardId };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Card activation failed' 
      };
    }
  }

  async processWire(amount: number, fromAccount: string, toAccount: string, type: 'domestic' | 'international'): Promise<TransferResult> {
    // Wire transfers through Stripe Treasury or Connect
    return { success: false, error: 'Wire transfers require Stripe Treasury setup' };
  }

  async processInstantTransfer(amount: number, fromAccount: string, toAccount: string): Promise<TransferResult> {
    // Instant transfers through Stripe
    return { success: false, error: 'Instant transfers require specific Stripe configuration' };
  }

  async screenEntity(entityType: 'individual' | 'business', entityData: Record<string, any>): Promise<ComplianceResult> {
    // Basic entity screening - would integrate with compliance services
    return { success: true, approved: true, riskScore: 1 };
  }

  async checkSanctions(name: string, identifiers?: Record<string, any>): Promise<ComplianceResult> {
    // Sanctions screening - would integrate with compliance services
    return { success: true, approved: true, flags: [] };
  }

  private async createCardHolder(name: string): Promise<string> {
    const cardholder = await this.stripe.issuing.cardholders.create({
      name,
      type: 'individual',
      billing: {
        address: {
          line1: '123 Government St',
          city: 'Washington',
          state: 'DC',
          postal_code: '20001',
          country: 'US'
        }
      }
    });
    return cardholder.id;
  }
}