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
import { insertVendorSchema, type Vendor } from "@shared/schema";
import { z } from "zod";
import { Plus, Building, CheckCircle, Clock, XCircle, AlertTriangle } from "lucide-react";

const vendorFormSchema = insertVendorSchema.extend({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  taxId: z.string().optional(),
  businessType: z.string().optional(),
});

type VendorFormData = z.infer<typeof vendorFormSchema>;

export default function Vendors() {
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

  const { data: vendors, isLoading: vendorsLoading } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
    retry: false,
  });

  const form = useForm<VendorFormData>({
    resolver: zodResolver(vendorFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      taxId: "",
      businessType: "",
      status: "pending_approval",
    },
  });

  const createVendorMutation = useMutation({
    mutationFn: async (data: VendorFormData) => {
      const response = await apiRequest("POST", "/api/vendors", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });
      setDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Vendor created successfully",
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
        description: "Failed to create vendor",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: VendorFormData) => {
    createVendorMutation.mutate(data);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4" />;
      case "inactive":
        return <Clock className="h-4 w-4" />;
      case "suspended":
        return <XCircle className="h-4 w-4" />;
      case "pending_approval":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      case "suspended":
        return "bg-red-100 text-red-800";
      case "pending_approval":
        return "bg-yellow-100 text-yellow-800";
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
              <h1 className="text-3xl font-bold text-foreground">Vendor Management</h1>
              <p className="text-muted-foreground">Manage vendor relationships and track spending</p>
            </div>
            
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-vendor">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Vendor
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Add New Vendor</DialogTitle>
                  <DialogDescription>
                    Register a new vendor for your organization.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Vendor Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., ABC Contractors Inc." {...field} data-testid="input-vendor-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="vendor@company.com" {...field} data-testid="input-vendor-email" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone</FormLabel>
                            <FormControl>
                              <Input placeholder="+1 (555) 123-4567" {...field} data-testid="input-vendor-phone" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Business address..." {...field} data-testid="input-vendor-address" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="taxId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tax ID</FormLabel>
                            <FormControl>
                              <Input placeholder="EIN or SSN" {...field} data-testid="input-vendor-tax-id" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="businessType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Business Type</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-vendor-business-type">
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Corporation">Corporation</SelectItem>
                                <SelectItem value="LLC">LLC</SelectItem>
                                <SelectItem value="Partnership">Partnership</SelectItem>
                                <SelectItem value="Sole Proprietorship">Sole Proprietorship</SelectItem>
                                <SelectItem value="Non-Profit">Non-Profit</SelectItem>
                                <SelectItem value="Government">Government</SelectItem>
                              </SelectContent>
                            </Select>
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
                        data-testid="button-cancel-vendor"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createVendorMutation.isPending}
                        data-testid="button-submit-vendor"
                      >
                        {createVendorMutation.isPending ? "Adding..." : "Add Vendor"}
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
                <Building className="h-5 w-5" />
                All Vendors
              </CardTitle>
              <CardDescription>
                Manage your organization's vendor relationships
              </CardDescription>
            </CardHeader>
            <CardContent>
              {vendorsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              ) : vendors?.length === 0 ? (
                <div className="text-center py-12">
                  <Building className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No Vendors Found</h3>
                  <p className="text-muted-foreground mb-4">
                    Add your first vendor to start managing relationships.
                  </p>
                  <Button onClick={() => setDialogOpen(true)} data-testid="button-add-first-vendor">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Vendor
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vendor Name</TableHead>
                        <TableHead>Contact Info</TableHead>
                        <TableHead>Business Type</TableHead>
                        <TableHead>Total Spend</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Registered</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vendors?.map((vendor) => (
                        <TableRow key={vendor.id} data-testid={`row-vendor-${vendor.id}`}>
                          <TableCell>
                            <div>
                              <div className="font-medium text-foreground">{vendor.name}</div>
                              {vendor.taxId && (
                                <div className="text-sm text-muted-foreground">Tax ID: {vendor.taxId}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {vendor.email && (
                                <div className="text-sm text-foreground">{vendor.email}</div>
                              )}
                              {vendor.phone && (
                                <div className="text-sm text-muted-foreground">{vendor.phone}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {vendor.businessType ? (
                              <Badge variant="secondary">{vendor.businessType}</Badge>
                            ) : (
                              <span className="text-muted-foreground">N/A</span>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">
                            ${parseFloat(vendor.totalSpend || "0").toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(vendor.status)}>
                              <div className="flex items-center gap-1">
                                {getStatusIcon(vendor.status)}
                                {vendor.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </div>
                            </Badge>
                          </TableCell>
                          <TableCell>
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
