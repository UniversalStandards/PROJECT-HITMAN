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
export const paymentTypeEnum = pgEnum("payment_type", ["vendor", "payroll", "expense", "tax", "transfer", "ach", "wire", "instant", "check", "cryptocurrency", "international"]);
export const expenseStatusEnum = pgEnum("expense_status", ["draft", "submitted", "approved", "rejected", "reimbursed"]);
export const vendorStatusEnum = pgEnum("vendor_status", ["active", "inactive", "suspended", "pending_approval"]);
export const walletTypeEnum = pgEnum("wallet_type", ["checking", "savings", "payroll", "expense", "tax_collection", "treasury", "investment", "escrow", "grant", "utility"]);

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

// Payment Provider and Integration Enums
export const paymentProviderEnum = pgEnum("payment_provider", ["stripe", "paypal", "square", "unit", "modern_treasury", "saltedge", "plaid", "dwolla", "wise", "circle", "coinbase"]);
export const integrationTypeEnum = pgEnum("integration_type", ["payment", "banking", "compliance", "audit", "reporting", "government", "citizen_services", "procurement"]);
export const integrationStatusEnum = pgEnum("integration_status", ["active", "inactive", "pending", "error", "maintenance"]);
export const cardTypeEnum = pgEnum("card_type", ["debit", "credit", "prepaid", "virtual", "government_purchase"]);
export const cardStatusEnum = pgEnum("card_status", ["active", "inactive", "blocked", "expired", "pending"]);
export const complianceStatusEnum = pgEnum("compliance_status", ["compliant", "non_compliant", "pending_review", "flagged", "cleared"]);
export const auditStatusEnum = pgEnum("audit_status", ["scheduled", "in_progress", "completed", "failed", "requires_attention"]);
export const grantStatusEnum = pgEnum("grant_status", ["applied", "approved", "active", "completed", "rejected", "suspended"]);
export const assetStatusEnum = pgEnum("asset_status", ["active", "maintenance", "retired", "disposed", "lost"]);
export const procurementStatusEnum = pgEnum("procurement_status", ["draft", "published", "bidding", "awarded", "completed", "cancelled"]);

// Payment Providers Configuration
export const paymentProviders = pgTable("payment_providers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  provider: paymentProviderEnum("provider").notNull(),
  organizationId: varchar("organization_id").notNull(),
  isActive: boolean("is_active").default(true),
  configuration: jsonb("configuration").notNull(), // API keys, settings, etc.
  webhookUrl: varchar("webhook_url"),
  features: text("features").array().default([]), // supported features like ach, wire, cards
  dailyLimit: decimal("daily_limit", { precision: 15, scale: 2 }),
  monthlyLimit: decimal("monthly_limit", { precision: 15, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Integration Management
export const integrations = pgTable("integrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  type: integrationTypeEnum("type").notNull(),
  provider: varchar("provider").notNull(), // company name
  status: integrationStatusEnum("status").default("pending"),
  organizationId: varchar("organization_id").notNull(),
  configuration: jsonb("configuration").notNull(),
  lastSyncAt: timestamp("last_sync_at"),
  errorLog: text("error_log"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Card Issuing and Management
export const issuedCards = pgTable("issued_cards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cardNumber: varchar("card_number").notNull(), // encrypted
  cardType: cardTypeEnum("card_type").notNull(),
  status: cardStatusEnum("status").default("pending"),
  holderName: varchar("holder_name").notNull(),
  holderId: varchar("holder_id").notNull(), // user or employee ID
  organizationId: varchar("organization_id").notNull(),
  walletId: varchar("wallet_id"),
  provider: paymentProviderEnum("provider").notNull(),
  externalCardId: varchar("external_card_id"), // provider's card ID
  spendingLimit: decimal("spending_limit", { precision: 15, scale: 2 }),
  monthlyLimit: decimal("monthly_limit", { precision: 15, scale: 2 }),
  allowedCategories: text("allowed_categories").array().default([]),
  blockedCategories: text("blocked_categories").array().default([]),
  expiryDate: timestamp("expiry_date"),
  isVirtual: boolean("is_virtual").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Bank Accounts (for ACH, Wire, etc.)
export const bankAccounts = pgTable("bank_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull(),
  accountName: varchar("account_name").notNull(),
  accountNumber: varchar("account_number").notNull(), // encrypted
  routingNumber: varchar("routing_number").notNull(),
  bankName: varchar("bank_name").notNull(),
  accountType: varchar("account_type").notNull(), // checking, savings, etc.
  isVerified: boolean("is_verified").default(false),
  isActive: boolean("is_active").default(true),
  provider: varchar("provider"), // plaid, unit, etc.
  externalAccountId: varchar("external_account_id"),
  balance: decimal("balance", { precision: 15, scale: 2 }).default("0"),
  lastBalanceUpdate: timestamp("last_balance_update"),
  capabilities: text("capabilities").array().default([]), // ach_in, ach_out, wire, etc.
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Compliance and Security Screening
export const complianceRecords = pgTable("compliance_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  entityType: varchar("entity_type").notNull(), // vendor, user, transaction
  entityId: varchar("entity_id").notNull(),
  organizationId: varchar("organization_id").notNull(),
  screeningType: varchar("screening_type").notNull(), // ofac, aml, background, etc.
  status: complianceStatusEnum("status").default("pending_review"),
  provider: varchar("provider").notNull(), // thomson_reuters, lexisnexis, etc.
  results: jsonb("results"),
  riskScore: integer("risk_score"),
  flags: text("flags").array().default([]),
  reviewedBy: varchar("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Audit Trails and Logs
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull(),
  userId: varchar("user_id"),
  action: varchar("action").notNull(),
  entityType: varchar("entity_type").notNull(),
  entityId: varchar("entity_id"),
  oldValues: jsonb("old_values"),
  newValues: jsonb("new_values"),
  ipAddress: varchar("ip_address"),
  userAgent: varchar("user_agent"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Grant Management
export const grants = pgTable("grants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull(),
  grantorName: varchar("grantor_name").notNull(),
  grantName: varchar("grant_name").notNull(),
  grantNumber: varchar("grant_number"),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  amountReceived: decimal("amount_received", { precision: 15, scale: 2 }).default("0"),
  amountSpent: decimal("amount_spent", { precision: 15, scale: 2 }).default("0"),
  status: grantStatusEnum("status").default("applied"),
  applicationDate: timestamp("application_date"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  purpose: text("purpose"),
  restrictions: text("restrictions"),
  reportingRequirements: text("reporting_requirements"),
  managedBy: varchar("managed_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Asset Management
export const assets = pgTable("assets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull(),
  assetTag: varchar("asset_tag").notNull(),
  name: varchar("name").notNull(),
  category: varchar("category").notNull(), // vehicle, equipment, software, etc.
  description: text("description"),
  purchasePrice: decimal("purchase_price", { precision: 15, scale: 2 }),
  currentValue: decimal("current_value", { precision: 15, scale: 2 }),
  status: assetStatusEnum("status").default("active"),
  location: varchar("location"),
  assignedTo: varchar("assigned_to"),
  purchaseDate: timestamp("purchase_date"),
  warrantyExpiry: timestamp("warranty_expiry"),
  maintenanceSchedule: jsonb("maintenance_schedule"),
  depreciationMethod: varchar("depreciation_method"),
  usefulLife: integer("useful_life_years"),
  vendorId: varchar("vendor_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Procurement Management
export const procurements = pgTable("procurements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull(),
  procurementNumber: varchar("procurement_number").notNull(),
  title: varchar("title").notNull(),
  description: text("description"),
  category: varchar("category").notNull(),
  estimatedValue: decimal("estimated_value", { precision: 15, scale: 2 }),
  budgetCategoryId: varchar("budget_category_id"),
  status: procurementStatusEnum("status").default("draft"),
  publicationDate: timestamp("publication_date"),
  biddingDeadline: timestamp("bidding_deadline"),
  awardDate: timestamp("award_date"),
  awardedVendorId: varchar("awarded_vendor_id"),
  awardedAmount: decimal("awarded_amount", { precision: 15, scale: 2 }),
  contractStartDate: timestamp("contract_start_date"),
  contractEndDate: timestamp("contract_end_date"),
  managedBy: varchar("managed_by").notNull(),
  requirements: text("requirements"),
  evaluationCriteria: text("evaluation_criteria"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Citizen Services and Interactions
export const citizenServices = pgTable("citizen_services", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull(),
  serviceName: varchar("service_name").notNull(),
  serviceType: varchar("service_type").notNull(), // utility, tax, permit, fine, etc.
  citizenIdentifier: varchar("citizen_identifier"), // tax ID, account number, etc.
  citizenName: varchar("citizen_name"),
  citizenEmail: varchar("citizen_email"),
  citizenPhone: varchar("citizen_phone"),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  dueDate: timestamp("due_date"),
  paymentStatus: paymentStatusEnum("payment_status").default("pending"),
  paymentMethod: varchar("payment_method"),
  transactionId: varchar("transaction_id"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Enhanced Transactions for Multi-Provider Support
export const enhancedTransactions = pgTable("enhanced_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  currency: varchar("currency").default("USD"),
  type: varchar("type").notNull(), // debit, credit
  paymentType: paymentTypeEnum("payment_type").notNull(),
  provider: paymentProviderEnum("provider").notNull(),
  providerTransactionId: varchar("provider_transaction_id"),
  status: paymentStatusEnum("status").default("pending"),
  description: text("description"),
  fromAccountId: varchar("from_account_id"),
  toAccountId: varchar("to_account_id"),
  walletId: varchar("wallet_id"),
  paymentId: varchar("payment_id"),
  expenseId: varchar("expense_id"),
  grantId: varchar("grant_id"),
  assetId: varchar("asset_id"),
  procurementId: varchar("procurement_id"),
  organizationId: varchar("organization_id").notNull(),
  fees: decimal("fees", { precision: 15, scale: 2 }).default("0"),
  exchangeRate: decimal("exchange_rate", { precision: 10, scale: 6 }),
  settlementDate: timestamp("settlement_date"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Enhanced Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
  createdBudgets: many(budgets),
  createdPayments: many(payments),
  submittedExpenses: many(expenses),
  issuedCards: many(issuedCards),
  auditLogs: many(auditLogs),
  managedGrants: many(grants),
  managedAssets: many(assets),
  managedProcurements: many(procurements),
}));

export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
  budgets: many(budgets),
  vendors: many(vendors),
  payments: many(payments),
  expenses: many(expenses),
  digitalWallets: many(digitalWallets),
  transactions: many(transactions),
  paymentProviders: many(paymentProviders),
  integrations: many(integrations),
  issuedCards: many(issuedCards),
  bankAccounts: many(bankAccounts),
  complianceRecords: many(complianceRecords),
  auditLogs: many(auditLogs),
  grants: many(grants),
  assets: many(assets),
  procurements: many(procurements),
  citizenServices: many(citizenServices),
  enhancedTransactions: many(enhancedTransactions),
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

// Additional Relations
export const paymentProvidersRelations = relations(paymentProviders, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [paymentProviders.organizationId],
    references: [organizations.id],
  }),
  issuedCards: many(issuedCards),
  enhancedTransactions: many(enhancedTransactions),
}));

export const integrationsRelations = relations(integrations, ({ one }) => ({
  organization: one(organizations, {
    fields: [integrations.organizationId],
    references: [organizations.id],
  }),
}));

export const issuedCardsRelations = relations(issuedCards, ({ one }) => ({
  organization: one(organizations, {
    fields: [issuedCards.organizationId],
    references: [organizations.id],
  }),
  holder: one(users, {
    fields: [issuedCards.holderId],
    references: [users.id],
  }),
  wallet: one(digitalWallets, {
    fields: [issuedCards.walletId],
    references: [digitalWallets.id],
  }),
  provider: one(paymentProviders, {
    fields: [issuedCards.provider],
    references: [paymentProviders.provider],
  }),
}));

export const bankAccountsRelations = relations(bankAccounts, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [bankAccounts.organizationId],
    references: [organizations.id],
  }),
  enhancedTransactions: many(enhancedTransactions),
}));

export const complianceRecordsRelations = relations(complianceRecords, ({ one }) => ({
  organization: one(organizations, {
    fields: [complianceRecords.organizationId],
    references: [organizations.id],
  }),
  reviewer: one(users, {
    fields: [complianceRecords.reviewedBy],
    references: [users.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  organization: one(organizations, {
    fields: [auditLogs.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

export const grantsRelations = relations(grants, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [grants.organizationId],
    references: [organizations.id],
  }),
  manager: one(users, {
    fields: [grants.managedBy],
    references: [users.id],
  }),
  enhancedTransactions: many(enhancedTransactions),
}));

export const assetsRelations = relations(assets, ({ one }) => ({
  organization: one(organizations, {
    fields: [assets.organizationId],
    references: [organizations.id],
  }),
  assignee: one(users, {
    fields: [assets.assignedTo],
    references: [users.id],
  }),
  vendor: one(vendors, {
    fields: [assets.vendorId],
    references: [vendors.id],
  }),
}));

export const procurementsRelations = relations(procurements, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [procurements.organizationId],
    references: [organizations.id],
  }),
  budgetCategory: one(budgetCategories, {
    fields: [procurements.budgetCategoryId],
    references: [budgetCategories.id],
  }),
  manager: one(users, {
    fields: [procurements.managedBy],
    references: [users.id],
  }),
  awardedVendor: one(vendors, {
    fields: [procurements.awardedVendorId],
    references: [vendors.id],
  }),
  enhancedTransactions: many(enhancedTransactions),
}));

export const citizenServicesRelations = relations(citizenServices, ({ one }) => ({
  organization: one(organizations, {
    fields: [citizenServices.organizationId],
    references: [organizations.id],
  }),
}));

export const enhancedTransactionsRelations = relations(enhancedTransactions, ({ one }) => ({
  fromAccount: one(bankAccounts, {
    fields: [enhancedTransactions.fromAccountId],
    references: [bankAccounts.id],
  }),
  toAccount: one(bankAccounts, {
    fields: [enhancedTransactions.toAccountId],
    references: [bankAccounts.id],
  }),
  wallet: one(digitalWallets, {
    fields: [enhancedTransactions.walletId],
    references: [digitalWallets.id],
  }),
  payment: one(payments, {
    fields: [enhancedTransactions.paymentId],
    references: [payments.id],
  }),
  expense: one(expenses, {
    fields: [enhancedTransactions.expenseId],
    references: [expenses.id],
  }),
  grant: one(grants, {
    fields: [enhancedTransactions.grantId],
    references: [grants.id],
  }),
  asset: one(assets, {
    fields: [enhancedTransactions.assetId],
    references: [assets.id],
  }),
  procurement: one(procurements, {
    fields: [enhancedTransactions.procurementId],
    references: [procurements.id],
  }),
  organization: one(organizations, {
    fields: [enhancedTransactions.organizationId],
    references: [organizations.id],
  }),
  provider: one(paymentProviders, {
    fields: [enhancedTransactions.provider],
    references: [paymentProviders.provider],
  }),
}));

// Enhanced Insert Schemas
export const insertPaymentProviderSchema = createInsertSchema(paymentProviders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertIntegrationSchema = createInsertSchema(integrations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertIssuedCardSchema = createInsertSchema(issuedCards).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBankAccountSchema = createInsertSchema(bankAccounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertComplianceRecordSchema = createInsertSchema(complianceRecords).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});

export const insertGrantSchema = createInsertSchema(grants).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAssetSchema = createInsertSchema(assets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProcurementSchema = createInsertSchema(procurements).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCitizenServiceSchema = createInsertSchema(citizenServices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEnhancedTransactionSchema = createInsertSchema(enhancedTransactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Enhanced Types
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

// New Types
export type PaymentProvider = typeof paymentProviders.$inferSelect;
export type InsertPaymentProvider = z.infer<typeof insertPaymentProviderSchema>;
export type Integration = typeof integrations.$inferSelect;
export type InsertIntegration = z.infer<typeof insertIntegrationSchema>;
export type IssuedCard = typeof issuedCards.$inferSelect;
export type InsertIssuedCard = z.infer<typeof insertIssuedCardSchema>;
export type BankAccount = typeof bankAccounts.$inferSelect;
export type InsertBankAccount = z.infer<typeof insertBankAccountSchema>;
export type ComplianceRecord = typeof complianceRecords.$inferSelect;
export type InsertComplianceRecord = z.infer<typeof insertComplianceRecordSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type Grant = typeof grants.$inferSelect;
export type InsertGrant = z.infer<typeof insertGrantSchema>;
export type Asset = typeof assets.$inferSelect;
export type InsertAsset = z.infer<typeof insertAssetSchema>;
export type Procurement = typeof procurements.$inferSelect;
export type InsertProcurement = z.infer<typeof insertProcurementSchema>;
export type CitizenService = typeof citizenServices.$inferSelect;
export type InsertCitizenService = z.infer<typeof insertCitizenServiceSchema>;
export type EnhancedTransaction = typeof enhancedTransactions.$inferSelect;
export type InsertEnhancedTransaction = z.infer<typeof insertEnhancedTransactionSchema>;
