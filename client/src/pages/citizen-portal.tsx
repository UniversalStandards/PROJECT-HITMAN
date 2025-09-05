import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, Home, Car, Gavel, Receipt, DollarSign, Building, FileText, Clock, CheckCircle } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';

export default function CitizenPortal() {
  const { toast } = useToast();
  const [selectedService, setSelectedService] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [citizenInfo, setCitizenInfo] = useState({
    name: '',
    email: '',
    phone: '',
    accountNumber: ''
  });

  // Fetch available services
  const { data: services = [], isLoading } = useQuery({
    queryKey: ['/api/public/services'],
  });

  // Payment mutation
  const paymentMutation = useMutation({
    mutationFn: async (paymentData: any) => {
      return await apiRequest('POST', '/api/citizen/payment', paymentData);
    },
    onSuccess: (data) => {
      toast({
        title: "Payment Successful",
        description: `Transaction ID: ${data.transactionId}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/citizen/payments'] });
      // Reset form
      setSelectedService('');
      setPaymentAmount('');
      setCitizenInfo({ name: '', email: '', phone: '', accountNumber: '' });
    },
    onError: (error) => {
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "Payment processing failed",
        variant: "destructive",
      });
    },
  });

  const handlePayment = () => {
    if (!selectedService || !paymentAmount || !citizenInfo.name || !citizenInfo.email) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    paymentMutation.mutate({
      serviceType: selectedService,
      amount: parseFloat(paymentAmount),
      citizenInfo,
      paymentMethod: 'stripe' // Default to Stripe
    });
  };

  const serviceIcons = {
    tax: <Home className="h-6 w-6" />,
    utility: <Building className="h-6 w-6" />,
    permit: <FileText className="h-6 w-6" />,
    fine: <Gavel className="h-6 w-6" />,
    parking: <Car className="h-6 w-6" />,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4" data-testid="citizen-portal">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Citizen Services Portal</h1>
        <p className="text-muted-foreground">
          Pay taxes, utility bills, fines, and access government services online
        </p>
      </div>

      <Tabs defaultValue="services" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-2xl">
          <TabsTrigger value="services" data-testid="tab-services">
            <CreditCard className="mr-2 h-4 w-4" />
            Services
          </TabsTrigger>
          <TabsTrigger value="payment-history" data-testid="tab-payment-history">
            <Clock className="mr-2 h-4 w-4" />
            Payment History
          </TabsTrigger>
          <TabsTrigger value="receipts" data-testid="tab-receipts">
            <Receipt className="mr-2 h-4 w-4" />
            Receipts
          </TabsTrigger>
        </TabsList>

        {/* Services Tab */}
        <TabsContent value="services" className="space-y-6">
          {/* Service Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((service: any) => (
              <Card 
                key={service.id}
                className={`cursor-pointer transition-all ${
                  selectedService === service.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedService(service.id)}
                data-testid={`service-card-${service.id}`}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {serviceIcons[service.category as keyof typeof serviceIcons]}
                    {service.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{service.description}</p>
                  {selectedService === service.id && (
                    <Badge className="mt-2">Selected</Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Payment Form */}
          {selectedService && (
            <Card>
              <CardHeader>
                <CardTitle>Payment Information</CardTitle>
                <CardDescription>
                  Enter your details to complete the payment
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      placeholder="John Doe"
                      value={citizenInfo.name}
                      onChange={(e) => setCitizenInfo({...citizenInfo, name: e.target.value})}
                      data-testid="input-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      value={citizenInfo.email}
                      onChange={(e) => setCitizenInfo({...citizenInfo, email: e.target.value})}
                      data-testid="input-email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      placeholder="555-0123"
                      value={citizenInfo.phone}
                      onChange={(e) => setCitizenInfo({...citizenInfo, phone: e.target.value})}
                      data-testid="input-phone"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="account">Account/Reference Number</Label>
                    <Input
                      id="account"
                      placeholder="Account or parcel number"
                      value={citizenInfo.accountNumber}
                      onChange={(e) => setCitizenInfo({...citizenInfo, accountNumber: e.target.value})}
                      data-testid="input-account"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Payment Amount *</Label>
                  <div className="flex gap-2">
                    <span className="flex items-center px-3 bg-muted rounded-l-md">$</span>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0.00"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="rounded-l-none"
                      data-testid="input-amount"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedService('');
                      setPaymentAmount('');
                    }}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handlePayment}
                    disabled={paymentMutation.isPending}
                    data-testid="button-pay"
                  >
                    <DollarSign className="mr-2 h-4 w-4" />
                    {paymentMutation.isPending ? 'Processing...' : 'Pay Now'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Payment History Tab */}
        <TabsContent value="payment-history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Mock payment history - would be fetched from API */}
                {[
                  { id: 1, service: 'Property Tax', amount: 1250.00, date: '2024-01-15', status: 'completed' },
                  { id: 2, service: 'Water Bill', amount: 85.50, date: '2024-01-10', status: 'completed' },
                  { id: 3, service: 'Parking Permit', amount: 120.00, date: '2024-01-05', status: 'completed' },
                ].map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg" data-testid={`payment-history-${payment.id}`}>
                    <div>
                      <p className="font-medium">{payment.service}</p>
                      <p className="text-sm text-muted-foreground">{payment.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${payment.amount.toFixed(2)}</p>
                      <Badge variant="outline" className="mt-1">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        {payment.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Receipts Tab */}
        <TabsContent value="receipts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Receipts</CardTitle>
              <CardDescription>
                Download and print your payment receipts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { id: 'R001', date: '2024-01-15', service: 'Property Tax', amount: 1250.00 },
                  { id: 'R002', date: '2024-01-10', service: 'Water Bill', amount: 85.50 },
                ].map((receipt) => (
                  <div key={receipt.id} className="flex items-center justify-between p-4 border rounded-lg" data-testid={`receipt-${receipt.id}`}>
                    <div>
                      <p className="font-medium">Receipt #{receipt.id}</p>
                      <p className="text-sm text-muted-foreground">
                        {receipt.service} - {receipt.date}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">${receipt.amount.toFixed(2)}</span>
                      <Button size="sm" variant="outline" data-testid={`button-download-${receipt.id}`}>
                        <FileText className="mr-1 h-3 w-3" />
                        Download
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Links */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Quick Links & Resources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-auto flex-col py-4" data-testid="link-tax-calculator">
              <Home className="mb-2 h-5 w-5" />
              Tax Calculator
            </Button>
            <Button variant="outline" className="h-auto flex-col py-4" data-testid="link-payment-plans">
              <CreditCard className="mb-2 h-5 w-5" />
              Payment Plans
            </Button>
            <Button variant="outline" className="h-auto flex-col py-4" data-testid="link-service-status">
              <Clock className="mb-2 h-5 w-5" />
              Service Status
            </Button>
            <Button variant="outline" className="h-auto flex-col py-4" data-testid="link-contact">
              <Building className="mb-2 h-5 w-5" />
              Contact Us
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}