import { sql, relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  decimal,
  integer,
  pgEnum,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("user"),
  organizationId: varchar("organization_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const organizations = pgTable("organizations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  type: varchar("type").notNull(), // municipality, county, state, federal
  address: text("address"),
  phone: varchar("phone"),
  email: varchar("email"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const budgetStatusEnum = pgEnum("budget_status", ["draft", "proposed", "approved", "active", "closed"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "approved", "processing", "completed", "failed", "cancelled"]);
export const paymentTypeEnum = pgEnum("payment_type", ["vendor", "payroll", "expense", "tax", "transfer"]);
export const expenseStatusEnum = pgEnum("expense_status", ["draft", "submitted", "approved", "rejected", "reimbursed"]);
export const vendorStatusEnum = pgEnum("vendor_status", ["active", "inactive", "suspended", "pending_approval"]);
export const walletTypeEnum = pgEnum("wallet_type", ["checking", "savings", "payroll", "expense", "tax_collection"]);

export const budgets = pgTable("budgets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  organizationId: varchar("organization_id").notNull(),
  fiscalYear: integer("fiscal_year").notNull(),
  totalAmount: decimal("total_amount", { precision: 15, scale: 2 }).notNull(),
  allocatedAmount: decimal("allocated_amount", { precision: 15, scale: 2 }).default("0"),
  spentAmount: decimal("spent_amount", { precision: 15, scale: 2 }).default("0"),
  status: budgetStatusEnum("status").default("draft"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const budgetCategories = pgTable("budget_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  budgetId: varchar("budget_id").notNull(),
  allocatedAmount: decimal("allocated_amount", { precision: 15, scale: 2 }).notNull(),
  spentAmount: decimal("spent_amount", { precision: 15, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const vendors = pgTable("vendors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  email: varchar("email"),
  phone: varchar("phone"),
  address: text("address"),
  taxId: varchar("tax_id"),
  businessType: varchar("business_type"),
  status: vendorStatusEnum("status").default("pending_approval"),
  organizationId: varchar("organization_id").notNull(),
  totalSpend: decimal("total_spend", { precision: 15, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  description: text("description"),
  type: paymentTypeEnum("type").notNull(),
  status: paymentStatusEnum("status").default("pending"),
  vendorId: varchar("vendor_id"),
  budgetCategoryId: varchar("budget_category_id"),
  organizationId: varchar("organization_id").notNull(),
  dueDate: timestamp("due_date"),
  processedDate: timestamp("processed_date"),
  createdBy: varchar("created_by").notNull(),
  approvedBy: varchar("approved_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const expenses = pgTable("expenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  description: text("description").notNull(),
  status: expenseStatusEnum("status").default("draft"),
  category: varchar("category"),
  receiptUrl: varchar("receipt_url"),
  expenseDate: timestamp("expense_date").notNull(),
  submittedBy: varchar("submitted_by").notNull(),
  approvedBy: varchar("approved_by"),
  budgetCategoryId: varchar("budget_category_id"),
  organizationId: varchar("organization_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const digitalWallets = pgTable("digital_wallets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  type: walletTypeEnum("type").notNull(),
  balance: decimal("balance", { precision: 15, scale: 2 }).default("0"),
  accountNumber: varchar("account_number"),
  routingNumber: varchar("routing_number"),
  isActive: boolean("is_active").default(true),
  organizationId: varchar("organization_id").notNull(),
  externalAccountId: varchar("external_account_id"), // for integration with banking APIs
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  type: varchar("type").notNull(), // debit, credit
  description: text("description"),
  walletId: varchar("wallet_id").notNull(),
  paymentId: varchar("payment_id"),
  expenseId: varchar("expense_id"),
  organizationId: varchar("organization_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
  createdBudgets: many(budgets),
  createdPayments: many(payments),
  submittedExpenses: many(expenses),
}));

export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
  budgets: many(budgets),
  vendors: many(vendors),
  payments: many(payments),
  expenses: many(expenses),
  digitalWallets: many(digitalWallets),
  transactions: many(transactions),
}));

export const budgetsRelations = relations(budgets, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [budgets.organizationId],
    references: [organizations.id],
  }),
  creator: one(users, {
    fields: [budgets.createdBy],
    references: [users.id],
  }),
  categories: many(budgetCategories),
}));

export const budgetCategoriesRelations = relations(budgetCategories, ({ one, many }) => ({
  budget: one(budgets, {
    fields: [budgetCategories.budgetId],
    references: [budgets.id],
  }),
  payments: many(payments),
  expenses: many(expenses),
}));

export const vendorsRelations = relations(vendors, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [vendors.organizationId],
    references: [organizations.id],
  }),
  payments: many(payments),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  vendor: one(vendors, {
    fields: [payments.vendorId],
    references: [vendors.id],
  }),
  budgetCategory: one(budgetCategories, {
    fields: [payments.budgetCategoryId],
    references: [budgetCategories.id],
  }),
  organization: one(organizations, {
    fields: [payments.organizationId],
    references: [organizations.id],
  }),
  creator: one(users, {
    fields: [payments.createdBy],
    references: [users.id],
  }),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  submitter: one(users, {
    fields: [expenses.submittedBy],
    references: [users.id],
  }),
  budgetCategory: one(budgetCategories, {
    fields: [expenses.budgetCategoryId],
    references: [budgetCategories.id],
  }),
  organization: one(organizations, {
    fields: [expenses.organizationId],
    references: [organizations.id],
  }),
}));

export const digitalWalletsRelations = relations(digitalWallets, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [digitalWallets.organizationId],
    references: [organizations.id],
  }),
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  wallet: one(digitalWallets, {
    fields: [transactions.walletId],
    references: [digitalWallets.id],
  }),
  payment: one(payments, {
    fields: [transactions.paymentId],
    references: [payments.id],
  }),
  expense: one(expenses, {
    fields: [transactions.expenseId],
    references: [expenses.id],
  }),
  organization: one(organizations, {
    fields: [transactions.organizationId],
    references: [organizations.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrganizationSchema = createInsertSchema(organizations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBudgetSchema = createInsertSchema(budgets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBudgetCategorySchema = createInsertSchema(budgetCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertVendorSchema = createInsertSchema(vendors).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertExpenseSchema = createInsertSchema(expenses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDigitalWalletSchema = createInsertSchema(digitalWallets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type Budget = typeof budgets.$inferSelect;
export type InsertBudget = z.infer<typeof insertBudgetSchema>;
export type BudgetCategory = typeof budgetCategories.$inferSelect;
export type InsertBudgetCategory = z.infer<typeof insertBudgetCategorySchema>;
export type Vendor = typeof vendors.$inferSelect;
export type InsertVendor = z.infer<typeof insertVendorSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type DigitalWallet = typeof digitalWallets.$inferSelect;
export type InsertDigitalWallet = z.infer<typeof insertDigitalWalletSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
