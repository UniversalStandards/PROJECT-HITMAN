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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import Sidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';
import { 
  DollarSign, CreditCard, Building2, Globe, Zap, 
  CheckCircle2, Clock, XCircle, AlertCircle, TrendingUp,
  Send, Calendar, FileText, Receipt
} from 'lucide-react';

export default function PaymentHub() {
  const { toast } = useToast();
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('stripe');

  // Unified payment form state
  const [paymentForm, setPaymentForm] = useState({
    paymentType: 'vendor',
    paymentMethod: 'ach',
    provider: 'stripe',
    amount: '',
    currency: 'USD',
    recipientName: '',
    recipientEmail: '',
    recipientAccount: '',
    routingNumber: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    description: '',
    invoiceNumber: '',
    dueDate: '',
    recurring: false,
    recurringFrequency: 'monthly',
    scheduleDate: '',
    scheduleTime: '',
  });

  // Fetch payment providers status
  const { data: providers, isLoading: providersLoading } = useQuery({
    queryKey: ['/api/payment-providers'],
  });

  // Fetch recent payments
  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ['/api/payments/all'],
  });

  // Fetch scheduled payments
  const { data: scheduledPayments } = useQuery({
    queryKey: ['/api/payments/scheduled'],
  });

  // Process payment mutation
  const processPaymentMutation = useMutation({
    mutationFn: async (paymentData: any) => {
      return apiRequest('POST', '/api/payments/process', paymentData);
    },
    onSuccess: async (response) => {
      const data = await response.json();
      toast({
        title: "Payment Processed",
        description: `Payment of $${paymentForm.amount} has been processed successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/payments/all'] });
      setIsPaymentDialogOpen(false);
      resetPaymentForm();
    },
    onError: (error: any) => {
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to process payment",
        variant: "destructive",
      });
    }
  });

  // Schedule payment mutation
  const schedulePaymentMutation = useMutation({
    mutationFn: async (scheduleData: any) => {
      return apiRequest('POST', '/api/payments/schedule', scheduleData);
    },
    onSuccess: async (response) => {
      toast({
        title: "Payment Scheduled",
        description: `Payment scheduled for ${paymentForm.scheduleDate}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/payments/scheduled'] });
      setIsScheduleDialogOpen(false);
      resetPaymentForm();
    },
  });

  const resetPaymentForm = () => {
    setPaymentForm({
      paymentType: 'vendor',
      paymentMethod: 'ach',
      provider: 'stripe',
      amount: '',
      currency: 'USD',
      recipientName: '',
      recipientEmail: '',
      recipientAccount: '',
      routingNumber: '',
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      description: '',
      invoiceNumber: '',
      dueDate: '',
      recurring: false,
      recurringFrequency: 'monthly',
      scheduleDate: '',
      scheduleTime: '',
    });
  };

  const handleProcessPayment = () => {
    const paymentData = {
      ...paymentForm,
      amount: parseFloat(paymentForm.amount),
      provider: selectedProvider,
    };
    
    if (paymentForm.scheduleDate) {
      schedulePaymentMutation.mutate(paymentData);
    } else {
      processPaymentMutation.mutate(paymentData);
    }
  };

  const getProviderStatus = (provider: string) => {
    const providerData = providers?.find((p: any) => p.name === provider);
    return providerData?.status || 'inactive';
  };

  const getPaymentMethodIcon = (method: string) => {
    switch(method) {
      case 'ach': return <Building2 className="h-4 w-4" />;
      case 'wire': return <Globe className="h-4 w-4" />;
      case 'card': return <CreditCard className="h-4 w-4" />;
      case 'instant': return <Zap className="h-4 w-4" />;
      default: return <DollarSign className="h-4 w-4" />;
    }
  };

  const paymentProviders = [
    { id: 'stripe', name: 'Stripe', methods: ['ach', 'wire', 'card'], logo: '💳' },
    { id: 'paypal', name: 'PayPal', methods: ['instant', 'card'], logo: '💰' },
    { id: 'dwolla', name: 'Dwolla', methods: ['ach'], logo: '🏦' },
    { id: 'wise', name: 'Wise', methods: ['wire', 'international'], logo: '🌍' },
    { id: 'square', name: 'Square', methods: ['card', 'ach'], logo: '⬜' },
  ];

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Unified Payment Hub</h1>
            <p className="text-muted-foreground">Process all payments through a single interface</p>
          </div>

          {/* Payment Stats */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Today's Volume</p>
                    <p className="text-2xl font-bold">$284,320</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pending</p>
                    <p className="text-2xl font-bold">12</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Scheduled</p>
                    <p className="text-2xl font-bold">{scheduledPayments?.length || 0}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Failed</p>
                    <p className="text-2xl font-bold">2</p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Success Rate</p>
                    <p className="text-2xl font-bold">98.2%</p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Providers */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Providers</CardTitle>
              <CardDescription>Active payment gateways and their status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {paymentProviders.map((provider) => (
                  <div
                    key={provider.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedProvider === provider.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedProvider(provider.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">{provider.logo}</span>
                      <Badge variant={getProviderStatus(provider.id) === 'active' ? 'default' : 'secondary'}>
                        {getProviderStatus(provider.id)}
                      </Badge>
                    </div>
                    <p className="font-semibold">{provider.name}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {provider.methods.map((method) => (
                        <Badge key={method} variant="outline" className="text-xs">
                          {method}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="process" className="space-y-4">
            <div className="flex justify-between items-center">
              <TabsList>
                <TabsTrigger value="process">Process Payment</TabsTrigger>
                <TabsTrigger value="scheduled">Scheduled Payments</TabsTrigger>
                <TabsTrigger value="history">Payment History</TabsTrigger>
                <TabsTrigger value="recurring">Recurring Payments</TabsTrigger>
              </TabsList>
              
              <div className="flex gap-2">
                <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" data-testid="button-schedule">
                      <Calendar className="mr-2 h-4 w-4" />
                      Schedule Payment
                    </Button>
                  </DialogTrigger>
                </Dialog>
                
                <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-primary" data-testid="button-new-payment">
                      <Send className="mr-2 h-4 w-4" />
                      New Payment
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[700px]">
                    <DialogHeader>
                      <DialogTitle>Process Payment</DialogTitle>
                      <DialogDescription>
                        Send payment using {paymentProviders.find(p => p.id === selectedProvider)?.name}
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid gap-4 py-4 max-h-[500px] overflow-y-auto">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label>Payment Type</Label>
                          <Select value={paymentForm.paymentType} onValueChange={(v) => setPaymentForm({...paymentForm, paymentType: v})}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="vendor">Vendor Payment</SelectItem>
                              <SelectItem value="payroll">Payroll</SelectItem>
                              <SelectItem value="expense">Expense Reimbursement</SelectItem>
                              <SelectItem value="tax">Tax Payment</SelectItem>
                              <SelectItem value="utility">Utility Payment</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="grid gap-2">
                          <Label>Payment Method</Label>
                          <RadioGroup value={paymentForm.paymentMethod} onValueChange={(v) => setPaymentForm({...paymentForm, paymentMethod: v})}>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="ach" id="ach" />
                              <Label htmlFor="ach">ACH Transfer</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="wire" id="wire" />
                              <Label htmlFor="wire">Wire Transfer</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="card" id="card" />
                              <Label htmlFor="card">Credit Card</Label>
                            </div>
                          </RadioGroup>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label>Amount</Label>
                          <Input
                            type="number"
                            value={paymentForm.amount}
                            onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
                            placeholder="0.00"
                            data-testid="input-amount"
                          />
                        </div>
                        
                        <div className="grid gap-2">
                          <Label>Currency</Label>
                          <Select value={paymentForm.currency} onValueChange={(v) => setPaymentForm({...paymentForm, currency: v})}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="USD">USD - US Dollar</SelectItem>
                              <SelectItem value="EUR">EUR - Euro</SelectItem>
                              <SelectItem value="GBP">GBP - British Pound</SelectItem>
                              <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="grid gap-2">
                        <Label>Recipient Name</Label>
                        <Input
                          value={paymentForm.recipientName}
                          onChange={(e) => setPaymentForm({...paymentForm, recipientName: e.target.value})}
                          placeholder="Company or Individual Name"
                          data-testid="input-recipient"
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label>Recipient Email</Label>
                        <Input
                          type="email"
                          value={paymentForm.recipientEmail}
                          onChange={(e) => setPaymentForm({...paymentForm, recipientEmail: e.target.value})}
                          placeholder="recipient@example.com"
                        />
                      </div>
                      
                      {(paymentForm.paymentMethod === 'ach' || paymentForm.paymentMethod === 'wire') && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label>Account Number</Label>
                            <Input
                              value={paymentForm.recipientAccount}
                              onChange={(e) => setPaymentForm({...paymentForm, recipientAccount: e.target.value})}
                              placeholder="123456789"
                              data-testid="input-account"
                            />
                          </div>
                          
                          <div className="grid gap-2">
                            <Label>Routing Number</Label>
                            <Input
                              value={paymentForm.routingNumber}
                              onChange={(e) => setPaymentForm({...paymentForm, routingNumber: e.target.value})}
                              placeholder="021000021"
                              maxLength={9}
                            />
                          </div>
                        </div>
                      )}
                      
                      {paymentForm.paymentMethod === 'card' && (
                        <>
                          <div className="grid gap-2">
                            <Label>Card Number</Label>
                            <Input
                              value={paymentForm.cardNumber}
                              onChange={(e) => setPaymentForm({...paymentForm, cardNumber: e.target.value})}
                              placeholder="4242 4242 4242 4242"
                              maxLength={19}
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                              <Label>Expiry Date</Label>
                              <Input
                                value={paymentForm.expiryDate}
                                onChange={(e) => setPaymentForm({...paymentForm, expiryDate: e.target.value})}
                                placeholder="MM/YY"
                                maxLength={5}
                              />
                            </div>
                            
                            <div className="grid gap-2">
                              <Label>CVV</Label>
                              <Input
                                value={paymentForm.cvv}
                                onChange={(e) => setPaymentForm({...paymentForm, cvv: e.target.value})}
                                placeholder="123"
                                maxLength={4}
                              />
                            </div>
                          </div>
                        </>
                      )}
                      
                      <div className="grid gap-2">
                        <Label>Description</Label>
                        <Textarea
                          value={paymentForm.description}
                          onChange={(e) => setPaymentForm({...paymentForm, description: e.target.value})}
                          placeholder="Payment for invoice #123, services rendered..."
                          rows={3}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label>Invoice Number (Optional)</Label>
                          <Input
                            value={paymentForm.invoiceNumber}
                            onChange={(e) => setPaymentForm({...paymentForm, invoiceNumber: e.target.value})}
                            placeholder="INV-001"
                          />
                        </div>
                        
                        <div className="grid gap-2">
                          <Label>Schedule Date (Optional)</Label>
                          <Input
                            type="date"
                            value={paymentForm.scheduleDate}
                            onChange={(e) => setPaymentForm({...paymentForm, scheduleDate: e.target.value})}
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="recurring"
                          checked={paymentForm.recurring}
                          onCheckedChange={(checked) => setPaymentForm({...paymentForm, recurring: checked as boolean})}
                        />
                        <Label htmlFor="recurring">Make this a recurring payment</Label>
                      </div>
                      
                      {paymentForm.recurring && (
                        <div className="grid gap-2">
                          <Label>Recurring Frequency</Label>
                          <Select value={paymentForm.recurringFrequency} onValueChange={(v) => setPaymentForm({...paymentForm, recurringFrequency: v})}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="biweekly">Bi-Weekly</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem value="quarterly">Quarterly</SelectItem>
                              <SelectItem value="annually">Annually</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      
                      {paymentForm.amount && (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            <div className="space-y-1">
                              <p>Payment Amount: ${parseFloat(paymentForm.amount).toFixed(2)} {paymentForm.currency}</p>
                              <p>Processing Fee: ${(parseFloat(paymentForm.amount) * 0.029).toFixed(2)}</p>
                              <p className="font-semibold">
                                Total: ${(parseFloat(paymentForm.amount) * 1.029).toFixed(2)} {paymentForm.currency}
                              </p>
                            </div>
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                    
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleProcessPayment}
                        disabled={processPaymentMutation.isPending || schedulePaymentMutation.isPending}
                        data-testid="button-confirm-payment"
                      >
                        {processPaymentMutation.isPending || schedulePaymentMutation.isPending 
                          ? "Processing..." 
                          : paymentForm.scheduleDate 
                            ? "Schedule Payment" 
                            : "Process Payment"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            
            <TabsContent value="process" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Payment Actions</CardTitle>
                  <CardDescription>Common payment workflows</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Button 
                      variant="outline" 
                      className="h-24 flex flex-col items-center justify-center gap-2"
                      onClick={() => {
                        setPaymentForm({...paymentForm, paymentType: 'vendor', paymentMethod: 'ach'});
                        setIsPaymentDialogOpen(true);
                      }}
                    >
                      <Building2 className="h-8 w-8" />
                      <span>Pay Vendor</span>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="h-24 flex flex-col items-center justify-center gap-2"
                      onClick={() => {
                        setPaymentForm({...paymentForm, paymentType: 'payroll', paymentMethod: 'ach'});
                        setIsPaymentDialogOpen(true);
                      }}
                    >
                      <DollarSign className="h-8 w-8" />
                      <span>Run Payroll</span>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="h-24 flex flex-col items-center justify-center gap-2"
                      onClick={() => {
                        setPaymentForm({...paymentForm, paymentType: 'expense', paymentMethod: 'ach'});
                        setIsPaymentDialogOpen(true);
                      }}
                    >
                      <Receipt className="h-8 w-8" />
                      <span>Reimburse Expense</span>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="h-24 flex flex-col items-center justify-center gap-2"
                      onClick={() => {
                        setPaymentForm({...paymentForm, paymentType: 'tax', paymentMethod: 'wire'});
                        setIsPaymentDialogOpen(true);
                      }}
                    >
                      <FileText className="h-8 w-8" />
                      <span>Tax Payment</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="scheduled" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Scheduled Payments</CardTitle>
                  <CardDescription>Upcoming payments scheduled for processing</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Schedule Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Recipient</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {scheduledPayments?.map((payment: any) => (
                        <TableRow key={payment.id}>
                          <TableCell>{new Date(payment.scheduleDate).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{payment.type}</Badge>
                          </TableCell>
                          <TableCell>{payment.recipientName}</TableCell>
                          <TableCell className="font-semibold">${payment.amount.toLocaleString()}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {getPaymentMethodIcon(payment.method)}
                              <span>{payment.method.toUpperCase()}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">Scheduled</Badge>
                          </TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline">Cancel</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {!scheduledPayments || scheduledPayments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground">
                            No scheduled payments
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="history" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Payment History</CardTitle>
                  <CardDescription>All processed payments</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Recipient</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Provider</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments?.map((payment: any) => (
                        <TableRow key={payment.id}>
                          <TableCell>{new Date(payment.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{payment.type}</Badge>
                          </TableCell>
                          <TableCell>{payment.recipientName}</TableCell>
                          <TableCell className="font-semibold">${payment.amount.toLocaleString()}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {getPaymentMethodIcon(payment.method)}
                              <span>{payment.method?.toUpperCase()}</span>
                            </div>
                          </TableCell>
                          <TableCell>{payment.provider}</TableCell>
                          <TableCell>
                            <Badge variant={payment.status === 'completed' ? 'default' : payment.status === 'failed' ? 'destructive' : 'secondary'}>
                              {payment.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                      {!payments || payments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground">
                            No payment history
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}