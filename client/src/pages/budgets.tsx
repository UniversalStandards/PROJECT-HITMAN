import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertBudgetSchema, type Budget } from "@shared/schema";
import { z } from "zod";
import { Plus, PieChart, TrendingUp, DollarSign } from "lucide-react";

const budgetFormSchema = insertBudgetSchema.extend({
  name: z.string().min(1, "Name is required"),
  totalAmount: z.string().min(1, "Total amount is required").regex(/^\d+(\.\d{1,2})?$/, "Invalid amount format"),
  fiscalYear: z.string().min(1, "Fiscal year is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
});

type BudgetFormData = z.infer<typeof budgetFormSchema>;

export default function Budgets() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);

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

  const { data: budgets, isLoading: budgetsLoading } = useQuery<Budget[]>({
    queryKey: ["/api/budgets"],
    retry: false,
  });

  const form = useForm<BudgetFormData>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: {
      name: "",
      description: "",
      totalAmount: "",
      fiscalYear: new Date().getFullYear().toString(),
      status: "draft",
      startDate: "",
      endDate: "",
    },
  });

  const createBudgetMutation = useMutation({
    mutationFn: async (data: BudgetFormData) => {
      const { totalAmount, fiscalYear, startDate, endDate, ...rest } = data;
      const payload = {
        ...rest,
        totalAmount: parseFloat(totalAmount),
        fiscalYear: parseInt(fiscalYear),
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
      };
      const response = await apiRequest("POST", "/api/budgets", payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
      setDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Budget created successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "Failed to create budget",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: BudgetFormData) => {
    createBudgetMutation.mutate(data);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "proposed":
        return "bg-blue-100 text-blue-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "active":
        return "bg-primary/10 text-primary";
      case "closed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const calculateProgress = (budget: Budget) => {
    const total = parseFloat(budget.totalAmount);
    const spent = parseFloat(budget.spentAmount || "0");
    return total > 0 ? (spent / total) * 100 : 0;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-muted/30">
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Budget Management</h1>
              <p className="text-muted-foreground">Create and monitor budgets across fiscal years</p>
            </div>
            
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-budget">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Budget
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create New Budget</DialogTitle>
                  <DialogDescription>
                    Create a new budget for your organization's fiscal planning.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Budget Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., FY 2024 Operating Budget" {...field} data-testid="input-budget-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Budget description..." {...field} data-testid="input-budget-description" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="totalAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total Amount</FormLabel>
                          <FormControl>
                            <Input placeholder="0.00" {...field} data-testid="input-budget-amount" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="fiscalYear"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fiscal Year</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} data-testid="input-budget-fiscal-year" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Start Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} data-testid="input-budget-start-date" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="endDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>End Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} data-testid="input-budget-end-date" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setDialogOpen(false)}
                        data-testid="button-cancel-budget"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createBudgetMutation.isPending}
                        data-testid="button-submit-budget"
                      >
                        {createBudgetMutation.isPending ? "Creating..." : "Create Budget"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {budgetsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : budgets?.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <PieChart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Budgets Created</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first budget to start managing your organization's finances.
                </p>
                <Button onClick={() => setDialogOpen(true)} data-testid="button-create-first-budget">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Budget
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {budgets?.map((budget) => (
                <Card key={budget.id} className="hover:shadow-lg transition-shadow" data-testid={`card-budget-${budget.id}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl">{budget.name}</CardTitle>
                        <CardDescription>FY {budget.fiscalYear}</CardDescription>
                      </div>
                      <Badge className={getStatusColor(budget.status)}>
                        {budget.status.replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                          <DollarSign className="h-4 w-4 text-primary" />
                        </div>
                        <p className="text-sm text-muted-foreground">Total Budget</p>
                        <p className="text-lg font-semibold text-foreground">
                          ${parseFloat(budget.totalAmount).toLocaleString()}
                        </p>
                      </div>
                      
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                          <TrendingUp className="h-4 w-4 text-orange-500" />
                        </div>
                        <p className="text-sm text-muted-foreground">Spent</p>
                        <p className="text-lg font-semibold text-foreground">
                          ${parseFloat(budget.spentAmount || "0").toLocaleString()}
                        </p>
                      </div>
                      
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                          <PieChart className="h-4 w-4 text-green-500" />
                        </div>
                        <p className="text-sm text-muted-foreground">Remaining</p>
                        <p className="text-lg font-semibold text-foreground">
                          ${(parseFloat(budget.totalAmount) - parseFloat(budget.spentAmount || "0")).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Budget Utilization</span>
                        <span className="font-medium">{calculateProgress(budget).toFixed(1)}%</span>
                      </div>
                      <Progress value={calculateProgress(budget)} className="h-2" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Start Date</p>
                        <p className="font-medium">{new Date(budget.startDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">End Date</p>
                        <p className="font-medium">{new Date(budget.endDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                    
                    {budget.description && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Description</p>
                        <p className="text-sm text-foreground">{budget.description}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
