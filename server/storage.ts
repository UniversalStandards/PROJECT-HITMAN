import {
  users,
  organizations,
  budgets,
  budgetCategories,
  vendors,
  payments,
  expenses,
  digitalWallets,
  transactions,
  type User,
  type UpsertUser,
  type Organization,
  type InsertOrganization,
  type Budget,
  type InsertBudget,
  type BudgetCategory,
  type InsertBudgetCategory,
  type Vendor,
  type InsertVendor,
  type Payment,
  type InsertPayment,
  type Expense,
  type InsertExpense,
  type DigitalWallet,
  type InsertDigitalWallet,
  type Transaction,
  type InsertTransaction,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, sum } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Organization operations
  getOrganizations(): Promise<Organization[]>;
  getOrganization(id: string): Promise<Organization | undefined>;
  createOrganization(organization: InsertOrganization): Promise<Organization>;
  
  // Budget operations
  getBudgets(organizationId: string): Promise<Budget[]>;
  getBudget(id: string): Promise<Budget | undefined>;
  createBudget(budget: InsertBudget): Promise<Budget>;
  updateBudget(id: string, budget: Partial<InsertBudget>): Promise<Budget>;
  
  // Budget category operations
  getBudgetCategories(budgetId: string): Promise<BudgetCategory[]>;
  createBudgetCategory(category: InsertBudgetCategory): Promise<BudgetCategory>;
  
  // Vendor operations
  getVendors(organizationId: string): Promise<Vendor[]>;
  getVendor(id: string): Promise<Vendor | undefined>;
  createVendor(vendor: InsertVendor): Promise<Vendor>;
  updateVendor(id: string, vendor: Partial<InsertVendor>): Promise<Vendor>;
  
  // Payment operations
  getPayments(organizationId: string): Promise<Payment[]>;
  getPayment(id: string): Promise<Payment | undefined>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: string, payment: Partial<InsertPayment>): Promise<Payment>;
  getPendingPayments(organizationId: string): Promise<Payment[]>;
  
  // Expense operations
  getExpenses(organizationId: string): Promise<Expense[]>;
  getExpense(id: string): Promise<Expense | undefined>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(id: string, expense: Partial<InsertExpense>): Promise<Expense>;
  
  // Digital wallet operations
  getDigitalWallets(organizationId: string): Promise<DigitalWallet[]>;
  getDigitalWallet(id: string): Promise<DigitalWallet | undefined>;
  createDigitalWallet(wallet: InsertDigitalWallet): Promise<DigitalWallet>;
  updateDigitalWallet(id: string, wallet: Partial<InsertDigitalWallet>): Promise<DigitalWallet>;
  
  // Transaction operations
  getTransactions(organizationId: string): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  
  // Analytics operations
  getOrganizationStats(organizationId: string): Promise<{
    totalBudget: string;
    monthlyExpenses: string;
    activeVendors: number;
    pendingPayments: number;
  }>;
  getTopVendors(organizationId: string): Promise<Vendor[]>;
  getRecentActivity(organizationId: string): Promise<any[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Organization operations
  async getOrganizations(): Promise<Organization[]> {
    return await db.select().from(organizations).orderBy(desc(organizations.createdAt));
  }

  async getOrganization(id: string): Promise<Organization | undefined> {
    const [organization] = await db.select().from(organizations).where(eq(organizations.id, id));
    return organization;
  }

  async createOrganization(organization: InsertOrganization): Promise<Organization> {
    const [newOrganization] = await db
      .insert(organizations)
      .values(organization)
      .returning();
    return newOrganization;
  }

  // Budget operations
  async getBudgets(organizationId: string): Promise<Budget[]> {
    return await db
      .select()
      .from(budgets)
      .where(eq(budgets.organizationId, organizationId))
      .orderBy(desc(budgets.createdAt));
  }

  async getBudget(id: string): Promise<Budget | undefined> {
    const [budget] = await db.select().from(budgets).where(eq(budgets.id, id));
    return budget;
  }

  async createBudget(budget: InsertBudget): Promise<Budget> {
    const [newBudget] = await db
      .insert(budgets)
      .values(budget)
      .returning();
    return newBudget;
  }

  async updateBudget(id: string, budget: Partial<InsertBudget>): Promise<Budget> {
    const [updatedBudget] = await db
      .update(budgets)
      .set({ ...budget, updatedAt: new Date() })
      .where(eq(budgets.id, id))
      .returning();
    return updatedBudget;
  }

  // Budget category operations
  async getBudgetCategories(budgetId: string): Promise<BudgetCategory[]> {
    return await db
      .select()
      .from(budgetCategories)
      .where(eq(budgetCategories.budgetId, budgetId));
  }

  async createBudgetCategory(category: InsertBudgetCategory): Promise<BudgetCategory> {
    const [newCategory] = await db
      .insert(budgetCategories)
      .values(category)
      .returning();
    return newCategory;
  }

  // Vendor operations
  async getVendors(organizationId: string): Promise<Vendor[]> {
    return await db
      .select()
      .from(vendors)
      .where(eq(vendors.organizationId, organizationId))
      .orderBy(desc(vendors.totalSpend));
  }

  async getVendor(id: string): Promise<Vendor | undefined> {
    const [vendor] = await db.select().from(vendors).where(eq(vendors.id, id));
    return vendor;
  }

  async createVendor(vendor: InsertVendor): Promise<Vendor> {
    const [newVendor] = await db
      .insert(vendors)
      .values(vendor)
      .returning();
    return newVendor;
  }

  async updateVendor(id: string, vendor: Partial<InsertVendor>): Promise<Vendor> {
    const [updatedVendor] = await db
      .update(vendors)
      .set({ ...vendor, updatedAt: new Date() })
      .where(eq(vendors.id, id))
      .returning();
    return updatedVendor;
  }

  // Payment operations
  async getPayments(organizationId: string): Promise<Payment[]> {
    return await db
      .select()
      .from(payments)
      .where(eq(payments.organizationId, organizationId))
      .orderBy(desc(payments.createdAt));
  }

  async getPayment(id: string): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    return payment;
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await db
      .insert(payments)
      .values(payment)
      .returning();
    return newPayment;
  }

  async updatePayment(id: string, payment: Partial<InsertPayment>): Promise<Payment> {
    const [updatedPayment] = await db
      .update(payments)
      .set({ ...payment, updatedAt: new Date() })
      .where(eq(payments.id, id))
      .returning();
    return updatedPayment;
  }

  async getPendingPayments(organizationId: string): Promise<Payment[]> {
    return await db
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.organizationId, organizationId),
          eq(payments.status, "pending")
        )
      )
      .orderBy(payments.dueDate);
  }

  // Expense operations
  async getExpenses(organizationId: string): Promise<Expense[]> {
    return await db
      .select()
      .from(expenses)
      .where(eq(expenses.organizationId, organizationId))
      .orderBy(desc(expenses.createdAt));
  }

  async getExpense(id: string): Promise<Expense | undefined> {
    const [expense] = await db.select().from(expenses).where(eq(expenses.id, id));
    return expense;
  }

  async createExpense(expense: InsertExpense): Promise<Expense> {
    const [newExpense] = await db
      .insert(expenses)
      .values(expense)
      .returning();
    return newExpense;
  }

  async updateExpense(id: string, expense: Partial<InsertExpense>): Promise<Expense> {
    const [updatedExpense] = await db
      .update(expenses)
      .set({ ...expense, updatedAt: new Date() })
      .where(eq(expenses.id, id))
      .returning();
    return updatedExpense;
  }

  // Digital wallet operations
  async getDigitalWallets(organizationId: string): Promise<DigitalWallet[]> {
    return await db
      .select()
      .from(digitalWallets)
      .where(eq(digitalWallets.organizationId, organizationId))
      .orderBy(desc(digitalWallets.createdAt));
  }

  async getDigitalWallet(id: string): Promise<DigitalWallet | undefined> {
    const [wallet] = await db.select().from(digitalWallets).where(eq(digitalWallets.id, id));
    return wallet;
  }

  async createDigitalWallet(wallet: InsertDigitalWallet): Promise<DigitalWallet> {
    const [newWallet] = await db
      .insert(digitalWallets)
      .values(wallet)
      .returning();
    return newWallet;
  }

  async updateDigitalWallet(id: string, wallet: Partial<InsertDigitalWallet>): Promise<DigitalWallet> {
    const [updatedWallet] = await db
      .update(digitalWallets)
      .set({ ...wallet, updatedAt: new Date() })
      .where(eq(digitalWallets.id, id))
      .returning();
    return updatedWallet;
  }

  // Transaction operations
  async getTransactions(organizationId: string): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.organizationId, organizationId))
      .orderBy(desc(transactions.createdAt));
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [newTransaction] = await db
      .insert(transactions)
      .values(transaction)
      .returning();
    return newTransaction;
  }

  // Analytics operations
  async getOrganizationStats(organizationId: string): Promise<{
    totalBudget: string;
    monthlyExpenses: string;
    activeVendors: number;
    pendingPayments: number;
  }> {
    const currentYear = new Date().getFullYear();
    
    // Get total budget for current year
    const budgetResult = await db
      .select({ total: sum(budgets.totalAmount) })
      .from(budgets)
      .where(
        and(
          eq(budgets.organizationId, organizationId),
          eq(budgets.fiscalYear, currentYear)
        )
      );

    // Get monthly expenses (current month)
    const currentMonth = new Date().getMonth() + 1;
    const expenseResult = await db
      .select({ total: sum(expenses.amount) })
      .from(expenses)
      .where(
        and(
          eq(expenses.organizationId, organizationId),
          sql`EXTRACT(MONTH FROM ${expenses.expenseDate}) = ${currentMonth}`,
          sql`EXTRACT(YEAR FROM ${expenses.expenseDate}) = ${currentYear}`
        )
      );

    // Get active vendors count
    const vendorResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(vendors)
      .where(
        and(
          eq(vendors.organizationId, organizationId),
          eq(vendors.status, "active")
        )
      );

    // Get pending payments count
    const pendingPaymentsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(payments)
      .where(
        and(
          eq(payments.organizationId, organizationId),
          eq(payments.status, "pending")
        )
      );

    return {
      totalBudget: budgetResult[0]?.total || "0",
      monthlyExpenses: expenseResult[0]?.total || "0",
      activeVendors: vendorResult[0]?.count || 0,
      pendingPayments: pendingPaymentsResult[0]?.count || 0,
    };
  }

  async getTopVendors(organizationId: string): Promise<Vendor[]> {
    return await db
      .select()
      .from(vendors)
      .where(eq(vendors.organizationId, organizationId))
      .orderBy(desc(vendors.totalSpend))
      .limit(5);
  }

  async getRecentActivity(organizationId: string): Promise<any[]> {
    // Get recent payments, expenses, and vendor registrations
    const recentPayments = await db
      .select({
        id: payments.id,
        type: sql<string>`'payment'`,
        description: payments.description,
        amount: payments.amount,
        createdAt: payments.createdAt,
      })
      .from(payments)
      .where(eq(payments.organizationId, organizationId))
      .orderBy(desc(payments.createdAt))
      .limit(5);

    const recentExpenses = await db
      .select({
        id: expenses.id,
        type: sql<string>`'expense'`,
        description: expenses.description,
        amount: expenses.amount,
        createdAt: expenses.createdAt,
      })
      .from(expenses)
      .where(eq(expenses.organizationId, organizationId))
      .orderBy(desc(expenses.createdAt))
      .limit(5);

    const recentVendors = await db
      .select({
        id: vendors.id,
        type: sql<string>`'vendor'`,
        description: vendors.name,
        amount: sql<string>`null`,
        createdAt: vendors.createdAt,
      })
      .from(vendors)
      .where(eq(vendors.organizationId, organizationId))
      .orderBy(desc(vendors.createdAt))
      .limit(5);

    // Combine and sort all activities
    const allActivities = [...recentPayments, ...recentExpenses, ...recentVendors];
    return allActivities
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
      .slice(0, 10);
  }
}

export const storage = new DatabaseStorage();
