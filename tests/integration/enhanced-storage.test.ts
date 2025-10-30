import { describe, it, expect, vi, afterEach } from "vitest";
import type { Budget, Vendor, Payment, Expense, DigitalWallet } from "@shared/schema";

vi.mock("../../server/db", () => ({ db: {} }));

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

describe("EnhancedDatabaseStorage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("delegates budget retrieval to the base storage", async () => {
    const { enhancedStorage } = await import("../../server/enhanced-storage");
    const { DatabaseStorage } = await import("../../server/storage");

    const spy = vi
      .spyOn(DatabaseStorage.prototype, "getBudgets")
      .mockResolvedValue(sampleBudgets);

    const result = await enhancedStorage.getBudgets("org-1");
    expect(spy).toHaveBeenCalledWith("org-1");
    expect(result).toEqual(sampleBudgets);
  });

  it("delegates vendor retrieval to the base storage", async () => {
    const { enhancedStorage } = await import("../../server/enhanced-storage");
    const { DatabaseStorage } = await import("../../server/storage");

    const spy = vi
      .spyOn(DatabaseStorage.prototype, "getVendors")
      .mockResolvedValue(sampleVendors);

    const result = await enhancedStorage.getVendors("org-1");
    expect(spy).toHaveBeenCalledWith("org-1");
    expect(result).toEqual(sampleVendors);
  });

  it("delegates payment retrieval to the base storage", async () => {
    const { enhancedStorage } = await import("../../server/enhanced-storage");
    const { DatabaseStorage } = await import("../../server/storage");

    const spy = vi
      .spyOn(DatabaseStorage.prototype, "getPayments")
      .mockResolvedValue(samplePayments);

    const result = await enhancedStorage.getPayments("org-1");
    expect(spy).toHaveBeenCalledWith("org-1");
    expect(result).toEqual(samplePayments);
  });

  it("delegates expense retrieval to the base storage", async () => {
    const { enhancedStorage } = await import("../../server/enhanced-storage");
    const { DatabaseStorage } = await import("../../server/storage");

    const spy = vi
      .spyOn(DatabaseStorage.prototype, "getExpenses")
      .mockResolvedValue(sampleExpenses);

    const result = await enhancedStorage.getExpenses("org-1");
    expect(spy).toHaveBeenCalledWith("org-1");
    expect(result).toEqual(sampleExpenses);
  });

  it("delegates wallet retrieval to the base storage", async () => {
    const { enhancedStorage } = await import("../../server/enhanced-storage");
    const { DatabaseStorage } = await import("../../server/storage");

    const spy = vi
      .spyOn(DatabaseStorage.prototype, "getDigitalWallets")
      .mockResolvedValue(sampleWallets);

    const result = await enhancedStorage.getDigitalWallets("org-1");
    expect(spy).toHaveBeenCalledWith("org-1");
    expect(result).toEqual(sampleWallets);
  });
});
