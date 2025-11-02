import express from "express";
import request from "supertest";
import { beforeAll, afterAll, describe, expect, vi } from "vitest";
import type { Server } from "http";
import type {
  Budget,
  Vendor,
  Payment,
  Expense,
  DigitalWallet,
} from "@shared/schema";

vi.mock("../../server/db", () => ({ db: {} }));

const sampleUser = { id: "user-1", organizationId: "org-1" };
const sampleBudgets: Budget[] = [
  {
    id: "budget-1",
    name: "Operating Budget",
    description: "Annual operations",
    organizationId: "org-1",
    fiscalYear: 2025,
    totalAmount: "100000",
    allocatedAmount: "80000",
    spentAmount: "25000",
    status: "active",
    startDate: new Date().toISOString(),
    endDate: new Date().toISOString(),
    createdBy: "user-1",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const sampleVendors: Vendor[] = [
  {
    id: "vendor-1",
    name: "Acme Construction",
    email: "info@acme.test",
    phone: "555-1234",
    address: "123 Main",
    taxId: "99-9999999",
    businessType: "construction",
    status: "active",
    organizationId: "org-1",
    totalSpend: "40000",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const samplePayments: Payment[] = [
  {
    id: "payment-1",
    amount: "15000",
    description: "Technology Services",
    type: "vendor",
    status: "pending",
    vendorId: "vendor-1",
    budgetCategoryId: null,
    organizationId: "org-1",
    dueDate: new Date().toISOString(),
    processedDate: null,
    createdBy: "user-1",
    approvedBy: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "payment-2",
    amount: "5000",
    description: "Maintenance",
    type: "vendor",
    status: "completed",
    vendorId: "vendor-1",
    budgetCategoryId: null,
    organizationId: "org-1",
    dueDate: new Date().toISOString(),
    processedDate: new Date().toISOString(),
    createdBy: "user-1",
    approvedBy: "user-1",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const sampleExpenses: Expense[] = [
  {
    id: "expense-1",
    amount: "5000",
    description: "Software Licenses",
    status: "approved",
    category: "Technology",
    receiptUrl: null,
    expenseDate: new Date().toISOString(),
    submittedBy: "user-1",
    approvedBy: null,
    budgetCategoryId: null,
    organizationId: "org-1",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const sampleWallets: DigitalWallet[] = [
  {
    id: "wallet-1",
    name: "General Fund",
    type: "treasury",
    balance: "500000",
    accountNumber: null,
    routingNumber: null,
    isActive: true,
    organizationId: "org-1",
    externalAccountId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const sampleStats = {
  totalBudget: "150000",
  monthlyExpenses: "5000",
  activeVendors: 1,
  pendingPayments: 1,
};

const sampleActivity = [
  { id: "act-1", type: "payment", description: "Technology Services", amount: "15000", createdAt: new Date().toISOString() },
  { id: "act-2", type: "expense", description: "Software Licenses", amount: "5000", createdAt: new Date().toISOString() },
  { id: "act-3", type: "vendor", description: "Acme Construction", amount: null, createdAt: new Date().toISOString() },
];

vi.mock("../../server/replitAuth", () => ({
  setupAuth: vi.fn().mockResolvedValue(undefined),
  isAuthenticated: (req: any, _res: any, next: any) => {
    req.user = { claims: { sub: sampleUser.id } };
    next();
  },
}));

vi.mock("../../server/websocket", () => ({
  wsManager: { initialize: vi.fn() },
}));

vi.mock("../../server/enhanced-storage", () => ({
  enhancedStorage: {
    getUser: vi.fn(async () => sampleUser),
    getBudgets: vi.fn(async () => sampleBudgets),
    getVendors: vi.fn(async () => sampleVendors),
    getPayments: vi.fn(async () => samplePayments),
    getPendingPayments: vi.fn(async () => samplePayments.filter((p) => p.status === "pending")),
    getExpenses: vi.fn(async () => sampleExpenses),
    getDigitalWallets: vi.fn(async () => sampleWallets),
    getOrganizationStats: vi.fn(async () => sampleStats),
    getTopVendors: vi.fn(async () => sampleVendors),
    getRecentActivity: vi.fn(async () => sampleActivity),
  },
}));

let server: Server;

beforeAll(async () => {
  const { registerRoutes } = await import("../../server/routes");
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  server = await registerRoutes(app);
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

describe("API integration using enhanced storage", () => {
  it("returns budget data", async () => {
    const response = await request(server).get("/api/budgets");
    expect(response.status).toBe(200);
    expect(response.body).toEqual(sampleBudgets);
  });

  it("returns vendor data", async () => {
    const response = await request(server).get("/api/vendors");
    expect(response.status).toBe(200);
    expect(response.body).toEqual(sampleVendors);
  });

  it("returns payments and pending payments", async () => {
    const paymentsResponse = await request(server).get("/api/payments");
    expect(paymentsResponse.status).toBe(200);
    expect(paymentsResponse.body).toEqual(samplePayments);

    const pendingResponse = await request(server).get("/api/payments/pending");
    expect(pendingResponse.status).toBe(200);
    expect(pendingResponse.body).toHaveLength(1);
    expect(pendingResponse.body[0].status).toBe("pending");
  });

  it("returns expense data", async () => {
    const response = await request(server).get("/api/expenses");
    expect(response.status).toBe(200);
    expect(response.body).toEqual(sampleExpenses);
  });

  it("returns wallet data", async () => {
    const response = await request(server).get("/api/wallets");
    expect(response.status).toBe(200);
    expect(response.body).toEqual(sampleWallets);
  });

  it("returns analytics data", async () => {
    const statsResponse = await request(server).get("/api/analytics/stats");
    expect(statsResponse.status).toBe(200);
    expect(statsResponse.body).toEqual(sampleStats);

    const topVendorsResponse = await request(server).get("/api/analytics/top-vendors");
    expect(topVendorsResponse.status).toBe(200);
    expect(topVendorsResponse.body).toEqual(sampleVendors);

    const recentActivityResponse = await request(server).get("/api/analytics/recent-activity");
    expect(recentActivityResponse.status).toBe(200);
    expect(recentActivityResponse.body).toEqual(sampleActivity);
  });
});
