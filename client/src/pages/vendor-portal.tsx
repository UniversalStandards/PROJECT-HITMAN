import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Building2, FileText, DollarSign, TrendingUp, Award, Clock, AlertCircle, CheckCircle2, Send } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';

export default function VendorPortal() {
  const { toast } = useToast();
  const [bidAmount, setBidAmount] = useState('');
  const [proposal, setProposal] = useState('');
  const [selectedProcurement, setSelectedProcurement] = useState<any>(null);

  // Fetch open procurements
  const { data: procurements = [], isLoading } = useQuery({
    queryKey: ['/api/vendor/procurements'],
  });

  // Submit bid mutation
  const bidMutation = useMutation({
    mutationFn: async (bidData: any) => {
      return await apiRequest('POST', '/api/vendor/bid', bidData);
    },
    onSuccess: () => {
      toast({
        title: "Bid Submitted",
        description: "Your bid has been submitted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/vendor/procurements'] });
      setBidAmount('');
      setProposal('');
      setSelectedProcurement(null);
    },
    onError: (error) => {
      toast({
        title: "Bid Submission Failed",
        description: error instanceof Error ? error.message : "Failed to submit bid",
        variant: "destructive",
      });
    },
  });

  const handleBidSubmission = () => {
    if (!selectedProcurement || !bidAmount || !proposal) {
      toast({
        title: "Missing Information",
        description: "Please complete all bid fields",
        variant: "destructive",
      });
      return;
    }

    bidMutation.mutate({
      procurementId: selectedProcurement.id,
      bidAmount: parseFloat(bidAmount),
      proposal
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4" data-testid="vendor-portal">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Vendor Portal</h1>
        <p className="text-muted-foreground">
          Manage contracts, submit bids, track payments, and access procurement opportunities
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card data-testid="stat-active-contracts">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Contracts</p>
                <p className="text-2xl font-bold">3</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card data-testid="stat-pending-payments">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Payments</p>
                <p className="text-2xl font-bold">$45,250</p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card data-testid="stat-bids-submitted">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Bids Submitted</p>
                <p className="text-2xl font-bold">12</p>
              </div>
              <Send className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card data-testid="stat-win-rate">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Win Rate</p>
                <p className="text-2xl font-bold">25%</p>
              </div>
              <Award className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="opportunities" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 max-w-4xl">
          <TabsTrigger value="opportunities" data-testid="tab-opportunities">
            <TrendingUp className="mr-2 h-4 w-4" />
            Opportunities
          </TabsTrigger>
          <TabsTrigger value="bids" data-testid="tab-bids">
            <Send className="mr-2 h-4 w-4" />
            My Bids
          </TabsTrigger>
          <TabsTrigger value="contracts" data-testid="tab-contracts">
            <FileText className="mr-2 h-4 w-4" />
            Contracts
          </TabsTrigger>
          <TabsTrigger value="invoices" data-testid="tab-invoices">
            <DollarSign className="mr-2 h-4 w-4" />
            Invoices
          </TabsTrigger>
          <TabsTrigger value="profile" data-testid="tab-profile">
            <Building2 className="mr-2 h-4 w-4" />
            Profile
          </TabsTrigger>
        </TabsList>

        {/* Opportunities Tab */}
        <TabsContent value="opportunities" className="space-y-4">
          {procurements.map((procurement: any) => (
            <Card key={procurement.id} data-testid={`procurement-${procurement.id}`}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{procurement.title}</CardTitle>
                    <CardDescription className="mt-2">
                      RFP #{procurement.procurementNumber}
                    </CardDescription>
                  </div>
                  <Badge variant={procurement.status === 'published' ? 'default' : 'secondary'}>
                    {procurement.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm">{procurement.description}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Category</p>
                      <p className="font-medium">{procurement.category}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Estimated Value</p>
                      <p className="font-medium">${procurement.estimatedValue?.toLocaleString() || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Deadline</p>
                      <p className="font-medium">{new Date(procurement.biddingDeadline || Date.now()).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Status</p>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <p className="font-medium">5 days left</p>
                      </div>
                    </div>
                  </div>

                  {selectedProcurement?.id === procurement.id ? (
                    <div className="border-t pt-4 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor={`bid-amount-${procurement.id}`}>Bid Amount</Label>
                        <div className="flex gap-2">
                          <span className="flex items-center px-3 bg-muted rounded-l-md">$</span>
                          <Input
                            id={`bid-amount-${procurement.id}`}
                            type="number"
                            placeholder="Enter your bid amount"
                            value={bidAmount}
                            onChange={(e) => setBidAmount(e.target.value)}
                            className="rounded-l-none"
                            data-testid={`input-bid-amount-${procurement.id}`}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`proposal-${procurement.id}`}>Proposal Summary</Label>
                        <Textarea
                          id={`proposal-${procurement.id}`}
                          placeholder="Describe your approach and qualifications..."
                          value={proposal}
                          onChange={(e) => setProposal(e.target.value)}
                          rows={4}
                          data-testid={`textarea-proposal-${procurement.id}`}
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedProcurement(null);
                            setBidAmount('');
                            setProposal('');
                          }}
                          data-testid={`button-cancel-bid-${procurement.id}`}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleBidSubmission}
                          disabled={bidMutation.isPending}
                          data-testid={`button-submit-bid-${procurement.id}`}
                        >
                          {bidMutation.isPending ? 'Submitting...' : 'Submit Bid'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        data-testid={`button-view-details-${procurement.id}`}
                      >
                        View Details
                      </Button>
                      <Button
                        onClick={() => setSelectedProcurement(procurement)}
                        data-testid={`button-place-bid-${procurement.id}`}
                      >
                        Place Bid
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* My Bids Tab */}
        <TabsContent value="bids" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Submitted Bids</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { id: 1, rfp: 'IT Infrastructure Upgrade', amount: 125000, status: 'under_review', submitted: '2024-01-10' },
                  { id: 2, rfp: 'Fleet Management System', amount: 87500, status: 'awarded', submitted: '2024-01-05' },
                  { id: 3, rfp: 'Building Maintenance', amount: 45000, status: 'rejected', submitted: '2024-01-02' },
                ].map((bid) => (
                  <div key={bid.id} className="border rounded-lg p-4" data-testid={`bid-${bid.id}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{bid.rfp}</p>
                        <p className="text-sm text-muted-foreground">
                          Submitted on {bid.submitted}
                        </p>
                        <p className="text-lg font-semibold mt-1">
                          ${bid.amount.toLocaleString()}
                        </p>
                      </div>
                      <Badge
                        variant={
                          bid.status === 'awarded' ? 'default' :
                          bid.status === 'rejected' ? 'destructive' :
                          'secondary'
                        }
                      >
                        {bid.status === 'under_review' && <Clock className="mr-1 h-3 w-3" />}
                        {bid.status === 'awarded' && <CheckCircle2 className="mr-1 h-3 w-3" />}
                        {bid.status === 'rejected' && <AlertCircle className="mr-1 h-3 w-3" />}
                        {bid.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contracts Tab */}
        <TabsContent value="contracts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Contracts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { id: 'C001', name: 'Annual IT Support', value: 250000, start: '2024-01-01', end: '2024-12-31', progress: 15 },
                  { id: 'C002', name: 'Office Supplies', value: 50000, start: '2024-01-01', end: '2024-06-30', progress: 30 },
                ].map((contract) => (
                  <Card key={contract.id} data-testid={`contract-${contract.id}`}>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{contract.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Contract #{contract.id}
                            </p>
                          </div>
                          <Badge variant="outline">Active</Badge>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Contract Value</p>
                            <p className="font-medium">${contract.value.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Period</p>
                            <p className="font-medium">{contract.start} - {contract.end}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Completion</p>
                            <p className="font-medium">{contract.progress}%</p>
                          </div>
                        </div>
                        
                        <Progress value={contract.progress} className="h-2" />
                        
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" data-testid={`button-view-contract-${contract.id}`}>
                            View Details
                          </Button>
                          <Button size="sm" variant="outline" data-testid={`button-deliverables-${contract.id}`}>
                            Submit Deliverables
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Management</CardTitle>
              <CardDescription>Track and submit invoices for your contracts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { id: 'INV001', contract: 'Annual IT Support', amount: 20833.33, status: 'paid', date: '2024-01-15' },
                  { id: 'INV002', contract: 'Office Supplies', amount: 8333.33, status: 'pending', date: '2024-01-20' },
                  { id: 'INV003', contract: 'Annual IT Support', amount: 20833.33, status: 'overdue', date: '2023-12-15' },
                ].map((invoice) => (
                  <div key={invoice.id} className="border rounded-lg p-4" data-testid={`invoice-${invoice.id}`}>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">Invoice #{invoice.id}</p>
                        <p className="text-sm text-muted-foreground">{invoice.contract}</p>
                        <p className="text-sm text-muted-foreground">Due: {invoice.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold">${invoice.amount.toFixed(2)}</p>
                        <Badge
                          variant={
                            invoice.status === 'paid' ? 'default' :
                            invoice.status === 'overdue' ? 'destructive' :
                            'secondary'
                          }
                        >
                          {invoice.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6">
                <Button data-testid="button-submit-invoice">
                  <FileText className="mr-2 h-4 w-4" />
                  Submit New Invoice
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Company Profile</CardTitle>
              <CardDescription>Manage your vendor profile and certifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company-name">Company Name</Label>
                  <Input id="company-name" defaultValue="TechCorp Solutions" data-testid="input-company-name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tax-id">Tax ID</Label>
                  <Input id="tax-id" defaultValue="12-3456789" data-testid="input-tax-id" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Contact Email</Label>
                  <Input id="email" type="email" defaultValue="vendor@techcorp.com" data-testid="input-company-email" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" defaultValue="555-0123" data-testid="input-company-phone" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">Business Address</Label>
                <Textarea
                  id="address"
                  defaultValue="123 Business Park, Suite 100, Tech City, TC 12345"
                  rows={2}
                  data-testid="textarea-address"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Certifications</Label>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">ISO 9001</Badge>
                  <Badge variant="secondary">Small Business</Badge>
                  <Badge variant="secondary">Minority Owned</Badge>
                </div>
              </div>
              
              <Button data-testid="button-save-profile">Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}