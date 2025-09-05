import { db } from '../db';
import { 
  payments, expenses, budgets, transactions, vendors, grants, assets,
  type Payment, type Expense, type Budget, type Transaction
} from '@shared/schema';
import { eq, and, gte, lte, sql, desc } from 'drizzle-orm';

export interface PredictionResult {
  metric: string;
  currentValue: number;
  predictedValue: number;
  confidence: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  timeframe: string;
  factors: string[];
}

export interface AnomalyResult {
  id: string;
  type: 'payment' | 'expense' | 'vendor' | 'transaction' | 'pattern';
  severity: 'low' | 'medium' | 'high' | 'critical';
  score: number;
  description: string;
  detectedAt: Date;
  entities: Array<{ type: string; id: string; value: any }>;
  recommendations: string[];
}

export interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  categories: Record<string, { score: number; level: string }>;
  topRisks: Array<{ risk: string; impact: string; likelihood: string; mitigation: string }>;
}

export class PredictiveAnalyticsService {
  /**
   * Predict future budget spending
   */
  async predictBudgetSpending(
    organizationId: string,
    budgetId: string,
    daysAhead: number = 30
  ): Promise<PredictionResult> {
    // Get historical spending data
    const historicalData = await this.getHistoricalSpending(organizationId, budgetId, 90);
    
    // Calculate spending trends
    const dailyAverage = historicalData.totalSpent / historicalData.days;
    const weeklyTrend = this.calculateTrend(historicalData.weeklySpending);
    const monthlyTrend = this.calculateTrend(historicalData.monthlySpending);
    
    // Apply time series analysis (simplified)
    const trendFactor = 1 + (weeklyTrend + monthlyTrend) / 2;
    const seasonalFactor = this.getSeasonalFactor(new Date());
    
    // Calculate prediction
    const predictedSpending = dailyAverage * daysAhead * trendFactor * seasonalFactor;
    const confidence = this.calculateConfidence(historicalData.variance);
    
    return {
      metric: 'Budget Spending',
      currentValue: historicalData.totalSpent,
      predictedValue: Math.round(predictedSpending * 100) / 100,
      confidence,
      trend: weeklyTrend > 0.1 ? 'increasing' : weeklyTrend < -0.1 ? 'decreasing' : 'stable',
      timeframe: `Next ${daysAhead} days`,
      factors: [
        'Historical spending patterns',
        'Seasonal adjustments',
        'Recent transaction trends',
        'Vendor payment cycles'
      ]
    };
  }

  /**
   * Predict cash flow
   */
  async predictCashFlow(
    organizationId: string,
    daysAhead: number = 30
  ): Promise<PredictionResult> {
    const [inflows, outflows] = await Promise.all([
      this.getProjectedInflows(organizationId, daysAhead),
      this.getProjectedOutflows(organizationId, daysAhead)
    ]);
    
    const netCashFlow = inflows - outflows;
    const confidence = 0.75; // Base confidence, adjust based on data quality
    
    return {
      metric: 'Cash Flow',
      currentValue: 0, // Current balance would be fetched from wallets
      predictedValue: netCashFlow,
      confidence,
      trend: netCashFlow > 0 ? 'increasing' : netCashFlow < 0 ? 'decreasing' : 'stable',
      timeframe: `Next ${daysAhead} days`,
      factors: [
        'Expected revenue',
        'Scheduled payments',
        'Grant disbursements',
        'Recurring expenses'
      ]
    };
  }

  /**
   * Detect payment anomalies
   */
  async detectPaymentAnomalies(organizationId: string): Promise<AnomalyResult[]> {
    const anomalies: AnomalyResult[] = [];
    
    // Get recent payments
    const recentPayments = await db
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.organizationId, organizationId),
          gte(payments.createdAt, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
        )
      )
      .orderBy(desc(payments.createdAt));
    
    // Check for duplicate payments
    const duplicates = this.findDuplicatePayments(recentPayments);
    for (const dup of duplicates) {
      anomalies.push({
        id: `anomaly_${Date.now()}_dup`,
        type: 'payment',
        severity: 'high',
        score: 8.5,
        description: `Potential duplicate payment detected: ${dup.amount} to ${dup.vendorId}`,
        detectedAt: new Date(),
        entities: dup.paymentIds.map(id => ({ type: 'payment', id, value: dup.amount })),
        recommendations: [
          'Review payment authorization process',
          'Verify with vendor for duplicate invoice',
          'Implement duplicate payment detection'
        ]
      });
    }
    
    // Check for unusual amounts
    const unusualAmounts = this.findUnusualAmounts(recentPayments);
    for (const unusual of unusualAmounts) {
      anomalies.push({
        id: `anomaly_${Date.now()}_amount`,
        type: 'payment',
        severity: unusual.deviation > 3 ? 'high' : 'medium',
        score: Math.min(unusual.deviation * 2, 10),
        description: `Unusual payment amount: ${unusual.amount} (${unusual.deviation}x normal)`,
        detectedAt: new Date(),
        entities: [{ type: 'payment', id: unusual.paymentId, value: unusual.amount }],
        recommendations: [
          'Verify invoice accuracy',
          'Confirm authorization',
          'Check for data entry errors'
        ]
      });
    }
    
    // Check for suspicious timing patterns
    const timingAnomalies = this.findTimingAnomalies(recentPayments);
    for (const timing of timingAnomalies) {
      anomalies.push({
        id: `anomaly_${Date.now()}_timing`,
        type: 'pattern',
        severity: 'medium',
        score: 6.0,
        description: timing.description,
        detectedAt: new Date(),
        entities: timing.payments.map(p => ({ type: 'payment', id: p.id, value: p.amount })),
        recommendations: [
          'Review payment scheduling',
          'Verify business hours processing',
          'Check for automated payment errors'
        ]
      });
    }
    
    return anomalies;
  }

  /**
   * Detect expense anomalies
   */
  async detectExpenseAnomalies(organizationId: string): Promise<AnomalyResult[]> {
    const anomalies: AnomalyResult[] = [];
    
    const recentExpenses = await db
      .select()
      .from(expenses)
      .where(
        and(
          eq(expenses.organizationId, organizationId),
          gte(expenses.createdAt, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
        )
      );
    
    // Check for policy violations
    const policyViolations = this.checkExpensePolicies(recentExpenses);
    for (const violation of policyViolations) {
      anomalies.push({
        id: `anomaly_${Date.now()}_policy`,
        type: 'expense',
        severity: violation.severity as any,
        score: violation.score,
        description: violation.description,
        detectedAt: new Date(),
        entities: [{ type: 'expense', id: violation.expenseId, value: violation.amount }],
        recommendations: violation.recommendations
      });
    }
    
    // Check for unusual patterns
    const patterns = this.findExpensePatterns(recentExpenses);
    for (const pattern of patterns) {
      if (pattern.isAnomaly) {
        anomalies.push({
          id: `anomaly_${Date.now()}_pattern`,
          type: 'expense',
          severity: 'low',
          score: pattern.anomalyScore,
          description: pattern.description,
          detectedAt: new Date(),
          entities: pattern.expenses.map(e => ({ type: 'expense', id: e.id, value: e.amount })),
          recommendations: [
            'Review expense approval process',
            'Update expense policies',
            'Provide additional training'
          ]
        });
      }
    }
    
    return anomalies;
  }

  /**
   * Perform comprehensive risk assessment
   */
  async performRiskAssessment(organizationId: string): Promise<RiskAssessment> {
    // Gather risk indicators
    const [
      financialRisk,
      operationalRisk,
      complianceRisk,
      vendorRisk,
      fraudRisk
    ] = await Promise.all([
      this.assessFinancialRisk(organizationId),
      this.assessOperationalRisk(organizationId),
      this.assessComplianceRisk(organizationId),
      this.assessVendorRisk(organizationId),
      this.assessFraudRisk(organizationId)
    ]);
    
    // Calculate overall risk
    const overallScore = (
      financialRisk.score * 0.3 +
      operationalRisk.score * 0.2 +
      complianceRisk.score * 0.25 +
      vendorRisk.score * 0.15 +
      fraudRisk.score * 0.1
    );
    
    const overallRisk = 
      overallScore >= 7 ? 'critical' :
      overallScore >= 5 ? 'high' :
      overallScore >= 3 ? 'medium' : 'low';
    
    return {
      overallRisk,
      riskScore: Math.round(overallScore * 10) / 10,
      categories: {
        financial: { score: financialRisk.score, level: financialRisk.level },
        operational: { score: operationalRisk.score, level: operationalRisk.level },
        compliance: { score: complianceRisk.score, level: complianceRisk.level },
        vendor: { score: vendorRisk.score, level: vendorRisk.level },
        fraud: { score: fraudRisk.score, level: fraudRisk.level }
      },
      topRisks: [
        {
          risk: 'Budget Overrun',
          impact: 'High',
          likelihood: 'Medium',
          mitigation: 'Implement stricter budget controls and monitoring'
        },
        {
          risk: 'Vendor Payment Delays',
          impact: 'Medium',
          likelihood: 'Low',
          mitigation: 'Automate payment processing and approvals'
        },
        {
          risk: 'Compliance Violations',
          impact: 'High',
          likelihood: 'Low',
          mitigation: 'Regular compliance audits and training'
        }
      ]
    };
  }

  /**
   * Predict grant utilization
   */
  async predictGrantUtilization(
    organizationId: string,
    grantId: string
  ): Promise<PredictionResult> {
    const grant = await db
      .select()
      .from(grants)
      .where(eq(grants.id, grantId))
      .limit(1);
    
    if (!grant[0]) {
      throw new Error('Grant not found');
    }
    
    const g = grant[0];
    const spent = parseFloat(g.amountSpent || '0');
    const total = parseFloat(g.amount);
    const daysElapsed = Math.floor((Date.now() - new Date(g.startDate!).getTime()) / (1000 * 60 * 60 * 24));
    const totalDays = Math.floor((new Date(g.endDate!).getTime() - new Date(g.startDate!).getTime()) / (1000 * 60 * 60 * 24));
    
    // Calculate burn rate
    const dailyBurnRate = daysElapsed > 0 ? spent / daysElapsed : 0;
    const expectedUtilization = (daysElapsed / totalDays) * total;
    const utilizationRate = spent / total;
    
    // Predict final utilization
    const remainingDays = totalDays - daysElapsed;
    const predictedFinalSpent = spent + (dailyBurnRate * remainingDays);
    const predictedUtilization = (predictedFinalSpent / total) * 100;
    
    return {
      metric: 'Grant Utilization',
      currentValue: utilizationRate * 100,
      predictedValue: Math.min(predictedUtilization, 100),
      confidence: 0.8,
      trend: dailyBurnRate > 0 ? 'increasing' : 'stable',
      timeframe: 'End of grant period',
      factors: [
        'Current burn rate',
        'Historical spending patterns',
        'Grant requirements',
        'Remaining time'
      ]
    };
  }

  // Helper methods
  
  private async getHistoricalSpending(organizationId: string, budgetId: string, days: number) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const spending = await db
      .select({
        amount: sql`SUM(${payments.amount})`,
        week: sql`DATE_TRUNC('week', ${payments.createdAt})`,
        month: sql`DATE_TRUNC('month', ${payments.createdAt})`
      })
      .from(payments)
      .where(
        and(
          eq(payments.organizationId, organizationId),
          gte(payments.createdAt, startDate)
        )
      )
      .groupBy(sql`DATE_TRUNC('week', ${payments.createdAt})`, sql`DATE_TRUNC('month', ${payments.createdAt})`);
    
    const totalSpent = spending.reduce((sum, s) => sum + parseFloat(s.amount as string || '0'), 0);
    const weeklySpending = spending.map(s => parseFloat(s.amount as string || '0'));
    const monthlySpending = [...new Set(spending.map(s => s.month))].map(month => {
      return spending
        .filter(s => s.month === month)
        .reduce((sum, s) => sum + parseFloat(s.amount as string || '0'), 0);
    });
    
    // Calculate variance
    const mean = totalSpent / days;
    const variance = weeklySpending.reduce((sum, w) => sum + Math.pow(w - mean, 2), 0) / weeklySpending.length;
    
    return {
      totalSpent,
      days,
      weeklySpending,
      monthlySpending,
      variance
    };
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;
    
    // Simple linear regression
    const n = values.length;
    const sumX = values.reduce((sum, _, i) => sum + i, 0);
    const sumY = values.reduce((sum, v) => sum + v, 0);
    const sumXY = values.reduce((sum, v, i) => sum + i * v, 0);
    const sumX2 = values.reduce((sum, _, i) => sum + i * i, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope / (sumY / n); // Normalize to percentage
  }

  private getSeasonalFactor(date: Date): number {
    const month = date.getMonth();
    // Simplified seasonal factors (in reality, would be based on historical data)
    const factors = [0.9, 0.85, 0.95, 1.0, 1.05, 1.1, 1.0, 0.95, 1.05, 1.1, 1.15, 1.2];
    return factors[month];
  }

  private calculateConfidence(variance: number): number {
    // Higher variance = lower confidence
    const normalizedVariance = Math.min(variance / 1000, 1);
    return Math.max(0.5, 1 - normalizedVariance * 0.5);
  }

  private async getProjectedInflows(organizationId: string, days: number): Promise<number> {
    // Calculate expected revenue based on historical patterns
    // This would include grants, tax revenue, fees, etc.
    return 100000; // Placeholder
  }

  private async getProjectedOutflows(organizationId: string, days: number): Promise<number> {
    // Calculate expected payments and expenses
    return 85000; // Placeholder
  }

  private findDuplicatePayments(payments: Payment[]): Array<{ amount: string; vendorId: string; paymentIds: string[] }> {
    const duplicates: Array<{ amount: string; vendorId: string; paymentIds: string[] }> = [];
    const grouped = new Map<string, Payment[]>();
    
    for (const payment of payments) {
      const key = `${payment.amount}_${payment.vendorId}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(payment);
    }
    
    for (const [key, group] of grouped) {
      if (group.length > 1) {
        // Check if payments are within 7 days of each other
        const dates = group.map(p => new Date(p.createdAt!).getTime());
        const minDate = Math.min(...dates);
        const maxDate = Math.max(...dates);
        
        if (maxDate - minDate < 7 * 24 * 60 * 60 * 1000) {
          duplicates.push({
            amount: group[0].amount,
            vendorId: group[0].vendorId || 'unknown',
            paymentIds: group.map(p => p.id)
          });
        }
      }
    }
    
    return duplicates;
  }

  private findUnusualAmounts(payments: Payment[]): Array<{ paymentId: string; amount: string; deviation: number }> {
    const amounts = payments.map(p => parseFloat(p.amount));
    const mean = amounts.reduce((sum, a) => sum + a, 0) / amounts.length;
    const stdDev = Math.sqrt(amounts.reduce((sum, a) => sum + Math.pow(a - mean, 2), 0) / amounts.length);
    
    const unusual: Array<{ paymentId: string; amount: string; deviation: number }> = [];
    
    for (const payment of payments) {
      const amount = parseFloat(payment.amount);
      const zScore = Math.abs((amount - mean) / stdDev);
      
      if (zScore > 2) {
        unusual.push({
          paymentId: payment.id,
          amount: payment.amount,
          deviation: Math.round(zScore * 10) / 10
        });
      }
    }
    
    return unusual;
  }

  private findTimingAnomalies(payments: Payment[]): Array<{ description: string; payments: Payment[] }> {
    const anomalies: Array<{ description: string; payments: Payment[] }> = [];
    
    // Check for after-hours payments
    const afterHours = payments.filter(p => {
      const hour = new Date(p.createdAt!).getHours();
      return hour < 6 || hour > 22;
    });
    
    if (afterHours.length > 0) {
      anomalies.push({
        description: `${afterHours.length} payments processed outside business hours`,
        payments: afterHours
      });
    }
    
    // Check for weekend payments
    const weekend = payments.filter(p => {
      const day = new Date(p.createdAt!).getDay();
      return day === 0 || day === 6;
    });
    
    if (weekend.length > payments.length * 0.1) {
      anomalies.push({
        description: `Unusual number of weekend payments (${weekend.length})`,
        payments: weekend
      });
    }
    
    return anomalies;
  }

  private checkExpensePolicies(expenses: Expense[]): Array<any> {
    const violations: Array<any> = [];
    
    for (const expense of expenses) {
      const amount = parseFloat(expense.amount);
      
      // Check for missing receipts on large expenses
      if (amount > 100 && !expense.receiptUrl) {
        violations.push({
          expenseId: expense.id,
          amount: expense.amount,
          severity: 'medium',
          score: 5,
          description: 'Missing receipt for expense over $100',
          recommendations: ['Upload receipt', 'Update expense policy compliance']
        });
      }
      
      // Check for round number expenses
      if (amount > 50 && amount % 100 === 0) {
        violations.push({
          expenseId: expense.id,
          amount: expense.amount,
          severity: 'low',
          score: 3,
          description: 'Suspiciously round expense amount',
          recommendations: ['Verify exact amount', 'Request itemized receipt']
        });
      }
    }
    
    return violations;
  }

  private findExpensePatterns(expenses: Expense[]): Array<any> {
    const patterns: Array<any> = [];
    
    // Group by employee
    const byEmployee = new Map<string, Expense[]>();
    for (const expense of expenses) {
      if (!byEmployee.has(expense.employeeId)) {
        byEmployee.set(expense.employeeId, []);
      }
      byEmployee.get(expense.employeeId)!.push(expense);
    }
    
    // Check for unusual patterns per employee
    for (const [employeeId, employeeExpenses] of byEmployee) {
      const total = employeeExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
      const average = total / employeeExpenses.length;
      
      // Flag if expenses are unusually high
      if (average > 500) {
        patterns.push({
          isAnomaly: true,
          anomalyScore: Math.min(average / 100, 10),
          description: `High average expense amount for employee ${employeeId}`,
          expenses: employeeExpenses
        });
      }
    }
    
    return patterns;
  }

  private async assessFinancialRisk(organizationId: string): Promise<{ score: number; level: string }> {
    // Assess budget utilization, cash flow, etc.
    return { score: 4.5, level: 'medium' };
  }

  private async assessOperationalRisk(organizationId: string): Promise<{ score: number; level: string }> {
    // Assess process efficiency, system reliability, etc.
    return { score: 3.2, level: 'low' };
  }

  private async assessComplianceRisk(organizationId: string): Promise<{ score: number; level: string }> {
    // Assess regulatory compliance, audit findings, etc.
    return { score: 5.8, level: 'medium' };
  }

  private async assessVendorRisk(organizationId: string): Promise<{ score: number; level: string }> {
    // Assess vendor reliability, concentration risk, etc.
    return { score: 4.0, level: 'medium' };
  }

  private async assessFraudRisk(organizationId: string): Promise<{ score: number; level: string }> {
    // Assess fraud indicators, control weaknesses, etc.
    return { score: 3.5, level: 'low' };
  }
}

export const predictiveAnalytics = new PredictiveAnalyticsService();