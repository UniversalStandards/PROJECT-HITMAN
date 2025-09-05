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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertExpenseSchema, type Expense } from "@shared/schema";
import { z } from "zod";
import { Plus, Receipt, FileText, Clock, CheckCircle, XCircle } from "lucide-react";

const expenseFormSchema = insertExpenseSchema.extend({
  amount: z.string().min(1, "Amount is required").regex(/^\d+(\.\d{1,2})?$/, "Invalid amount format"),
  description: z.string().min(1, "Description is required"),
  category: z.string().min(1, "Category is required"),
  expenseDate: z.string().min(1, "Expense date is required"),
});

type ExpenseFormData = z.infer<typeof expenseFormSchema>;

const expenseCategories = [
  "Travel",
  "Meals",
  "Office Supplies",
  "Equipment",
  "Software",
  "Training",
  "Marketing",
  "Utilities",
  "Other"
];

export default function Expenses() {
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

  const { data: expenses, isLoading: expensesLoading } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
    retry: false,
  });

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      amount: "",
      description: "",
      category: "",
      status: "draft",
      expenseDate: new Date().toISOString().split('T')[0],
    },
  });

  const createExpenseMutation = useMutation({
    mutationFn: async (data: ExpenseFormData) => {
      const { amount, expenseDate, ...rest } = data;
      const payload = {
        ...rest,
        amount: parseFloat(amount),
        expenseDate: new Date(expenseDate).toISOString(),
      };
      const response = await apiRequest("POST", "/api/expenses", payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      setDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Expense created successfully",
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
        description: "Failed to create expense",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ExpenseFormData) => {
    createExpenseMutation.mutate(data);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "draft":
        return <FileText className="h-4 w-4" />;
      case "submitted":
        return <Clock className="h-4 w-4" />;
      case "approved":
        return <CheckCircle className="h-4 w-4" />;
      case "rejected":
        return <XCircle className="h-4 w-4" />;
      case "reimbursed":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "submitted":
        return "bg-blue-100 text-blue-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "reimbursed":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
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
              <h1 className="text-3xl font-bold text-foreground">Expense Management</h1>
              <p className="text-muted-foreground">Submit and track expense reimbursements</p>
            </div>
            
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-expense">
                  <Plus className="h-4 w-4 mr-2" />
                  New Expense
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create New Expense</DialogTitle>
                  <DialogDescription>
                    Submit a new expense for reimbursement approval.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount</FormLabel>
                          <FormControl>
                            <Input placeholder="0.00" {...field} data-testid="input-expense-amount" />
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
                            <Textarea placeholder="Describe the expense..." {...field} data-testid="input-expense-description" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-expense-category">
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {expenseCategories.map((category) => (
                                <SelectItem key={category} value={category}>
                                  {category}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="expenseDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expense Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} data-testid="input-expense-date" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setDialogOpen(false)}
                        data-testid="button-cancel-expense"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createExpenseMutation.isPending}
                        data-testid="button-submit-expense"
                      >
                        {createExpenseMutation.isPending ? "Creating..." : "Create Expense"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                All Expenses
              </CardTitle>
              <CardDescription>
                View and manage all expense submissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {expensesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              ) : expenses?.length === 0 ? (
                <div className="text-center py-12">
                  <Receipt className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No Expenses Found</h3>
                  <p className="text-muted-foreground mb-4">
                    Submit your first expense to get started.
                  </p>
                  <Button onClick={() => setDialogOpen(true)} data-testid="button-create-first-expense">
                    <Plus className="h-4 w-4 mr-2" />
                    Submit Your First Expense
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Amount</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Expense Date</TableHead>
                        <TableHead>Submitted</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expenses?.map((expense) => (
                        <TableRow key={expense.id} data-testid={`row-expense-${expense.id}`}>
                          <TableCell className="font-medium">
                            ${parseFloat(expense.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell>{expense.description}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {expense.category}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(expense.status)}>
                              <div className="flex items-center gap-1">
                                {getStatusIcon(expense.status)}
                                {expense.status.replace(/\b\w/g, l => l.toUpperCase())}
                              </div>
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(expense.expenseDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {new Date(expense.createdAt!).toLocaleDateString()}
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
