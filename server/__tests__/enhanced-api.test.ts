import request from "supertest";
import { describe, beforeAll, afterAll, it, expect, vi } from "vitest";
import type { Server } from "http";
import type { EnhancedDatabaseStorage } from "../enhanced-storage";
import type { DatabaseStorage } from "../storage";

vi.mock("../db", () => {
  const tableData = new Map<any, any[]>();

  const createSelectBuilder = () => {
    let currentTable: any;
    const builder: Record<string, any> = {
      from(table: any) {
        currentTable = table;
        return builder;
      },
      where: () => builder,
      orderBy: () => builder,
      leftJoin: () => builder,
      innerJoin: () => builder,
      groupBy: () => builder,
      having: () => builder,
      limit: () => builder,
      offset: () => builder,
      returning: () => Promise.resolve([]),
      execute: () => Promise.resolve([]),
      then(onFulfilled: any, onRejected: any) {
        const rows = tableData.get(currentTable) ?? [];
        return Promise.resolve(rows).then(onFulfilled, onRejected);
      },
    };

    return builder;
  };

  const createMutationBuilder = () => {
    const builder: Record<string, any> = {
      values: () => builder,
      set: () => builder,
      onConflictDoUpdate: () => builder,
      where: () => builder,
      returning: () => Promise.resolve([]),
      then(onFulfilled: any, onRejected: any) {
        return Promise.resolve([]).then(onFulfilled, onRejected);
      },
    };

    return builder;
  };

  const db = {
    select: () => createSelectBuilder(),
    insert: () => createMutationBuilder(),
    update: () => createMutationBuilder(),
    delete: () => createMutationBuilder(),
  };

  return {
    db,
    pool: { end: vi.fn() },
    __setTableData: (table: any, rows: any[]) => {
      tableData.set(table, rows);
    },
  };
});

vi.mock("../replitAuth", () => ({
  setupAuth: vi.fn().mockResolvedValue(undefined),
  isAuthenticated: (req: any, _res: any, next: any) => {
    req.user = { claims: { sub: "user-1" } };
    next();
  },
}));

vi.mock("../enhanced-routes", () => ({
  registerEnhancedRoutes: vi.fn(),
}));

vi.mock("../websocket", () => ({
  wsManager: {
    initialize: vi.fn(),
    close: vi.fn(),
  },
}));

describe("Enhanced storage integration", () => {
  process.env.DATABASE_URL = process.env.DATABASE_URL ?? "postgres://local/test";

  let enhancedStorage: EnhancedDatabaseStorage;
  let EnhancedDatabaseStorageClass: typeof import("../enhanced-storage").EnhancedDatabaseStorage;
  let DatabaseStorageClass: typeof DatabaseStorage;
  let server: Server;

  const user = {
    id: "user-1",
    organizationId: "org-1",
    role: "admin",
  };

  const serialize = <T>(value: T) => JSON.parse(JSON.stringify(value));

  const budgets = [
    {
      id: "budget-1",
      name: "General Fund",
      description: "Primary operating budget",
      organizationId: "org-1",
      fiscalYear: 2024,
      totalAmount: "1000000.00",
      allocatedAmount: "750000.00",
      spentAmount: "250000.00",
      status: "active",
      startDate: new Date("2024-01-01T00:00:00Z"),
      endDate: new Date("2024-12-31T23:59:59Z"),
      createdBy: "user-1",
    },
  ];

  const vendors = [
    {
      id: "vendor-1",
      name: "Acme Services",
      businessType: "Consulting",
      status: "active",
      organizationId: "org-1",
      totalSpend: "20000.00",
    },
  ];

  const payments = [
    {
      id: "payment-1",
      amount: "5000.00",
      description: "Quarterly retainer",
      type: "vendor",
      status: "pending",
      organizationId: "org-1",
      vendorId: "vendor-1",
      createdBy: "user-1",
      dueDate: new Date("2024-04-01T10:00:00Z"),
    },
  ];

  const expenses = [
    {
      id: "expense-1",
      amount: "1200.00",
      description: "Software licenses",
      status: "submitted",
      category: "IT",
      expenseDate: new Date("2024-03-10T08:30:00Z"),
      submittedBy: "user-1",
      organizationId: "org-1",
    },
  ];

  const wallets = [
    {
      id: "wallet-1",
      name: "Operational Treasury",
      type: "treasury",
      balance: "150000.00",
      organizationId: "org-1",
    },
  ];

  const stats = {
    totalBudget: "1000000.00",
    monthlyExpenses: "250000.00",
    activeVendors: 1,
    pendingPayments: 1,
  };

  const topVendorStats = vendors;
  const recentActivity = [
    {
      id: "activity-1",
      type: "payment",
      description: "Payment processed: Quarterly retainer",
      amount: "5000.00",
      createdAt: new Date("2024-04-01T10:00:00Z").toISOString(),
    },
  ];

  beforeAll(async () => {
    ({ enhancedStorage, EnhancedDatabaseStorage: EnhancedDatabaseStorageClass } = await import("../enhanced-storage"));
    ({ DatabaseStorage: DatabaseStorageClass } = await import("../storage"));

    const dbModule: any = await import("../db");
    const schemaModule: any = await import("@shared/schema");
    dbModule.__setTableData(schemaModule.users, [user]);
    dbModule.__setTableData(schemaModule.budgets, budgets);
    dbModule.__setTableData(schemaModule.vendors, vendors);
    dbModule.__setTableData(schemaModule.payments, payments);
    dbModule.__setTableData(schemaModule.expenses, expenses);
    dbModule.__setTableData(schemaModule.digitalWallets, wallets);
    (enhancedStorage as any).getOrganizationStats = async () => stats;
    (enhancedStorage as any).getTopVendors = async () => topVendorStats;
    (enhancedStorage as any).getRecentActivity = async () => recentActivity;

    // Import and use the real production routes instead of duplicating them
    const { registerRoutes } = await import("../routes");
    const express = (await import("express")).default;
    const app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    server = await registerRoutes(app);
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    vi.restoreAllMocks();
  });

  it("reuses base storage CRUD implementations", () => {
    expect(enhancedStorage).toBeInstanceOf(EnhancedDatabaseStorageClass);
    expect(enhancedStorage).toBeInstanceOf(DatabaseStorageClass);
    expect(enhancedStorage.getBudgets).toBe(DatabaseStorageClass.prototype.getBudgets);
    expect(enhancedStorage.getVendors).toBe(DatabaseStorageClass.prototype.getVendors);
    expect(enhancedStorage.getPayments).toBe(DatabaseStorageClass.prototype.getPayments);
    expect(enhancedStorage.getExpenses).toBe(DatabaseStorageClass.prototype.getExpenses);
    expect(enhancedStorage.getDigitalWallets).toBe(DatabaseStorageClass.prototype.getDigitalWallets);
  });

  it("serves budgets with persisted data", async () => {
    const response = await request(server).get("/api/budgets");
    expect(response.status).toBe(200);
    expect(response.body).toEqual(serialize(budgets));
  });

  it("serves vendors with persisted data", async () => {
    const response = await request(server).get("/api/vendors");
    expect(response.status).toBe(200);
    expect(response.body).toEqual(vendors);
  });

  it("serves payments with persisted data", async () => {
    const response = await request(server).get("/api/payments");
    expect(response.status).toBe(200);
    expect(response.body).toEqual(serialize(payments));
  });

  it("serves expenses with persisted data", async () => {
    const response = await request(server).get("/api/expenses");
    expect(response.status).toBe(200);
    expect(response.body).toEqual(serialize(expenses));
  });

  it("serves digital wallets with persisted data", async () => {
    const response = await request(server).get("/api/wallets");
    expect(response.status).toBe(200);
    expect(response.body).toEqual(serialize(wallets));
  });

  it("provides analytics stats", async () => {
    const response = await request(server).get("/api/analytics/stats");
    expect(response.status).toBe(200);
    expect(response.body).toEqual(stats);
  });

  it("provides top vendor analytics", async () => {
    const response = await request(server).get("/api/analytics/top-vendors");
    expect(response.status).toBe(200);
    expect(response.body).toEqual(topVendorStats);
  });

  it("provides recent activity analytics", async () => {
    const response = await request(server).get("/api/analytics/recent-activity");
    expect(response.status).toBe(200);
    expect(response.body).toEqual(recentActivity);
  });
});
