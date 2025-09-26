import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import Sidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';
import { useAuth } from '@/hooks/useAuth';
import { 
  DollarSign, Plus, Send, Users, Building, Calendar, 
  AlertCircle, CheckCircle2, Upload, Download, Clock 
} from 'lucide-react';

export default function DirectDeposits() {
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = (user as any)?.role === 'admin';
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState(isAdmin ? 'payroll' : 'enrollment');

  // Form state for ACH transfer
  const [transferForm, setTransferForm] = useState({
    transferType: 'payroll',
    amount: '',
    recipientType: 'employee',
    recipientId: '',
    recipientName: '',
    recipientAccount: '',
    routingNumber: '',
    accountType: 'checking',
    transferSpeed: 'standard',
    description: '',
    scheduleDate: '',
  });

  // Employee enrollment form
  const [enrollmentForm, setEnrollmentForm] = useState({
    accountNumber: '',
    routingNumber: '',
    accountType: 'checking',
    bankName: '',
    accountHolderName: '',
  });

  // Fetch direct deposits/transfers
  const { data: transfers, isLoading: transfersLoading } = useQuery({
    queryKey: ['/api/direct-deposits'],
  });

  // Fetch employee enrollment status
  const { data: enrollmentStatus, isLoading: enrollmentLoading } = useQuery({
    queryKey: ['/api/direct-deposit/enrollment'],
    enabled: !isAdmin,
  });

  // Process ACH transfer mutation
  const processTransferMutation = useMutation({
    mutationFn: async (transferData: any) => {
      return apiRequest('POST', '/api/direct-deposits/transfer', transferData);
    },
    onSuccess: async (response) => {
      const data = await response.json();
      toast({
        title: "Transfer Initiated",
        description: `ACH transfer of $${transferForm.amount} has been initiated`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/direct-deposits'] });
      setIsTransferDialogOpen(false);
      resetTransferForm();
    },
    onError: (error: any) => {
      toast({
        title: "Transfer Failed",
        description: error.message || "Failed to process transfer",
        variant: "destructive",
      });
    }
  });

  // Enroll in direct deposit mutation
  const enrollMutation = useMutation({
    mutationFn: async (enrollmentData: any) => {
      return apiRequest('POST', '/api/direct-deposit/enroll', enrollmentData);
    },
    onSuccess: async (response) => {
      toast({
        title: "Enrollment Successful",
        description: "Your direct deposit information has been saved",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/direct-deposit/enrollment'] });
      resetEnrollmentForm();
    },
    onError: (error: any) => {
      toast({
        title: "Enrollment Failed",
        description: error.message || "Failed to save direct deposit information",
        variant: "destructive",
      });
    }
  });

  // Bulk payroll upload mutation
  const bulkUploadMutation = useMutation({
    mutationFn: async (fileData: FormData) => {
      return fetch('/api/direct-deposits/bulk-upload', {
        method: 'POST',
        body: fileData,
      });
    },
    onSuccess: async (response) => {
      const data = await response.json();
      toast({
        title: "Bulk Upload Successful",
        description: `Processed ${data.count} payroll transfers`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/direct-deposits'] });
      setIsBulkUploadOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to process bulk upload",
        variant: "destructive",
      });
    }
  });

  const resetTransferForm = () => {
    setTransferForm({
      transferType: 'payroll',
      amount: '',
      recipientType: 'employee',
      recipientId: '',
      recipientName: '',
      recipientAccount: '',
      routingNumber: '',
      accountType: 'checking',
      transferSpeed: 'standard',
      description: '',
      scheduleDate: '',
    });
  };

  const resetEnrollmentForm = () => {
    setEnrollmentForm({
      accountNumber: '',
      routingNumber: '',
      accountType: 'checking',
      bankName: '',
      accountHolderName: '',
    });
  };

  const handleTransfer = () => {
    processTransferMutation.mutate({
      ...transferForm,
      amount: parseFloat(transferForm.amount),
    });
  };

  const handleEnroll = () => {
    enrollMutation.mutate(enrollmentForm);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      bulkUploadMutation.mutate(formData);
    }
  };

  const downloadTemplate = () => {
    const template = `employee_id,employee_name,amount,account_number,routing_number,account_type,description
EMP001,John Doe,5000.00,123456789,021000021,checking,Monthly Salary
EMP002,Jane Smith,4500.00,987654321,021000021,checking,Monthly Salary`;
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'payroll_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getTransferFee = (speed: string) => {
    switch(speed) {
      case 'same_day': return 15.00;
      case 'next_day': return 5.00;
      default: return 0.25;
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Direct Deposits & ACH Transfers</h1>
            <p className="text-muted-foreground">
              {isAdmin ? "Process payroll and vendor payments via ACH" : "Manage your direct deposit enrollment"}
            </p>
          </div>

          {/* Stats Cards - Admin only */}
          {isAdmin && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Pending Transfers</p>
                      <p className="text-2xl font-bold">
                        {transfers?.filter((t: any) => t.status === 'pending').length || 0}
                      </p>
                    </div>
                    <Clock className="h-8 w-8 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Today's Volume</p>
                      <p className="text-2xl font-bold">$125,430</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Active Enrollments</p>
                      <p className="text-2xl font-bold">248</p>
                    </div>
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Next Payroll</p>
                      <p className="text-2xl font-bold">3 days</p>
                    </div>
                    <Calendar className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
            <div className="flex justify-between items-center">
              <TabsList>
                {isAdmin ? (
                  <>
                    <TabsTrigger value="payroll">Payroll Processing</TabsTrigger>
                    <TabsTrigger value="transfers">Recent Transfers</TabsTrigger>
                    <TabsTrigger value="enrollments">Employee Enrollments</TabsTrigger>
                  </>
                ) : (
                  <>
                    <TabsTrigger value="enrollment">My Direct Deposit</TabsTrigger>
                    <TabsTrigger value="history">Payment History</TabsTrigger>
                  </>
                )}
              </TabsList>
              
              {isAdmin && (
                <div className="flex gap-2">
                  <Dialog open={isBulkUploadOpen} onOpenChange={setIsBulkUploadOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" data-testid="button-bulk-upload">
                        <Upload className="mr-2 h-4 w-4" />
                        Bulk Upload
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Bulk Payroll Upload</DialogTitle>
                        <DialogDescription>
                          Upload a CSV file with payroll data for multiple employees
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-4 py-4">
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                          <label htmlFor="csv-upload" className="cursor-pointer">
                            <span className="text-primary hover:underline">Choose CSV file</span>
                            <input
                              id="csv-upload"
                              type="file"
                              accept=".csv"
                              className="hidden"
                              onChange={handleFileUpload}
                              data-testid="input-bulk-file"
                            />
                          </label>
                        </div>
                        
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={downloadTemplate}
                          data-testid="button-download-template"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download Template
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  <Dialog open={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-primary" data-testid="button-new-transfer">
                        <Plus className="mr-2 h-4 w-4" />
                        New Transfer
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                      <DialogHeader>
                        <DialogTitle>Process ACH Transfer</DialogTitle>
                        <DialogDescription>
                          Initiate direct deposit or vendor payment via ACH
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label>Transfer Type</Label>
                            <Select value={transferForm.transferType} onValueChange={(v) => setTransferForm({...transferForm, transferType: v})}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="payroll">Payroll</SelectItem>
                                <SelectItem value="vendor">Vendor Payment</SelectItem>
                                <SelectItem value="reimbursement">Reimbursement</SelectItem>
                                <SelectItem value="tax">Tax Payment</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="grid gap-2">
                            <Label>Amount</Label>
                            <Input
                              type="number"
                              value={transferForm.amount}
                              onChange={(e) => setTransferForm({...transferForm, amount: e.target.value})}
                              placeholder="0.00"
                              data-testid="input-amount"
                            />
                          </div>
                        </div>
                        
                        <div className="grid gap-2">
                          <Label>Recipient Name</Label>
                          <Input
                            value={transferForm.recipientName}
                            onChange={(e) => setTransferForm({...transferForm, recipientName: e.target.value})}
                            placeholder="John Doe or Company Name"
                            data-testid="input-recipient"
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label>Account Number</Label>
                            <Input
                              value={transferForm.recipientAccount}
                              onChange={(e) => setTransferForm({...transferForm, recipientAccount: e.target.value})}
                              placeholder="123456789"
                              data-testid="input-account"
                            />
                          </div>
                          
                          <div className="grid gap-2">
                            <Label>Routing Number</Label>
                            <Input
                              value={transferForm.routingNumber}
                              onChange={(e) => setTransferForm({...transferForm, routingNumber: e.target.value})}
                              placeholder="021000021"
                              maxLength={9}
                              data-testid="input-routing"
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label>Account Type</Label>
                            <Select value={transferForm.accountType} onValueChange={(v) => setTransferForm({...transferForm, accountType: v})}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="checking">Checking</SelectItem>
                                <SelectItem value="savings">Savings</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="grid gap-2">
                            <Label>Transfer Speed</Label>
                            <Select value={transferForm.transferSpeed} onValueChange={(v) => setTransferForm({...transferForm, transferSpeed: v})}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="standard">Standard (2-3 days) - $0.25</SelectItem>
                                <SelectItem value="next_day">Next Day - $5.00</SelectItem>
                                <SelectItem value="same_day">Same Day - $15.00</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div className="grid gap-2">
                          <Label>Description</Label>
                          <Input
                            value={transferForm.description}
                            onChange={(e) => setTransferForm({...transferForm, description: e.target.value})}
                            placeholder="Monthly salary, Invoice #123, etc."
                            data-testid="input-description"
                          />
                        </div>
                        
                        {transferForm.amount && (
                          <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                              <div className="space-y-1">
                                <p>Transfer Amount: ${parseFloat(transferForm.amount).toFixed(2)}</p>
                                <p>Processing Fee: ${getTransferFee(transferForm.transferSpeed).toFixed(2)}</p>
                                <p className="font-semibold">
                                  Total: ${(parseFloat(transferForm.amount) + getTransferFee(transferForm.transferSpeed)).toFixed(2)}
                                </p>
                              </div>
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                      
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsTransferDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleTransfer}
                          disabled={processTransferMutation.isPending}
                          data-testid="button-confirm-transfer"
                        >
                          {processTransferMutation.isPending ? "Processing..." : "Process Transfer"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </div>
            
            {/* Admin Tabs */}
            {isAdmin && (
              <>
                <TabsContent value="payroll" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Upcoming Payroll</CardTitle>
                      <CardDescription>Next payroll run scheduled for Friday, December 15</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <Alert>
                          <CheckCircle2 className="h-4 w-4" />
                          <AlertDescription>
                            248 employees enrolled for direct deposit. Total payroll: $1,245,320.00
                          </AlertDescription>
                        </Alert>
                        
                        <div className="flex gap-4">
                          <Button className="bg-primary">
                            <Send className="mr-2 h-4 w-4" />
                            Run Payroll Now
                          </Button>
                          <Button variant="outline">
                            Schedule for Later
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="transfers" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent ACH Transfers</CardTitle>
                      <CardDescription>All direct deposits and ACH payments</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Recipient</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Settlement</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {transfers?.map((transfer: any) => (
                            <TableRow key={transfer.id}>
                              <TableCell>{new Date(transfer.createdAt).toLocaleDateString()}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{transfer.type}</Badge>
                              </TableCell>
                              <TableCell>{transfer.recipientName}</TableCell>
                              <TableCell className="font-semibold">${transfer.amount.toLocaleString()}</TableCell>
                              <TableCell>
                                <Badge variant={transfer.status === 'completed' ? 'default' : 'secondary'}>
                                  {transfer.status}
                                </Badge>
                              </TableCell>
                              <TableCell>{new Date(transfer.settlementDate).toLocaleDateString()}</TableCell>
                            </TableRow>
                          ))}
                          {!transfers || transfers.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center text-muted-foreground">
                                No transfers found
                              </TableCell>
                            </TableRow>
                          ) : null}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>
              </>
            )}
            
            {/* Employee Tabs */}
            {!isAdmin && (
              <>
                <TabsContent value="enrollment" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Direct Deposit Enrollment</CardTitle>
                      <CardDescription>
                        {enrollmentStatus?.isEnrolled 
                          ? "Your direct deposit information is on file" 
                          : "Enroll to receive payments directly to your bank account"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {enrollmentStatus?.isEnrolled ? (
                        <div className="space-y-4">
                          <Alert>
                            <CheckCircle2 className="h-4 w-4" />
                            <AlertDescription>
                              Direct deposit is active for your account ending in ****{enrollmentStatus.last4}
                            </AlertDescription>
                          </Alert>
                          
                          <div className="grid gap-4">
                            <div>
                              <Label>Bank Name</Label>
                              <p className="text-sm text-muted-foreground">{enrollmentStatus.bankName}</p>
                            </div>
                            <div>
                              <Label>Account Type</Label>
                              <p className="text-sm text-muted-foreground">{enrollmentStatus.accountType}</p>
                            </div>
                            <Button variant="outline">Update Banking Information</Button>
                          </div>
                        </div>
                      ) : (
                        <div className="grid gap-4">
                          <div className="grid gap-2">
                            <Label>Bank Name</Label>
                            <Input
                              value={enrollmentForm.bankName}
                              onChange={(e) => setEnrollmentForm({...enrollmentForm, bankName: e.target.value})}
                              placeholder="Chase Bank"
                              data-testid="input-bank-name"
                            />
                          </div>
                          
                          <div className="grid gap-2">
                            <Label>Account Holder Name</Label>
                            <Input
                              value={enrollmentForm.accountHolderName}
                              onChange={(e) => setEnrollmentForm({...enrollmentForm, accountHolderName: e.target.value})}
                              placeholder="John Doe"
                              data-testid="input-holder-name"
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                              <Label>Account Number</Label>
                              <Input
                                value={enrollmentForm.accountNumber}
                                onChange={(e) => setEnrollmentForm({...enrollmentForm, accountNumber: e.target.value})}
                                placeholder="123456789"
                                data-testid="input-account-number"
                              />
                            </div>
                            
                            <div className="grid gap-2">
                              <Label>Routing Number</Label>
                              <Input
                                value={enrollmentForm.routingNumber}
                                onChange={(e) => setEnrollmentForm({...enrollmentForm, routingNumber: e.target.value})}
                                placeholder="021000021"
                                maxLength={9}
                                data-testid="input-routing-number"
                              />
                            </div>
                          </div>
                          
                          <div className="grid gap-2">
                            <Label>Account Type</Label>
                            <Select value={enrollmentForm.accountType} onValueChange={(v) => setEnrollmentForm({...enrollmentForm, accountType: v})}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="checking">Checking</SelectItem>
                                <SelectItem value="savings">Savings</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <Button 
                            onClick={handleEnroll}
                            disabled={enrollMutation.isPending}
                            className="w-full"
                            data-testid="button-enroll"
                          >
                            {enrollMutation.isPending ? "Saving..." : "Enroll in Direct Deposit"}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="history" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Payment History</CardTitle>
                      <CardDescription>Your recent direct deposits</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell>12/01/2023</TableCell>
                            <TableCell>Monthly Salary</TableCell>
                            <TableCell className="font-semibold">$5,000.00</TableCell>
                            <TableCell>
                              <Badge variant="default">Deposited</Badge>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>11/15/2023</TableCell>
                            <TableCell>Mid-month Salary</TableCell>
                            <TableCell className="font-semibold">$2,500.00</TableCell>
                            <TableCell>
                              <Badge variant="default">Deposited</Badge>
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>
              </>
            )}
          </Tabs>
        </main>
      </div>
    </div>
  );
}