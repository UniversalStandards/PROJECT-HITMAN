import React from "react";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Budgets from "../budgets";
import Vendors from "../vendors";
import Payments from "../payments";
import Expenses from "../expenses";
import Wallets from "../wallets";
import StatsCards from "@/components/dashboard/stats-cards";
import TopVendors from "@/components/dashboard/top-vendors";
import RecentActivity from "@/components/dashboard/recent-activity";
import { getQueryFn } from "@/lib/queryClient";

(globalThis as unknown as { React: typeof React }).React = React;

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ isAuthenticated: true, isLoading: false }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("@/components/layout/sidebar", () => ({
  default: () => <div data-testid="sidebar" />,
}));

vi.mock("@/components/layout/header", () => ({
  default: () => <div data-testid="header" />,
}));

type ApiResponses = Record<string, unknown>;

function renderWithQuery(ui: React.ReactElement, responses: ApiResponses) {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        queryFn: getQueryFn({ on401: "throw" }),
        retry: false,
      },
    },
  });

  global.fetch = vi.fn(async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input.toString();
    const matched = Object.entries(responses).find(([key]) => url.includes(key));
    const body = matched ? matched[1] : [];

    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }) as unknown as typeof fetch;

  const rendered = render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
  );

  return { ...rendered, client };
}

describe("data driven pages", () => {
  it("renders persisted budget data", async () => {
    const budgets = [
      {
        id: "budget-1",
        name: "General Fund",
        description: "Primary operations",
        organizationId: "org-1",
        fiscalYear: 2024,
        totalAmount: "100000.00",
        allocatedAmount: "60000.00",
        spentAmount: "25000.00",
        status: "active",
        startDate: new Date("2024-01-01T00:00:00Z").toISOString(),
        endDate: new Date("2024-12-31T23:59:59Z").toISOString(),
        createdBy: "user-1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const { client } = renderWithQuery(<Budgets />, {
      "/api/budgets": budgets,
    });

    expect(await screen.findByText("General Fund")).toBeInTheDocument();
    client.clear();
  });

  it("renders persisted vendor data", async () => {
    const vendors = [
      {
        id: "vendor-1",
        name: "Acme Services",
        email: "contact@acme.test",
        phone: "555-0100",
        address: "123 Main St",
        taxId: "123456789",
        businessType: "Consulting",
        status: "active",
        organizationId: "org-1",
        totalSpend: "20000.00",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const { client } = renderWithQuery(<Vendors />, {
      "/api/vendors": vendors,
    });

    expect(await screen.findByText("Acme Services")).toBeInTheDocument();
    client.clear();
  });

  it("renders persisted payment data", async () => {
    const payments = [
      {
        id: "payment-1",
        amount: "5000.00",
        description: "Quarterly retainer",
        type: "vendor",
        status: "pending",
        vendorId: "vendor-1",
        organizationId: "org-1",
        dueDate: new Date().toISOString(),
        createdBy: "user-1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const vendors = [
      {
        id: "vendor-1",
        name: "Acme Services",
        email: "contact@acme.test",
        phone: "555-0100",
        address: "123 Main St",
        taxId: "123456789",
        businessType: "Consulting",
        status: "active",
        organizationId: "org-1",
        totalSpend: "20000.00",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const { client } = renderWithQuery(<Payments />, {
      "/api/payments": payments,
      "/api/vendors": vendors,
    });

    expect(await screen.findByText("Quarterly retainer")).toBeInTheDocument();
    client.clear();
  });

  it("renders persisted expense data", async () => {
    const expenses = [
      {
        id: "expense-1",
        amount: "1200.00",
        description: "Software licenses",
        status: "submitted",
        category: "IT",
        expenseDate: new Date().toISOString(),
        submittedBy: "user-1",
        organizationId: "org-1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const { client } = renderWithQuery(<Expenses />, {
      "/api/expenses": expenses,
    });

    expect(await screen.findByText("Software licenses")).toBeInTheDocument();
    client.clear();
  });

  it("renders persisted wallet data", async () => {
    const wallets = [
      {
        id: "wallet-1",
        name: "Operational Treasury",
        type: "treasury",
        balance: "150000.00",
        accountNumber: "1234567890",
        routingNumber: "021000021",
        isActive: true,
        organizationId: "org-1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const { client } = renderWithQuery(<Wallets />, {
      "/api/wallets": wallets,
    });

    expect(await screen.findByText("Operational Treasury")).toBeInTheDocument();
    client.clear();
  });
});

describe("dashboard analytics components", () => {
  it("renders analytics stats", async () => {
    const stats = {
      totalBudget: "1000000.00",
      monthlyExpenses: "250000.00",
      activeVendors: 4,
      pendingPayments: 2,
    };

    const { client } = renderWithQuery(<StatsCards />, {
      "/api/analytics/stats": stats,
    });

    expect(await screen.findByText("$1,000,000")).toBeInTheDocument();
    client.clear();
  });

  it("renders top vendor analytics", async () => {
    const vendors = [
      {
        id: "vendor-1",
        name: "Acme Services",
        businessType: "Consulting",
        totalSpend: "20000.00",
        organizationId: "org-1",
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const { client } = renderWithQuery(<TopVendors />, {
      "/api/analytics/top-vendors": vendors,
    });

    expect(await screen.findByText("Acme Services")).toBeInTheDocument();
    client.clear();
  });

  it("renders recent activity feed", async () => {
    const activity = [
      {
        id: "activity-1",
        type: "payment",
        description: "Payment processed: Quarterly retainer",
        amount: "5000.00",
        createdAt: new Date().toISOString(),
      },
    ];

    const { client } = renderWithQuery(<RecentActivity />, {
      "/api/analytics/recent-activity": activity,
    });

    expect(
      await screen.findByText(/Quarterly retainer/i),
    ).toBeInTheDocument();
    client.clear();
  });
});
