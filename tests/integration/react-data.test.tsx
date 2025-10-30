import "@testing-library/jest-dom/vitest";
import { afterEach, beforeAll, afterAll, describe, expect, it } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Budget, Payment } from "@shared/schema";
import React, { type ReactElement } from "react";
import BudgetOverview from "@/components/dashboard/budget-overview";
import PendingPayments from "@/components/dashboard/pending-payments";

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

let originalFetch: typeof fetch;

beforeAll(() => {
  originalFetch = global.fetch;
  (globalThis as any).React = React;
  global.fetch = async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    if (url.includes("/api/budgets")) {
      return new Response(JSON.stringify(sampleBudgets), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (url.includes("/api/payments/pending")) {
      return new Response(JSON.stringify(samplePayments), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (url.includes("/api/payments")) {
      return new Response(JSON.stringify(samplePayments), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response("Not Found", { status: 404 });
  };
});

afterAll(() => {
  delete (globalThis as any).React;
  global.fetch = originalFetch;
});

afterEach(() => {
  cleanup();
});

function renderWithClient(element: ReactElement) {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        queryFn: async ({ queryKey }) => {
          const url = queryKey[0] as string;
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`Request failed: ${response.status}`);
          }
          return await response.json();
        },
      },
    },
  });

  return render(<QueryClientProvider client={client}>{element}</QueryClientProvider>);
}

describe("React data components", () => {
  it("renders budget overview using fetched data", async () => {
    renderWithClient(<BudgetOverview />);
    expect(await screen.findByText("Budget vs Actual Spending")).toBeInTheDocument();
    expect(await screen.findByText("$100,000")).toBeInTheDocument();
    expect(await screen.findByText("$25,000")).toBeInTheDocument();
    expect(await screen.findByText("$75,000")).toBeInTheDocument();
  });

  it("renders pending payments table using fetched data", async () => {
    renderWithClient(<PendingPayments />);
    expect(await screen.findByText("Pending Payments")).toBeInTheDocument();
    expect(await screen.findByText("Technology Services")).toBeInTheDocument();
    expect(await screen.findByText("$15,000.00")).toBeInTheDocument();
    expect(await screen.findByText("Pending")).toBeInTheDocument();
  });
});
