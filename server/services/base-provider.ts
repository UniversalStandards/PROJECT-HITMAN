// Base provider interface for all payment and integration services

export interface BaseProviderConfig {
  apiKey?: string;
  secretKey?: string;
  webhookSecret?: string;
  environment?: 'development' | 'production' | 'sandbox';
  [key: string]: any;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  providerTransactionId?: string;
  error?: string;
  metadata?: Record<string, any>;
}

export interface TransferResult extends PaymentResult {
  transferId?: string;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  estimatedSettlement?: Date;
  fees?: number;
}

export interface CardIssueResult extends PaymentResult {
  cardId?: string;
  cardNumber?: string; // masked
  expiryDate?: string;
  status?: 'active' | 'pending' | 'blocked';
}

export interface ComplianceResult {
  success: boolean;
  riskScore?: number;
  flags?: string[];
  approved?: boolean;
  requiresReview?: boolean;
  error?: string;
  details?: Record<string, any>;
}

export abstract class BaseProvider {
  protected config: BaseProviderConfig;
  protected isTestMode: boolean;

  constructor(config: BaseProviderConfig) {
    this.config = config;
    this.isTestMode = config.environment !== 'production';
  }

  abstract initialize(): Promise<void>;
  abstract validateConfig(): boolean;
  abstract getProviderName(): string;
  
  // Payment methods
  abstract processPayment?(amount: number, currency: string, metadata?: Record<string, any>): Promise<PaymentResult>;
  abstract processACH?(amount: number, fromAccount: string, toAccount: string, type: 'standard' | 'same_day' | 'next_day'): Promise<TransferResult>;
  abstract processWire?(amount: number, fromAccount: string, toAccount: string, type: 'domestic' | 'international'): Promise<TransferResult>;
  abstract processInstantTransfer?(amount: number, fromAccount: string, toAccount: string): Promise<TransferResult>;
  
  // Card services
  abstract issueCard?(holderName: string, type: 'debit' | 'credit' | 'virtual', limits?: Record<string, number>): Promise<CardIssueResult>;
  abstract blockCard?(cardId: string): Promise<PaymentResult>;
  abstract activateCard?(cardId: string): Promise<PaymentResult>;
  
  // Compliance services
  abstract screenEntity?(entityType: 'individual' | 'business', entityData: Record<string, any>): Promise<ComplianceResult>;
  abstract checkSanctions?(name: string, identifiers?: Record<string, any>): Promise<ComplianceResult>;
  
  // Utility methods
  protected formatAmount(amount: number): number {
    return Math.round(amount * 100); // Convert to cents
  }
  
  protected validateAmount(amount: number): boolean {
    return amount > 0 && amount <= 999999.99;
  }
  
  protected logTransaction(action: string, data: Record<string, any>): void {
    console.log(`[${this.getProviderName()}] ${action}:`, data);
  }
}

// Provider factory interface
export interface ProviderFactory {
  createProvider(providerType: string, config: BaseProviderConfig): BaseProvider;
  getSupportedProviders(): string[];
}