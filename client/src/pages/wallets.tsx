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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertDigitalWalletSchema, type DigitalWallet } from "@shared/schema";
import { z } from "zod";
import { Plus, Wallet, DollarSign, CreditCard, PiggyBank, Building } from "lucide-react";

const walletFormSchema = insertDigitalWalletSchema.extend({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["checking", "savings", "payroll", "expense", "tax_collection"]),
});

type WalletFormData = z.infer<typeof walletFormSchema>;

export default function Wallets() {
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

  const { data: wallets, isLoading: walletsLoading } = useQuery<DigitalWallet[]>({
    queryKey: ["/api/wallets"],
    retry: false,
  });

  const form = useForm<WalletFormData>({
    resolver: zodResolver(walletFormSchema),
    defaultValues: {
      name: "",
      type: "checking",
      isActive: true,
    },
  });

  const createWalletMutation = useMutation({
    mutationFn: async (data: WalletFormData) => {
      const response = await apiRequest("POST", "/api/wallets", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
      setDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Digital wallet created successfully",
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
        description: "Failed to create digital wallet",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: WalletFormData) => {
    createWalletMutation.mutate(data);
  };

  const getWalletIcon = (type: string) => {
    switch (type) {
      case "checking":
        return <CreditCard className="h-6 w-6" />;
      case "savings":
        return <PiggyBank className="h-6 w-6" />;
      case "payroll":
        return <DollarSign className="h-6 w-6" />;
      case "expense":
        return <Wallet className="h-6 w-6" />;
      case "tax_collection":
        return <Building className="h-6 w-6" />;
      default:
        return <Wallet className="h-6 w-6" />;
    }
  };

  const getWalletTypeColor = (type: string) => {
    switch (type) {
      case "checking":
        return "bg-blue-100 text-blue-800";
      case "savings":
        return "bg-green-100 text-green-800";
      case "payroll":
        return "bg-purple-100 text-purple-800";
      case "expense":
        return "bg-orange-100 text-orange-800";
      case "tax_collection":
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
              <h1 className="text-3xl font-bold text-foreground">Digital Wallets</h1>
              <p className="text-muted-foreground">Manage your organization's digital accounts and balances</p>
            </div>
            
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-wallet">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Wallet
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create Digital Wallet</DialogTitle>
                  <DialogDescription>
                    Create a new digital wallet for your organization's financial operations.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Wallet Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Main Operating Account" {...field} data-testid="input-wallet-name" />
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
                          <FormLabel>Wallet Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-wallet-type">
                                <SelectValue placeholder="Select wallet type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="checking">Checking Account</SelectItem>
                              <SelectItem value="savings">Savings Account</SelectItem>
                              <SelectItem value="payroll">Payroll Account</SelectItem>
                              <SelectItem value="expense">Expense Account</SelectItem>
                              <SelectItem value="tax_collection">Tax Collection</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setDialogOpen(false)}
                        data-testid="button-cancel-wallet"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createWalletMutation.isPending}
                        data-testid="button-submit-wallet"
                      >
                        {createWalletMutation.isPending ? "Creating..." : "Create Wallet"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {walletsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : wallets?.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Wallet className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Digital Wallets</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first digital wallet to start managing your organization's finances.
                </p>
                <Button onClick={() => setDialogOpen(true)} data-testid="button-create-first-wallet">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Wallet
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {wallets?.map((wallet) => (
                <Card key={wallet.id} className="hover:shadow-lg transition-shadow" data-testid={`card-wallet-${wallet.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${getWalletTypeColor(wallet.type)}`}>
                          {getWalletIcon(wallet.type)}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{wallet.name}</CardTitle>
                          <Badge variant="secondary" className="mt-1">
                            {wallet.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </Badge>
                        </div>
                      </div>
                      <Badge variant={wallet.isActive ? "default" : "secondary"}>
                        {wallet.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Current Balance</p>
                        <p className="text-2xl font-bold text-foreground" data-testid={`text-balance-${wallet.id}`}>
                          ${parseFloat(wallet.balance || "0").toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      
                      {wallet.accountNumber && (
                        <div>
                          <p className="text-sm text-muted-foreground">Account Number</p>
                          <p className="text-sm font-mono text-foreground">
                            ****{wallet.accountNumber.slice(-4)}
                          </p>
                        </div>
                      )}
                      
                      <div>
                        <p className="text-sm text-muted-foreground">Created</p>
                        <p className="text-sm text-foreground">
                          {new Date(wallet.createdAt!).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
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
