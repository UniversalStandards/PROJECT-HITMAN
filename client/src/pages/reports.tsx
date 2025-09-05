import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { type Payment, type Vendor, type Budget, type Expense } from "@shared/schema";
import { BarChart3, FileText, Download, TrendingUp, DollarSign, Calendar } from "lucide-react";

export default function Reports() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/analytics/stats"],
    retry: false,
  });

  const { data: payments, isLoading: paymentsLoading } = useQuery<Payment[]>({
    queryKey: ["/api/payments"],
    retry: false,
  });

  const { data: vendors, isLoading: vendorsLoading } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
    retry: false,
  });

  const { data: budgets, isLoading: budgetsLoading } = useQuery<Budget[]>({
    queryKey: ["/api/budgets"],
    retry: false,
  });

  const { data: expenses, isLoading: expensesLoading } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const currentDate = new Date();
  const currentMonth = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Calculate monthly totals
  const monthlyPayments = payments?.filter(payment => {
    const paymentDate = new Date(payment.createdAt!);
    return paymentDate.getMonth() === currentDate.getMonth() && 
           paymentDate.getFullYear() === currentDate.getFullYear();
  }) || [];

  const monthlyExpenses = expenses?.filter(expense => {
    const expenseDate = new Date(expense.expenseDate);
    return expenseDate.getMonth() === currentDate.getMonth() && 
           expenseDate.getFullYear() === currentDate.getFullYear();
  }) || [];

  const monthlyPaymentTotal = monthlyPayments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
  const monthlyExpenseTotal = monthlyExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);

  // Budget utilization
  const activeBudgets = budgets?.filter(budget => budget.status === 'active') || [];
  const totalBudgetAmount = activeBudgets.reduce((sum, budget) => sum + parseFloat(budget.totalAmount), 0);
  const totalSpentAmount = activeBudgets.reduce((sum, budget) => sum + parseFloat(budget.spentAmount || "0"), 0);
  const budgetUtilization = totalBudgetAmount > 0 ? (totalSpentAmount / totalBudgetAmount) * 100 : 0;

  return (
    <div className="flex h-screen bg-muted/30">
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Financial Reports</h1>
              <p className="text-muted-foreground">Comprehensive financial analytics and reporting</p>
            </div>
            
            <Button variant="outline" data-testid="button-export-report">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Budget</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {statsLoading ? "..." : `$${parseFloat(stats?.totalBudget || "0").toLocaleString()}`}
                </div>
                <p className="text-sm text-muted-foreground">Current fiscal year</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Payments</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  ${monthlyPaymentTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-sm text-muted-foreground">{currentMonth}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Expenses</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  ${monthlyExpenseTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-sm text-muted-foreground">{currentMonth}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Budget Utilization</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {budgetUtilization.toFixed(1)}%
                </div>
                <p className="text-sm text-muted-foreground">Of total budget</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Recent Payments Report */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Recent Payments
                </CardTitle>
                <CardDescription>
                  Latest payment transactions for {currentMonth}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {paymentsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : monthlyPayments.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No payments this month</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {monthlyPayments.slice(0, 5).map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-foreground">{payment.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(payment.createdAt!).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-foreground">
                            ${parseFloat(payment.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </p>
                          <Badge variant="secondary">{payment.type}</Badge>
                        </div>
                      </div>
                    ))}
                    {monthlyPayments.length > 5 && (
                      <p className="text-sm text-muted-foreground text-center">
                        +{monthlyPayments.length - 5} more payments
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Budget Status Report */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Budget Status
                </CardTitle>
                <CardDescription>
                  Current budget allocation and utilization
                </CardDescription>
              </CardHeader>
              <CardContent>
                {budgetsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : activeBudgets.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No active budgets</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeBudgets.slice(0, 5).map((budget) => {
                      const utilization = parseFloat(budget.totalAmount) > 0 
                        ? (parseFloat(budget.spentAmount || "0") / parseFloat(budget.totalAmount)) * 100 
                        : 0;
                      return (
                        <div key={budget.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-foreground">{budget.name}</p>
                            <p className="text-sm font-semibold text-foreground">{utilization.toFixed(1)}%</p>
                          </div>
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>${parseFloat(budget.spentAmount || "0").toLocaleString()} spent</span>
                            <span>${parseFloat(budget.totalAmount).toLocaleString()} total</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all duration-300" 
                              style={{ width: `${Math.min(utilization, 100)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Vendor Spending Report */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Vendor Spending Analysis
              </CardTitle>
              <CardDescription>
                Top vendors by total spending
              </CardDescription>
            </CardHeader>
            <CardContent>
              {vendorsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              ) : vendors?.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No vendor data available</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vendor Name</TableHead>
                        <TableHead>Business Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Total Spend (YTD)</TableHead>
                        <TableHead className="text-right">Registered</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vendors
                        ?.sort((a, b) => parseFloat(b.totalSpend || "0") - parseFloat(a.totalSpend || "0"))
                        .slice(0, 10)
                        .map((vendor) => (
                          <TableRow key={vendor.id}>
                            <TableCell className="font-medium">{vendor.name}</TableCell>
                            <TableCell>
                              {vendor.businessType ? (
                                <Badge variant="secondary">{vendor.businessType}</Badge>
                              ) : (
                                <span className="text-muted-foreground">N/A</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge 
                                className={vendor.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                              >
                                {vendor.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              ${parseFloat(vendor.totalSpend || "0").toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">
                              {new Date(vendor.createdAt!).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
