import { db } from './db';
import { 
  workflows, 
  workflowApprovals,
  workflowRules,
  workflowNotifications,
  type Workflow,
  type InsertWorkflow,
  type WorkflowApproval,
  type InsertWorkflowApproval,
  type InsertWorkflowNotification
} from '@shared/workflow-schema';
import { eq, and, desc, gte } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { wsManager } from './websocket';

interface WorkflowConfig {
  type: string;
  entityId: string;
  entityType: string;
  organizationId: string;
  initiatorId: string;
  data: any;
  priority?: string;
  dueDate?: Date;
}

interface ApprovalAction {
  workflowId: string;
  approverId: string;
  action: 'approve' | 'reject' | 'request_info';
  comments?: string;
}

class WorkflowService {
  // Create new workflow
  async createWorkflow(config: WorkflowConfig): Promise<Workflow> {
    try {
      // Get workflow rules for organization
      const [rule] = await db
        .select()
        .from(workflowRules)
        .where(
          and(
            eq(workflowRules.organizationId, config.organizationId),
            eq(workflowRules.type, config.type as any),
            eq(workflowRules.isActive, true)
          )
        )
        .limit(1);

      if (!rule) {
        throw new Error(`No active workflow rule found for type: ${config.type}`);
      }

      // Check auto-approval conditions
      const amount = config.data?.amount;
      const autoApproveThreshold = rule.autoApproveBelow;
      
      let initialStatus: any = 'pending';
      if (autoApproveThreshold && amount && amount < autoApproveThreshold) {
        initialStatus = 'approved';
      }

      // Create workflow
      const workflowData: InsertWorkflow = {
        id: nanoid(),
        type: config.type as any,
        status: initialStatus,
        organizationId: config.organizationId,
        initiatorId: config.initiatorId,
        entityId: config.entityId,
        entityType: config.entityType,
        data: config.data,
        priority: config.priority || 'normal',
        dueDate: config.dueDate,
        requiredApprovals: (rule.approvalMatrix as any)?.levels?.[0]?.required || 1,
        maxLevel: (rule.approvalMatrix as any)?.levels?.length || 1
      };

      const [workflow] = await db
        .insert(workflows)
        .values(workflowData)
        .returning();

      // If not auto-approved, create approval records
      if (initialStatus === 'pending') {
        await this.createApprovalRecords(workflow, rule);
        await this.notifyApprovers(workflow, rule);
      } else {
        // Notify initiator of auto-approval
        await this.createNotification({
          workflowId: workflow.id,
          recipientId: workflow.initiatorId,
          type: 'status_change',
          title: 'Workflow Auto-Approved',
          message: `Your ${config.type.replace('_', ' ')} request has been automatically approved.`,
          actionRequired: false
        });
      }

      return workflow;
    } catch (error) {
      console.error('Error creating workflow:', error);
      throw error;
    }
  }

  // Create approval records based on workflow rules
  private async createApprovalRecords(workflow: Workflow, rule: any) {
    const approvalMatrix = rule.approvalMatrix as any;
    const firstLevel = approvalMatrix?.levels?.[0];
    
    if (!firstLevel) return;

    const approvers = firstLevel.approvers || [];
    
    for (const approverId of approvers) {
      await db.insert(workflowApprovals).values({
        id: nanoid(),
        workflowId: workflow.id,
        approverId,
        level: 1
      });
    }
  }

  // Notify approvers
  private async notifyApprovers(workflow: Workflow, rule: any) {
    const approvalMatrix = rule.approvalMatrix as any;
    const level = workflow.currentLevel || 1;
    const currentLevel = approvalMatrix?.levels?.[level - 1];
    
    if (!currentLevel) return;

    const approvers = currentLevel.approvers || [];
    
    for (const approverId of approvers) {
      await this.createNotification({
        workflowId: workflow.id,
        recipientId: approverId,
        type: 'approval_required',
        title: 'Approval Required',
        message: `A ${workflow.type.replace('_', ' ')} request requires your approval.`,
        actionRequired: true,
        actionUrl: `/workflows/${workflow.id}`
      });

      // Send real-time notification
      wsManager.sendToUser(approverId, {
        type: 'notification',
        data: {
          title: 'Approval Required',
          message: `A ${workflow.type.replace('_', ' ')} request requires your approval.`,
          workflowId: workflow.id,
          requiresAction: true
        },
        userId: approverId,
        timestamp: Date.now()
      });
    }
  }

  // Process approval action
  async processApproval(action: ApprovalAction): Promise<Workflow> {
    try {
      // Get workflow
      const [workflow] = await db
        .select()
        .from(workflows)
        .where(eq(workflows.id, action.workflowId))
        .limit(1);

      if (!workflow) {
        throw new Error('Workflow not found');
      }

      if (workflow.status !== 'pending' && workflow.status !== 'in_progress') {
        throw new Error('Workflow is not in a state that can be approved');
      }

      // Get approval record
      const [approval] = await db
        .select()
        .from(workflowApprovals)
        .where(
          and(
            eq(workflowApprovals.workflowId, action.workflowId),
            eq(workflowApprovals.approverId, action.approverId)
          )
        )
        .limit(1);

      if (!approval) {
        throw new Error('Approval record not found for this approver');
      }

      // Update approval record
      await db
        .update(workflowApprovals)
        .set({
          action: action.action,
          comments: action.comments,
          approvedAt: new Date()
        })
        .where(eq(workflowApprovals.id, approval.id));

      // Process based on action
      let newStatus = workflow.status;
      
      if (action.action === 'approve') {
        // Check if all approvals for current level are complete
        const levelApprovals = await db
          .select()
          .from(workflowApprovals)
          .where(
            and(
              eq(workflowApprovals.workflowId, workflow.id),
              eq(workflowApprovals.level, workflow.currentLevel || 1)
            )
          );

        const allApproved = levelApprovals.every(a => a.action === 'approve');

        if (allApproved) {
          const currentLevel = workflow.currentLevel || 1;
          const maxLevel = workflow.maxLevel || 1;
          if (currentLevel < maxLevel) {
            // Move to next level
            newStatus = 'in_progress';
            await db
              .update(workflows)
              .set({
                currentLevel: currentLevel + 1,
                status: newStatus,
                updatedAt: new Date()
              })
              .where(eq(workflows.id, workflow.id));

            // Create approvals for next level
            const [rule] = await db
              .select()
              .from(workflowRules)
              .where(
                and(
                  eq(workflowRules.organizationId, workflow.organizationId),
                  eq(workflowRules.type, workflow.type),
                  eq(workflowRules.isActive, true)
                )
              )
              .limit(1);

            if (rule) {
              await this.createApprovalRecords(
                { ...workflow, currentLevel: currentLevel + 1 },
                rule
              );
              await this.notifyApprovers(
                { ...workflow, currentLevel: currentLevel + 1 },
                rule
              );
            }
          } else {
            // All levels complete - approve workflow
            newStatus = 'approved' as any;
            await db
              .update(workflows)
              .set({
                status: newStatus,
                completedAt: new Date(),
                updatedAt: new Date()
              })
              .where(eq(workflows.id, workflow.id));

            // Notify initiator
            await this.createNotification({
              workflowId: workflow.id,
              recipientId: workflow.initiatorId,
              type: 'status_change',
              title: 'Workflow Approved',
              message: `Your ${workflow.type.replace('_', ' ')} request has been approved.`,
              actionRequired: false
            });
          }
        }
      } else if (action.action === 'reject') {
        newStatus = 'rejected' as any;
        await db
          .update(workflows)
          .set({
            status: newStatus,
            completedAt: new Date(),
            updatedAt: new Date()
          })
          .where(eq(workflows.id, workflow.id));

        // Notify initiator
        await this.createNotification({
          workflowId: workflow.id,
          recipientId: workflow.initiatorId,
          type: 'status_change',
          title: 'Workflow Rejected',
          message: `Your ${workflow.type.replace('_', ' ')} request has been rejected. Reason: ${action.comments || 'No reason provided'}`,
          actionRequired: false
        });
      }

      // Send real-time update
      wsManager.sendToUser(workflow.initiatorId, {
        type: 'update',
        data: {
          workflowId: workflow.id,
          status: newStatus,
          message: `Workflow ${newStatus}`
        },
        userId: workflow.initiatorId,
        timestamp: Date.now()
      });

      return { ...workflow, status: newStatus };
    } catch (error) {
      console.error('Error processing approval:', error);
      throw error;
    }
  }

  // Create notification
  private async createNotification(notification: Omit<InsertWorkflowNotification, 'id'>) {
    await db.insert(workflowNotifications).values({
      id: nanoid(),
      ...notification
    });
  }

  // Get workflows for user
  async getUserWorkflows(userId: string, organizationId: string) {
    // Get workflows initiated by user
    const initiated = await db
      .select()
      .from(workflows)
      .where(
        and(
          eq(workflows.initiatorId, userId),
          eq(workflows.organizationId, organizationId)
        )
      )
      .orderBy(desc(workflows.createdAt));

    // Get workflows requiring approval from user
    const approvalsNeeded = await db
      .select({
        workflow: workflows,
        approval: workflowApprovals
      })
      .from(workflowApprovals)
      .innerJoin(workflows, eq(workflowApprovals.workflowId, workflows.id))
      .where(
        and(
          eq(workflowApprovals.approverId, userId),
          eq(workflows.organizationId, organizationId),
          eq(workflows.status, 'pending')
        )
      )
      .orderBy(desc(workflows.createdAt));

    return {
      initiated,
      pendingApproval: approvalsNeeded.map(a => a.workflow)
    };
  }

  // Check for escalations
  async checkEscalations() {
    try {
      const now = new Date();
      
      // Get all pending workflows with escalation rules
      const pendingWorkflows = await db
        .select({
          workflow: workflows,
          rule: workflowRules
        })
        .from(workflows)
        .innerJoin(
          workflowRules,
          and(
            eq(workflows.organizationId, workflowRules.organizationId),
            eq(workflows.type, workflowRules.type)
          )
        )
        .where(
          and(
            eq(workflows.status, 'pending'),
            gte(workflowRules.escalationDays, 0)
          )
        );

      for (const { workflow, rule } of pendingWorkflows) {
        const daysSinceCreation = Math.floor(
          (now.getTime() - new Date(workflow.createdAt!).getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceCreation >= rule.escalationDays!) {
          // Escalate workflow
          await this.escalateWorkflow(workflow, rule);
        }
      }
    } catch (error) {
      console.error('Error checking escalations:', error);
    }
  }

  // Escalate workflow
  private async escalateWorkflow(workflow: Workflow, rule: any) {
    // Get supervisor approvers from next level
    const approvalMatrix = rule.approvalMatrix as any;
    const currentLevel = workflow.currentLevel || 1;
    const nextLevel = approvalMatrix?.levels?.[currentLevel];
    
    if (nextLevel && nextLevel.approvers) {
      for (const approverId of nextLevel.approvers) {
        await this.createNotification({
          workflowId: workflow.id,
          recipientId: approverId,
          type: 'escalation',
          title: 'Workflow Escalated',
          message: `A ${workflow.type.replace('_', ' ')} request has been escalated and requires immediate attention.`,
          actionRequired: true,
          actionUrl: `/workflows/${workflow.id}`
        });

        // Send real-time notification
        wsManager.sendToUser(approverId, {
          type: 'alert',
          data: {
            title: 'Workflow Escalated',
            message: `A ${workflow.type.replace('_', ' ')} request requires immediate attention.`,
            severity: 'warning',
            workflowId: workflow.id
          },
          userId: approverId,
          timestamp: Date.now()
        });
      }
    }
  }
}

export const workflowService = new WorkflowService();

// Start escalation checker (runs every hour)
setInterval(() => {
  workflowService.checkEscalations();
}, 60 * 60 * 1000);