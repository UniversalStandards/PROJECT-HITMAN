import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3 } from "lucide-react";
import { type Budget } from "@shared/schema";

export default function BudgetOverview() {
  const { data: budgets, isLoading } = useQuery<Budget[]>({
    queryKey: ["/api/budgets"],
    retry: false,
  });

  // Calculate totals from active budgets
  const activeBudgets = budgets?.filter(budget => budget.status === 'active') || [];
  const totalAllocated = activeBudgets.reduce((sum, budget) => sum + parseFloat(budget.totalAmount), 0);
  const totalSpent = activeBudgets.reduce((sum, budget) => sum + parseFloat(budget.spentAmount || "0"), 0);
  const totalRemaining = totalAllocated - totalSpent;

  return (
    <Card className="border border-border shadow-sm">
      <CardHeader className="pb-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground">Budget vs Actual Spending</CardTitle>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" className="text-sm text-muted-foreground hover:text-foreground">
              Monthly
            </Button>
            <Button size="sm" className="text-sm bg-primary text-primary-foreground">
              Quarterly
            </Button>
            <Button variant="ghost" size="sm" className="text-sm text-muted-foreground hover:text-foreground">
              Yearly
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Chart Placeholder */}
        <div className="h-64 bg-muted/30 rounded-md flex items-center justify-center mb-4">
          <div className="text-center">
            <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">Budget vs Actual Chart</p>
            <p className="text-sm text-muted-foreground">Chart visualization would be implemented here</p>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-muted-foreground">Budget Allocated</p>
            <p className="text-lg font-semibold text-chart-1">
              {isLoading ? "..." : `$${totalAllocated.toLocaleString()}`}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Actual Spent</p>
            <p className="text-lg font-semibold text-chart-3">
              {isLoading ? "..." : `$${totalSpent.toLocaleString()}`}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Remaining</p>
            <p className="text-lg font-semibold text-chart-2">
              {isLoading ? "..." : `$${totalRemaining.toLocaleString()}`}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
