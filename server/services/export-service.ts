import { db } from '../db';
import { 
  payments, vendors, expenses, budgets, transactions, grants, assets,
  type Payment, type Vendor, type Expense, type Budget
} from '@shared/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

// jsPDF types for PDF generation
interface JsPDFOptions {
  orientation?: 'portrait' | 'landscape';
  unit?: 'mm' | 'pt' | 'cm' | 'in';
  format?: string | number[];
}

// Excel types
interface ExcelWorkbook {
  SheetNames: string[];
  Sheets: Record<string, any>;
}

export interface ExportOptions {
  format: 'csv' | 'json' | 'pdf' | 'excel';
  entityType: 'payments' | 'vendors' | 'expenses' | 'budgets' | 'transactions' | 'grants' | 'assets';
  organizationId: string;
  filters?: {
    startDate?: Date;
    endDate?: Date;
    status?: string;
    type?: string;
    vendorId?: string;
    budgetId?: string;
  };
  columns?: string[];
}

export class ExportService {
  /**
   * Export data in various formats
   */
  async exportData(options: ExportOptions): Promise<{ data: string | Buffer; fileName: string; mimeType: string }> {
    const data = await this.fetchData(options);

    switch (options.format) {
      case 'csv':
        return this.exportToCSV(data, options);
      case 'json':
        return this.exportToJSON(data, options);
      case 'pdf':
        return this.exportToPDF(data, options);
      case 'excel':
        return this.exportToExcel(data, options);
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }

  /**
   * Fetch data based on entity type and filters
   */
  private async fetchData(options: ExportOptions): Promise<any[]> {
    const conditions: any[] = [eq(payments.organizationId, options.organizationId)];

    if (options.filters?.startDate) {
      conditions.push(gte(payments.createdAt, options.filters.startDate));
    }

    if (options.filters?.endDate) {
      conditions.push(lte(payments.createdAt, options.filters.endDate));
    }

    switch (options.entityType) {
      case 'payments':
        const paymentData = await db
          .select()
          .from(payments)
          .where(and(...conditions))
          .orderBy(desc(payments.createdAt));
        return paymentData;

      case 'vendors':
        const vendorData = await db
          .select()
          .from(vendors)
          .where(eq(vendors.organizationId, options.organizationId))
          .orderBy(desc(vendors.createdAt));
        return vendorData;

      case 'expenses':
        const expenseData = await db
          .select()
          .from(expenses)
          .where(eq(expenses.organizationId, options.organizationId))
          .orderBy(desc(expenses.createdAt));
        return expenseData;

      case 'budgets':
        const budgetData = await db
          .select()
          .from(budgets)
          .where(eq(budgets.organizationId, options.organizationId))
          .orderBy(desc(budgets.createdAt));
        return budgetData;

      case 'transactions':
        const transactionData = await db
          .select()
          .from(transactions)
          .where(eq(transactions.organizationId, options.organizationId))
          .orderBy(desc(transactions.createdAt));
        return transactionData;

      case 'grants':
        const grantData = await db
          .select()
          .from(grants)
          .where(eq(grants.organizationId, options.organizationId))
          .orderBy(desc(grants.createdAt));
        return grantData;

      case 'assets':
        const assetData = await db
          .select()
          .from(assets)
          .where(eq(assets.organizationId, options.organizationId))
          .orderBy(desc(assets.createdAt));
        return assetData;

      default:
        throw new Error(`Unsupported entity type: ${options.entityType}`);
    }
  }

  /**
   * Export to CSV format
   */
  private exportToCSV(data: any[], options: ExportOptions): { data: string; fileName: string; mimeType: string } {
    if (data.length === 0) {
      return {
        data: '',
        fileName: `${options.entityType}_export.csv`,
        mimeType: 'text/csv'
      };
    }

    // Get headers from first object or use specified columns
    const headers = options.columns || Object.keys(data[0]);
    
    // Create CSV content
    let csv = headers.join(',') + '\n';
    
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        // Escape values that contain commas or quotes
        if (value === null || value === undefined) return '';
        const stringValue = value.toString();
        if (stringValue.includes(',') || stringValue.includes('"')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      });
      csv += values.join(',') + '\n';
    }

    return {
      data: csv,
      fileName: `${options.entityType}_${new Date().toISOString().split('T')[0]}.csv`,
      mimeType: 'text/csv'
    };
  }

  /**
   * Export to JSON format
   */
  private exportToJSON(data: any[], options: ExportOptions): { data: string; fileName: string; mimeType: string } {
    const exportData = {
      metadata: {
        entityType: options.entityType,
        exportDate: new Date().toISOString(),
        recordCount: data.length,
        organizationId: options.organizationId
      },
      data: data
    };

    return {
      data: JSON.stringify(exportData, null, 2),
      fileName: `${options.entityType}_${new Date().toISOString().split('T')[0]}.json`,
      mimeType: 'application/json'
    };
  }

  /**
   * Export to PDF format
   */
  private exportToPDF(data: any[], options: ExportOptions): { data: Buffer; fileName: string; mimeType: string } {
    // Simple PDF generation without external dependencies
    // In production, you would use a library like jsPDF or pdfkit
    
    const title = `${options.entityType.toUpperCase()} REPORT`;
    const date = new Date().toLocaleDateString();
    const headers = options.columns || (data.length > 0 ? Object.keys(data[0]) : []);
    
    // Create a simple text-based PDF content
    let pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 <<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
>>
>>
>>
endobj

4 0 obj
<<
/Length 1000
>>
stream
BT
/F1 16 Tf
50 750 Td
(${title}) Tj
0 -20 Td
/F1 10 Tf
(Generated: ${date}) Tj
0 -20 Td
(Total Records: ${data.length}) Tj
0 -30 Td
`;

    // Add headers
    pdfContent += `(${headers.join(' | ')}) Tj
0 -15 Td
`;

    // Add data rows (limiting to first 20 for simplicity)
    const maxRows = Math.min(data.length, 20);
    for (let i = 0; i < maxRows; i++) {
      const row = data[i];
      const values = headers.map(h => (row[h] || '').toString().substring(0, 20));
      pdfContent += `(${values.join(' | ')}) Tj
0 -12 Td
`;
    }

    if (data.length > 20) {
      pdfContent += `(... and ${data.length - 20} more records) Tj
`;
    }

    pdfContent += `ET
endstream
endobj

xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000274 00000 n
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
1374
%%EOF`;

    return {
      data: Buffer.from(pdfContent),
      fileName: `${options.entityType}_${new Date().toISOString().split('T')[0]}.pdf`,
      mimeType: 'application/pdf'
    };
  }

  /**
   * Export to Excel format
   */
  private exportToExcel(data: any[], options: ExportOptions): { data: Buffer; fileName: string; mimeType: string } {
    // Simple Excel file generation using CSV format that Excel can open
    // In production, you would use a library like xlsx or exceljs
    
    const csvData = this.exportToCSV(data, options);
    
    // Convert CSV to a simple Excel-compatible format
    // This is a simplified version - real Excel files are much more complex
    const excelContent = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="${options.entityType}">
  <Table>`;

    const rows = csvData.data.split('\n');
    for (const row of rows) {
      if (row.trim()) {
        excelContent + `
   <Row>`;
        const cells = row.split(',');
        for (const cell of cells) {
          const cleanCell = cell.replace(/^"/, '').replace(/"$/, '').replace(/""/g, '"');
          excelContent + `
    <Cell><Data ss:Type="String">${cleanCell}</Data></Cell>`;
        }
        excelContent + `
   </Row>`;
      }
    }

    const finalExcelContent = excelContent + `
  </Table>
 </Worksheet>
</Workbook>`;

    return {
      data: Buffer.from(finalExcelContent),
      fileName: `${options.entityType}_${new Date().toISOString().split('T')[0]}.xlsx`,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };
  }

  /**
   * Generate financial report
   */
  async generateFinancialReport(
    organizationId: string,
    startDate: Date,
    endDate: Date,
    format: 'pdf' | 'excel'
  ): Promise<{ data: Buffer; fileName: string; mimeType: string }> {
    // Fetch all financial data
    const [paymentsData, expensesData, budgetsData] = await Promise.all([
      db.select().from(payments)
        .where(and(
          eq(payments.organizationId, organizationId),
          gte(payments.createdAt, startDate),
          lte(payments.createdAt, endDate)
        )),
      db.select().from(expenses)
        .where(and(
          eq(expenses.organizationId, organizationId),
          gte(expenses.createdAt, startDate),
          lte(expenses.createdAt, endDate)
        )),
      db.select().from(budgets)
        .where(eq(budgets.organizationId, organizationId))
    ]);

    // Calculate totals
    const totalPayments = paymentsData.reduce((sum, p) => sum + parseFloat(p.amount), 0);
    const totalExpenses = expensesData.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const totalBudget = budgetsData.reduce((sum, b) => sum + parseFloat(b.totalAmount), 0);

    const reportData = {
      summary: {
        period: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
        totalPayments,
        totalExpenses,
        totalBudget,
        budgetUtilization: totalBudget > 0 ? ((totalExpenses / totalBudget) * 100).toFixed(2) + '%' : 'N/A'
      },
      payments: paymentsData,
      expenses: expensesData,
      budgets: budgetsData
    };

    if (format === 'pdf') {
      return this.exportToPDF([reportData], { 
        entityType: 'budgets', 
        format: 'pdf', 
        organizationId 
      });
    } else {
      return this.exportToExcel([reportData], { 
        entityType: 'budgets', 
        format: 'excel', 
        organizationId 
      });
    }
  }

  /**
   * Export audit log
   */
  async exportAuditLog(
    organizationId: string,
    startDate?: Date,
    endDate?: Date,
    format: 'csv' | 'pdf' = 'csv'
  ): Promise<{ data: string | Buffer; fileName: string; mimeType: string }> {
    const conditions: any[] = [];
    
    if (startDate) {
      conditions.push(gte(auditLogs.createdAt, startDate));
    }
    
    if (endDate) {
      conditions.push(lte(auditLogs.createdAt, endDate));
    }

    const logs = await db
      .select()
      .from(auditLogs)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(auditLogs.createdAt));

    if (format === 'csv') {
      return this.exportToCSV(logs, { 
        entityType: 'transactions', 
        format: 'csv', 
        organizationId 
      });
    } else {
      return this.exportToPDF(logs, { 
        entityType: 'transactions', 
        format: 'pdf', 
        organizationId 
      });
    }
  }
}

export const exportService = new ExportService();