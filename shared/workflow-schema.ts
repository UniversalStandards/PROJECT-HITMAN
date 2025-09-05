import { 
  pgTable, 
  varchar, 
  text, 
  timestamp, 
  jsonb,
  pgEnum,
  boolean,
  integer
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Workflow status enum
export const workflowStatusEnum = pgEnum("workflow_status", [
  "pending",
  "in_progress", 
  "approved",
  "rejected",
  "cancelled",
  "completed"
]);

// Workflow type enum
export const workflowTypeEnum = pgEnum("workflow_type", [
  "payment_approval",
  "vendor_onboarding",
  "budget_change",
  "expense_approval",
  "contract_approval",
  "requisition",
  "purchase_order"
]);

// Workflows table
export const workflows = pgTable("workflows", {
  id: varchar("id").primaryKey(),
  type: workflowTypeEnum("type").notNull(),
  status: workflowStatusEnum("status").default("pending").notNull(),
  organizationId: varchar("organization_id").notNull(),
  initiatorId: varchar("initiator_id").notNull(),
  
  // Workflow data
  entityId: varchar("entity_id"), // Reference to the entity (payment, vendor, etc.)
  entityType: varchar("entity_type"), // Type of entity
  data: jsonb("data").notNull(), // Workflow-specific data
  
  // Approval configuration
  requiredApprovals: integer("required_approvals").default(1),
  currentLevel: integer("current_level").default(1),
  maxLevel: integer("max_level").default(3),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  
  // Additional fields
  notes: text("notes"),
  priority: varchar("priority").default("normal"),
  dueDate: timestamp("due_date")
});

// Workflow approvals table
export const workflowApprovals = pgTable("workflow_approvals", {
  id: varchar("id").primaryKey(),
  workflowId: varchar("workflow_id").notNull(),
  approverId: varchar("approver_id").notNull(),
  level: integer("level").notNull(),
  
  action: varchar("action"), // approve, reject, request_info
  comments: text("comments"),
  approvedAt: timestamp("approved_at"),
  
  // Delegation
  delegatedTo: varchar("delegated_to"),
  delegatedAt: timestamp("delegated_at"),
  
  createdAt: timestamp("created_at").defaultNow()
});

// Workflow rules table
export const workflowRules = pgTable("workflow_rules", {
  id: varchar("id").primaryKey(),
  organizationId: varchar("organization_id").notNull(),
  type: workflowTypeEnum("type").notNull(),
  
  // Rule conditions
  conditions: jsonb("conditions").notNull(), // JSON with rule conditions
  
  // Approval matrix
  approvalMatrix: jsonb("approval_matrix").notNull(), // JSON with approval levels and approvers
  
  // Settings
  autoApproveBelow: integer("auto_approve_below"), // Amount threshold for auto-approval
  requireTwoFactorAbove: integer("require_two_factor_above"), // Amount requiring 2FA
  escalationDays: integer("escalation_days").default(3),
  
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Workflow notifications table  
export const workflowNotifications = pgTable("workflow_notifications", {
  id: varchar("id").primaryKey(),
  workflowId: varchar("workflow_id").notNull(),
  recipientId: varchar("recipient_id").notNull(),
  
  type: varchar("type").notNull(), // approval_required, status_change, escalation
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at"),
  
  actionRequired: boolean("action_required").default(false),
  actionUrl: varchar("action_url"),
  
  createdAt: timestamp("created_at").defaultNow()
});

// Two-factor authentication table
export const twoFactorAuth = pgTable("two_factor_auth", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull().unique(),
  
  secret: varchar("secret").notNull(),
  isEnabled: boolean("is_enabled").default(false),
  
  // Backup codes
  backupCodes: jsonb("backup_codes"),
  
  // Methods
  methods: jsonb("methods"), // Array of enabled methods: totp, sms, email
  primaryMethod: varchar("primary_method").default("totp"),
  
  phoneNumber: varchar("phone_number"),
  phoneVerified: boolean("phone_verified").default(false),
  
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Two-factor sessions table
export const twoFactorSessions = pgTable("two_factor_sessions", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  
  challengeCode: varchar("challenge_code").notNull(),
  method: varchar("method").notNull(), // totp, sms, email
  
  isVerified: boolean("is_verified").default(false),
  attempts: integer("attempts").default(0),
  maxAttempts: integer("max_attempts").default(3),
  
  expiresAt: timestamp("expires_at").notNull(),
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").defaultNow()
});

// Type exports
export type Workflow = typeof workflows.$inferSelect;
export type InsertWorkflow = typeof workflows.$inferInsert;
export type WorkflowApproval = typeof workflowApprovals.$inferSelect;
export type InsertWorkflowApproval = typeof workflowApprovals.$inferInsert;
export type WorkflowRule = typeof workflowRules.$inferSelect;
export type InsertWorkflowRule = typeof workflowRules.$inferInsert;
export type WorkflowNotification = typeof workflowNotifications.$inferSelect;
export type InsertWorkflowNotification = typeof workflowNotifications.$inferInsert;
export type TwoFactorAuth = typeof twoFactorAuth.$inferSelect;
export type InsertTwoFactorAuth = typeof twoFactorAuth.$inferInsert;
export type TwoFactorSession = typeof twoFactorSessions.$inferSelect;
export type InsertTwoFactorSession = typeof twoFactorSessions.$inferInsert;

// Zod schemas
export const insertWorkflowSchema = createInsertSchema(workflows);
export const insertWorkflowApprovalSchema = createInsertSchema(workflowApprovals);
export const insertWorkflowRuleSchema = createInsertSchema(workflowRules);
export const insertWorkflowNotificationSchema = createInsertSchema(workflowNotifications);
export const insertTwoFactorAuthSchema = createInsertSchema(twoFactorAuth);
export const insertTwoFactorSessionSchema = createInsertSchema(twoFactorSessions);