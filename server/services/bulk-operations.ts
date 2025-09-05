import { db } from '../db';
import { 
  payments, vendors, expenses, transactions, auditLogs,
  type Payment, type Vendor, type Expense, type Transaction
} from '@shared/schema';
import { eq, inArray, and, sql } from 'drizzle-orm';
import { paymentServiceManager } from './provider-factory';

export interface BulkOperationResult {
  totalProcessed: number;
  successful: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
  processingTime: number;
}

export interface BulkPaymentRequest {
  paymentIds: string[];
  action: 'approve' | 'reject' | 'process' | 'cancel';
  approvedBy?: string;
  notes?: string;
}

export interface BulkVendorRequest {
  vendors: Array<{
    name: string;
    email: string;
    phone?: string;
    address?: string;
    taxId?: string;
    category?: string;
  }>;
  organizationId: string;
  createdBy: string;
}

export interface BulkExpenseRequest {
  expenseIds: string[];
  action: 'approve' | 'reject' | 'reimburse';
  approvedBy?: string;
  notes?: string;
}

export class BulkOperationsService {
  /**
   * Bulk approve or process payments
   */
  async bulkProcessPayments(request: BulkPaymentRequest): Promise<BulkOperationResult> {
    const startTime = Date.now();
    const result: BulkOperationResult = {
      totalProcessed: request.paymentIds.length,
      successful: 0,
      failed: 0,
      errors: [],
      processingTime: 0
    };

    try {
      // Start transaction
      await db.transaction(async (tx) => {
        for (const paymentId of request.paymentIds) {
          try {
            const [payment] = await tx
              .select()
              .from(payments)
              .where(eq(payments.id, paymentId));

            if (!payment) {
              result.errors.push({ id: paymentId, error: 'Payment not found' });
              result.failed++;
              continue;
            }

            let newStatus: typeof payment.status = payment.status;
            
            switch (request.action) {
              case 'approve':
                if (payment.status === 'pending') {
                  newStatus = 'approved';
                }
                break;
              case 'process':
                if (payment.status === 'approved') {
                  // Process payment through provider
                  const provider = paymentServiceManager.getProvider(
                    payment.organizationId,
                    payment.provider || 'stripe'
                  );
                  
                  if (provider && provider.processPayment) {
                    const paymentResult = await provider.processPayment(
                      parseFloat(payment.amount),
                      payment.currency || 'USD',
                      { paymentId }
                    );
                    
                    if (paymentResult.success) {
                      newStatus = 'completed';
                    } else {
                      throw new Error(paymentResult.error || 'Payment processing failed');
                    }
                  }
                }
                break;
              case 'reject':
                newStatus = 'rejected';
                break;
              case 'cancel':
                newStatus = 'cancelled';
                break;
            }

            // Update payment status
            await tx
              .update(payments)
              .set({ 
                status: newStatus,
                updatedAt: new Date()
              })
              .where(eq(payments.id, paymentId));

            // Log audit trail
            await tx
              .insert(auditLogs)
              .values({
                userId: request.approvedBy || 'system',
                action: `bulk_payment_${request.action}`,
                entity: 'payment',
                entityId: paymentId,
                details: JSON.stringify({
                  oldStatus: payment.status,
                  newStatus,
                  notes: request.notes
                }),
                ipAddress: '127.0.0.1'
              });

            result.successful++;
          } catch (error) {
            result.errors.push({ 
              id: paymentId, 
              error: error instanceof Error ? error.message : 'Unknown error' 
            });
            result.failed++;
          }
        }
      });
    } catch (error) {
      console.error('Bulk payment processing failed:', error);
      throw error;
    }

    result.processingTime = Date.now() - startTime;
    return result;
  }

  /**
   * Bulk onboard vendors
   */
  async bulkOnboardVendors(request: BulkVendorRequest): Promise<BulkOperationResult> {
    const startTime = Date.now();
    const result: BulkOperationResult = {
      totalProcessed: request.vendors.length,
      successful: 0,
      failed: 0,
      errors: [],
      processingTime: 0
    };

    try {
      await db.transaction(async (tx) => {
        for (const vendorData of request.vendors) {
          try {
            // Check for duplicate
            const existing = await tx
              .select()
              .from(vendors)
              .where(
                and(
                  eq(vendors.organizationId, request.organizationId),
                  eq(vendors.email, vendorData.email)
                )
              );

            if (existing.length > 0) {
              result.errors.push({ 
                id: vendorData.email, 
                error: 'Vendor with this email already exists' 
              });
              result.failed++;
              continue;
            }

            // Create vendor
            const [newVendor] = await tx
              .insert(vendors)
              .values({
                organizationId: request.organizationId,
                vendorNumber: `VND${Date.now()}${Math.floor(Math.random() * 1000)}`,
                name: vendorData.name,
                email: vendorData.email,
                phone: vendorData.phone,
                address: vendorData.address,
                taxId: vendorData.taxId,
                category: vendorData.category || 'general',
                status: 'active',
                rating: 5,
                totalSpent: '0'
              })
              .returning();

            // Log audit trail
            await tx
              .insert(auditLogs)
              .values({
                userId: request.createdBy,
                action: 'bulk_vendor_onboard',
                entity: 'vendor',
                entityId: newVendor.id,
                details: JSON.stringify({
                  vendorName: vendorData.name,
                  vendorEmail: vendorData.email
                }),
                ipAddress: '127.0.0.1'
              });

            result.successful++;
          } catch (error) {
            result.errors.push({ 
              id: vendorData.email, 
              error: error instanceof Error ? error.message : 'Unknown error' 
            });
            result.failed++;
          }
        }
      });
    } catch (error) {
      console.error('Bulk vendor onboarding failed:', error);
      throw error;
    }

    result.processingTime = Date.now() - startTime;
    return result;
  }

  /**
   * Bulk process expense reports
   */
  async bulkProcessExpenses(request: BulkExpenseRequest): Promise<BulkOperationResult> {
    const startTime = Date.now();
    const result: BulkOperationResult = {
      totalProcessed: request.expenseIds.length,
      successful: 0,
      failed: 0,
      errors: [],
      processingTime: 0
    };

    try {
      await db.transaction(async (tx) => {
        for (const expenseId of request.expenseIds) {
          try {
            const [expense] = await tx
              .select()
              .from(expenses)
              .where(eq(expenses.id, expenseId));

            if (!expense) {
              result.errors.push({ id: expenseId, error: 'Expense not found' });
              result.failed++;
              continue;
            }

            let newStatus: typeof expense.status = expense.status;
            
            switch (request.action) {
              case 'approve':
                if (expense.status === 'pending') {
                  newStatus = 'approved';
                }
                break;
              case 'reject':
                newStatus = 'rejected';
                break;
              case 'reimburse':
                if (expense.status === 'approved') {
                  newStatus = 'reimbursed';
                  
                  // Create reimbursement payment
                  await tx
                    .insert(payments)
                    .values({
                      organizationId: expense.organizationId,
                      paymentNumber: `REIMB${Date.now()}`,
                      type: 'expense',
                      amount: expense.amount,
                      currency: expense.currency || 'USD',
                      status: 'pending',
                      paymentDate: new Date(),
                      description: `Expense reimbursement for ${expense.description}`,
                      createdBy: request.approvedBy || 'system'
                    });
                }
                break;
            }

            // Update expense status
            await tx
              .update(expenses)
              .set({ 
                status: newStatus,
                approvedBy: request.approvedBy,
                approvedAt: request.action === 'approve' ? new Date() : undefined,
                updatedAt: new Date()
              })
              .where(eq(expenses.id, expenseId));

            // Log audit trail
            await tx
              .insert(auditLogs)
              .values({
                userId: request.approvedBy || 'system',
                action: `bulk_expense_${request.action}`,
                entity: 'expense',
                entityId: expenseId,
                details: JSON.stringify({
                  oldStatus: expense.status,
                  newStatus,
                  notes: request.notes
                }),
                ipAddress: '127.0.0.1'
              });

            result.successful++;
          } catch (error) {
            result.errors.push({ 
              id: expenseId, 
              error: error instanceof Error ? error.message : 'Unknown error' 
            });
            result.failed++;
          }
        }
      });
    } catch (error) {
      console.error('Bulk expense processing failed:', error);
      throw error;
    }

    result.processingTime = Date.now() - startTime;
    return result;
  }

  /**
   * Bulk import transactions from CSV
   */
  async bulkImportTransactions(
    transactions: Array<{
      amount: number;
      type: 'debit' | 'credit';
      description: string;
      category?: string;
      date?: Date;
      reference?: string;
    }>,
    organizationId: string,
    importedBy: string
  ): Promise<BulkOperationResult> {
    const startTime = Date.now();
    const result: BulkOperationResult = {
      totalProcessed: transactions.length,
      successful: 0,
      failed: 0,
      errors: [],
      processingTime: 0
    };

    try {
      await db.transaction(async (tx) => {
        for (const txData of transactions) {
          try {
            await tx
              .insert(transactions)
              .values({
                organizationId,
                walletId: null, // Will be linked later
                type: txData.type,
                amount: txData.amount.toString(),
                currency: 'USD',
                description: txData.description,
                category: txData.category || 'general',
                reference: txData.reference,
                status: 'completed',
                createdAt: txData.date || new Date()
              });

            result.successful++;
          } catch (error) {
            result.errors.push({ 
              id: txData.reference || 'unknown', 
              error: error instanceof Error ? error.message : 'Unknown error' 
            });
            result.failed++;
          }
        }

        // Log bulk import
        await tx
          .insert(auditLogs)
          .values({
            userId: importedBy,
            action: 'bulk_transaction_import',
            entity: 'transaction',
            entityId: organizationId,
            details: JSON.stringify({
              totalImported: result.successful,
              failed: result.failed
            }),
            ipAddress: '127.0.0.1'
          });
      });
    } catch (error) {
      console.error('Bulk transaction import failed:', error);
      throw error;
    }

    result.processingTime = Date.now() - startTime;
    return result;
  }

  /**
   * Bulk update payment statuses
   */
  async bulkUpdatePaymentStatuses(
    paymentIds: string[],
    newStatus: Payment['status'],
    updatedBy: string
  ): Promise<BulkOperationResult> {
    const startTime = Date.now();
    const result: BulkOperationResult = {
      totalProcessed: paymentIds.length,
      successful: 0,
      failed: 0,
      errors: [],
      processingTime: 0
    };

    try {
      const updateResult = await db
        .update(payments)
        .set({ 
          status: newStatus,
          updatedAt: new Date()
        })
        .where(inArray(payments.id, paymentIds))
        .returning();

      result.successful = updateResult.length;
      result.failed = paymentIds.length - updateResult.length;

      // Log bulk update
      await db
        .insert(auditLogs)
        .values({
          userId: updatedBy,
          action: 'bulk_payment_status_update',
          entity: 'payment',
          entityId: JSON.stringify(paymentIds),
          details: JSON.stringify({
            newStatus,
            totalUpdated: result.successful
          }),
          ipAddress: '127.0.0.1'
        });
    } catch (error) {
      console.error('Bulk payment status update failed:', error);
      throw error;
    }

    result.processingTime = Date.now() - startTime;
    return result;
  }

  /**
   * Bulk validate vendor information
   */
  async bulkValidateVendors(vendorIds: string[]): Promise<{
    valid: string[];
    invalid: Array<{ id: string; issues: string[] }>;
  }> {
    const valid: string[] = [];
    const invalid: Array<{ id: string; issues: string[] }> = [];

    const vendorsList = await db
      .select()
      .from(vendors)
      .where(inArray(vendors.id, vendorIds));

    for (const vendor of vendorsList) {
      const issues: string[] = [];

      if (!vendor.taxId) issues.push('Missing Tax ID');
      if (!vendor.bankAccount) issues.push('Missing bank account');
      if (!vendor.address) issues.push('Missing address');
      if (vendor.status !== 'active') issues.push('Vendor not active');

      if (issues.length > 0) {
        invalid.push({ id: vendor.id, issues });
      } else {
        valid.push(vendor.id);
      }
    }

    return { valid, invalid };
  }
}