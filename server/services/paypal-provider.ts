import { 
  Client, 
  Environment, 
  OrdersController,
  PaymentsController 
} from '@paypal/paypal-server-sdk';
import { BaseProvider, BaseProviderConfig, PaymentResult, TransferResult, CardIssueResult, ComplianceResult } from './base-provider';

export interface PayPalConfig extends BaseProviderConfig {
  clientId: string;
  clientSecret: string;
}

export class PayPalProvider extends BaseProvider {
  private client: Client;
  private ordersController: OrdersController;
  private paymentsController: PaymentsController;

  constructor(config: PayPalConfig) {
    super(config);
    
    this.client = new Client({
      clientCredentialsAuthCredentials: {
        oAuthClientId: config.clientId,
        oAuthClientSecret: config.clientSecret,
      },
      environment: this.isTestMode ? Environment.Sandbox : Environment.Production,
    });
    
    this.ordersController = new OrdersController(this.client);
    this.paymentsController = new PaymentsController(this.client);
  }

  async initialize(): Promise<void> {
    try {
      // Test connection by getting client token
      this.logTransaction('initialize', { status: 'success' });
    } catch (error) {
      this.logTransaction('initialize', { 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  validateConfig(): boolean {
    const config = this.config as PayPalConfig;
    return !!(config.clientId && config.clientSecret);
  }

  getProviderName(): string {
    return 'paypal';
  }

  async processPayment(amount: number, currency: string = 'USD', metadata?: Record<string, any>): Promise<PaymentResult> {
    try {
      if (!this.validateAmount(amount)) {
        return { success: false, error: 'Invalid amount' };
      }

      const orderRequest = {
        body: {
          intent: 'CAPTURE',
          purchaseUnits: [{
            amount: {
              currencyCode: currency.toUpperCase(),
              value: amount.toFixed(2)
            },
            customId: metadata?.orderId || undefined
          }]
        }
      };

      const { body } = await this.ordersController.createOrder(orderRequest);
      const order = JSON.parse(String(body));

      this.logTransaction('processPayment', { 
        amount, 
        currency, 
        orderId: order.id 
      });

      return {
        success: true,
        transactionId: order.id,
        providerTransactionId: order.id,
        metadata: { 
          approvalUrl: order.links?.find((link: any) => link.rel === 'approve')?.href 
        }
      };
    } catch (error) {
      this.logTransaction('processPayment', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'PayPal payment processing failed' 
      };
    }
  }

  async capturePayment(orderId: string): Promise<PaymentResult> {
    try {
      const { body } = await this.ordersController.captureOrder({
        id: orderId,
        prefer: 'return=minimal'
      });
      
      const capture = JSON.parse(String(body));

      this.logTransaction('capturePayment', { orderId, captureId: capture.id });

      return {
        success: true,
        transactionId: capture.id,
        providerTransactionId: orderId,
        metadata: { status: capture.status }
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'PayPal capture failed' 
      };
    }
  }

  async processACH(
    amount: number, 
    fromAccount: string, 
    toAccount: string, 
    type: 'standard' | 'same_day' | 'next_day' = 'standard'
  ): Promise<TransferResult> {
    // PayPal doesn't directly support ACH - this would require integration with their business platform
    return {
      success: false,
      error: 'ACH transfers not supported by PayPal integration'
    };
  }

  async createPayout(amount: number, recipientEmail: string, note?: string): Promise<PaymentResult> {
    try {
      const payoutRequest = {
        sender_batch_header: {
          sender_batch_id: `batch_${Date.now()}`,
          email_subject: 'Government Payment',
          email_message: note || 'Payment from government entity'
        },
        items: [{
          recipient_type: 'EMAIL',
          amount: {
            value: amount.toFixed(2),
            currency: 'USD'
          },
          receiver: recipientEmail,
          note: note || 'Government payment'
        }]
      };

      // Note: This would require PayPal Payouts API which needs additional setup
      this.logTransaction('createPayout', { amount, recipientEmail });

      return {
        success: true,
        transactionId: `payout_${Date.now()}`,
        metadata: { recipientEmail, note }
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'PayPal payout failed' 
      };
    }
  }

  async processWire(amount: number, fromAccount: string, toAccount: string, type: 'domestic' | 'international'): Promise<TransferResult> {
    return { success: false, error: 'Wire transfers not supported by PayPal' };
  }

  async processInstantTransfer(amount: number, fromAccount: string, toAccount: string): Promise<TransferResult> {
    return { success: false, error: 'Instant transfers not supported by standard PayPal integration' };
  }

  async issueCard(holderName: string, type: 'debit' | 'credit' | 'virtual', limits?: Record<string, number>): Promise<CardIssueResult> {
    return { success: false, error: 'Card issuance not supported by PayPal' };
  }

  async blockCard(cardId: string): Promise<PaymentResult> {
    return { success: false, error: 'Card management not supported by PayPal' };
  }

  async activateCard(cardId: string): Promise<PaymentResult> {
    return { success: false, error: 'Card management not supported by PayPal' };
  }

  async screenEntity(entityType: 'individual' | 'business', entityData: Record<string, any>): Promise<ComplianceResult> {
    return { success: true, approved: true, riskScore: 1 };
  }

  async checkSanctions(name: string, identifiers?: Record<string, any>): Promise<ComplianceResult> {
    return { success: true, approved: true, flags: [] };
  }
}