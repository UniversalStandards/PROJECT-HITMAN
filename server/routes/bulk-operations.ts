import { Router } from 'express';
import { BulkOperationsService } from '../services/bulk-operations';
import { isAuthenticated } from '../replitAuth';
import { enhancedStorage } from '../enhanced-storage';

const router = Router();
const bulkOps = new BulkOperationsService();

// Bulk payment processing
router.post('/bulk/payments', isAuthenticated, async (req: any, res) => {
  try {
    const user = await enhancedStorage.getUser(req.user.claims.sub);
    
    if (!user?.organizationId) {
      return res.status(400).json({ message: 'Organization not found' });
    }

    const { paymentIds, action, notes } = req.body;

    if (!paymentIds || !Array.isArray(paymentIds) || paymentIds.length === 0) {
      return res.status(400).json({ message: 'Payment IDs required' });
    }

    if (!['approve', 'reject', 'process', 'cancel'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action' });
    }

    const result = await bulkOps.bulkProcessPayments({
      paymentIds,
      action,
      approvedBy: req.user.claims.sub,
      notes
    });

    res.json({ success: true, result });
  } catch (error) {
    console.error('Bulk payment processing error:', error);
    res.status(500).json({ 
      message: 'Failed to process payments',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Bulk vendor onboarding
router.post('/bulk/vendors', isAuthenticated, async (req: any, res) => {
  try {
    const user = await enhancedStorage.getUser(req.user.claims.sub);
    
    if (!user?.organizationId) {
      return res.status(400).json({ message: 'Organization not found' });
    }

    const { vendors } = req.body;

    if (!vendors || !Array.isArray(vendors) || vendors.length === 0) {
      return res.status(400).json({ message: 'Vendors data required' });
    }

    const result = await bulkOps.bulkOnboardVendors({
      vendors,
      organizationId: user.organizationId,
      createdBy: req.user.claims.sub
    });

    res.json({ success: true, result });
  } catch (error) {
    console.error('Bulk vendor onboarding error:', error);
    res.status(500).json({ 
      message: 'Failed to onboard vendors',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Bulk expense processing
router.post('/bulk/expenses', isAuthenticated, async (req: any, res) => {
  try {
    const user = await enhancedStorage.getUser(req.user.claims.sub);
    
    if (!user?.organizationId) {
      return res.status(400).json({ message: 'Organization not found' });
    }

    const { expenseIds, action, notes } = req.body;

    if (!expenseIds || !Array.isArray(expenseIds) || expenseIds.length === 0) {
      return res.status(400).json({ message: 'Expense IDs required' });
    }

    if (!['approve', 'reject', 'reimburse'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action' });
    }

    const result = await bulkOps.bulkProcessExpenses({
      expenseIds,
      action,
      approvedBy: req.user.claims.sub,
      notes
    });

    res.json({ success: true, result });
  } catch (error) {
    console.error('Bulk expense processing error:', error);
    res.status(500).json({ 
      message: 'Failed to process expenses',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Bulk transaction import
router.post('/bulk/transactions/import', isAuthenticated, async (req: any, res) => {
  try {
    const user = await enhancedStorage.getUser(req.user.claims.sub);
    
    if (!user?.organizationId) {
      return res.status(400).json({ message: 'Organization not found' });
    }

    const { transactions } = req.body;

    if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({ message: 'Transactions data required' });
    }

    const result = await bulkOps.bulkImportTransactions(
      transactions,
      user.organizationId,
      req.user.claims.sub
    );

    res.json({ success: true, result });
  } catch (error) {
    console.error('Bulk transaction import error:', error);
    res.status(500).json({ 
      message: 'Failed to import transactions',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Bulk payment status update
router.patch('/bulk/payments/status', isAuthenticated, async (req: any, res) => {
  try {
    const { paymentIds, newStatus } = req.body;

    if (!paymentIds || !Array.isArray(paymentIds) || paymentIds.length === 0) {
      return res.status(400).json({ message: 'Payment IDs required' });
    }

    if (!newStatus) {
      return res.status(400).json({ message: 'New status required' });
    }

    const result = await bulkOps.bulkUpdatePaymentStatuses(
      paymentIds,
      newStatus,
      req.user.claims.sub
    );

    res.json({ success: true, result });
  } catch (error) {
    console.error('Bulk payment status update error:', error);
    res.status(500).json({ 
      message: 'Failed to update payment statuses',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Bulk vendor validation
router.post('/bulk/vendors/validate', isAuthenticated, async (req: any, res) => {
  try {
    const { vendorIds } = req.body;

    if (!vendorIds || !Array.isArray(vendorIds) || vendorIds.length === 0) {
      return res.status(400).json({ message: 'Vendor IDs required' });
    }

    const result = await bulkOps.bulkValidateVendors(vendorIds);

    res.json({ success: true, result });
  } catch (error) {
    console.error('Bulk vendor validation error:', error);
    res.status(500).json({ 
      message: 'Failed to validate vendors',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;