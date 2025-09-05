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
import { insertPaymentSchema, type Payment, type Vendor } from "@shared/schema";
import { z } from "zod";
import { Plus, CreditCard, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";

const paymentFormSchema = insertPaymentSchema.extend({
  amount: z.string().min(1, "Amount is required").regex(/^\d+(\.\d{1,2})?$/, "Invalid amount format"),
  description: z.string().min(1, "Description is required"),
  type: z.enum(["vendor", "payroll", "expense", "tax", "transfer"]),
  vendorId: z.string().optional(),
  dueDate: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentFormSchema>;

export default function Payments() {
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

  const { data: payments, isLoading: paymentsLoading } = useQuery<Payment[]>({
    queryKey: ["/api/payments"],
    retry: false,
  });

  const { data: vendors } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
    retry: false,
  });

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      amount: "",
      description: "",
      type: "vendor",
      status: "pending",
    },
  });

  const createPaymentMutation = useMutation({
    mutationFn: async (data: PaymentFormData) => {
      const { amount, dueDate, ...rest } = data;
      const payload = {
        ...rest,
        amount: parseFloat(amount),
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      };
      const response = await apiRequest("POST", "/api/payments", payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      setDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Payment created successfully",
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
        description: "Failed to create payment",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PaymentFormData) => {
    createPaymentMutation.mutate(data);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "approved":
        return <CheckCircle className="h-4 w-4" />;
      case "processing":
        return <AlertCircle className="h-4 w-4" />;
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "failed":
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-blue-100 text-blue-800";
      case "processing":
        return "bg-purple-100 text-purple-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "failed":
      case "cancelled":
        return "bg-red-100 text-red-800";
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
              <h1 className="text-3xl font-bold text-foreground">Payments</h1>
              <p className="text-muted-foreground">Manage and track all payment transactions</p>
            </div>
            
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-payment">
                  <Plus className="h-4 w-4 mr-2" />
                  New Payment
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create New Payment</DialogTitle>
                  <DialogDescription>
                    Create a new payment transaction for processing.
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
                            <Input placeholder="0.00" {...field} data-testid="input-payment-amount" />
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
                            <Textarea placeholder="Payment description..." {...field} data-testid="input-payment-description" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-payment-type">
                                <SelectValue placeholder="Select payment type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="vendor">Vendor Payment</SelectItem>
                              <SelectItem value="payroll">Payroll</SelectItem>
                              <SelectItem value="expense">Expense Reimbursement</SelectItem>
                              <SelectItem value="tax">Tax Payment</SelectItem>
                              <SelectItem value="transfer">Transfer</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {form.watch("type") === "vendor" && (
                      <FormField
                        control={form.control}
                        name="vendorId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Vendor</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-vendor">
                                  <SelectValue placeholder="Select vendor" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {vendors?.map((vendor) => (
                                  <SelectItem key={vendor.id} value={vendor.id}>
                                    {vendor.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    
                    <FormField
                      control={form.control}
                      name="dueDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Due Date (Optional)</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} data-testid="input-payment-due-date" />
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
                        data-testid="button-cancel-payment"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createPaymentMutation.isPending}
                        data-testid="button-submit-payment"
                      >
                        {createPaymentMutation.isPending ? "Creating..." : "Create Payment"}
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
                <CreditCard className="h-5 w-5" />
                All Payments
              </CardTitle>
              <CardDescription>
                View and manage all payment transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {paymentsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              ) : payments?.length === 0 ? (
                <div className="text-center py-12">
                  <CreditCard className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No Payments Found</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first payment to get started.
                  </p>
                  <Button onClick={() => setDialogOpen(true)} data-testid="button-create-first-payment">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Payment
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Amount</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments?.map((payment) => (
                        <TableRow key={payment.id} data-testid={`row-payment-${payment.id}`}>
                          <TableCell className="font-medium">
                            ${parseFloat(payment.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell>{payment.description}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {payment.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(payment.status)}>
                              <div className="flex items-center gap-1">
                                {getStatusIcon(payment.status)}
                                {payment.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </div>
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {payment.dueDate ? new Date(payment.dueDate).toLocaleDateString() : "N/A"}
                          </TableCell>
                          <TableCell>
                            {new Date(payment.createdAt!).toLocaleDateString()}
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
