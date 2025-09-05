import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings, Shield, Link2, Activity, AlertCircle, CheckCircle2, 
  CreditCard, Building, FileText, Users, DollarSign, TrendingUp,
  Globe, Database, Lock, Briefcase, BarChart3, Bell
} from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import Sidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';
import AdminEmployeeUpload from '@/components/admin-employee-upload';

// Integration categories and providers
const integrationCategories = {
  payment: {
    name: 'Payment Processing',
    icon: CreditCard,
    providers: ['stripe', 'paypal', 'square', 'unit', 'modern_treasury']
  },
  banking: {
    name: 'Banking Infrastructure',
    icon: Building,
    providers: ['plaid', 'dwolla', 'wise', 'circle', 'modern_treasury']
  },
  compliance: {
    name: 'Compliance & Security',
    icon: Shield,
    providers: ['thomson_reuters', 'lexisnexis', 'verafin', 'ofac']
  },
  government: {
    name: 'Government Systems',
    icon: Building,
    providers: ['adp', 'quickbooks', 'salesforce', 'docusign', 'govdelivery']
  },
  audit: {
    name: 'Audit & Reporting',
    icon: FileText,
    providers: ['datasnipper', 'mindbridge', 'workiva']
  }
};

export default function AdminDashboard() {
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState('employees');
  const [configureDialog, setConfigureDialog] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});

  // Fetch analytics
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['/api/admin/analytics'],
  });

  // Fetch health status
  const { data: health, isLoading: healthLoading } = useQuery({
    queryKey: ['/api/admin/health'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Configure provider mutation
  const configureProviderMutation = useMutation({
    mutationFn: async (providerData: any) => {
      const endpoint = providerData.type === 'payment' ? '/api/admin/providers' : '/api/admin/integrations';
      return await apiRequest('POST', endpoint, providerData);
    },
    onSuccess: () => {
      toast({
        title: "Integration Configured",
        description: "The integration has been successfully configured",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/health'] });
      setConfigureDialog(false);
      setApiKeys({});
    },
    onError: (error) => {
      toast({
        title: "Configuration Failed",
        description: error instanceof Error ? error.message : "Failed to configure integration",
        variant: "destructive",
      });
    },
  });

  const handleProviderConfiguration = () => {
    if (!selectedProvider || !apiKeys.apiKey) {
      toast({
        title: "Missing Information",
        description: "Please provide all required API credentials",
        variant: "destructive",
      });
      return;
    }

    configureProviderMutation.mutate({
      type: selectedCategory,
      provider: selectedProvider,
      configuration: apiKeys,
      isActive: true
    });
  };

  const isLoading = analyticsLoading || healthLoading;

  return (
    <div className="flex h-screen bg-muted/30" data-testid="admin-dashboard">
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        
        <main className="flex-1 p-6 overflow-y-auto">
          {/* Enhanced Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">System Administration</h1>
            <p className="text-muted-foreground">
              Manage integrations, monitor system health, and configure government financial operations
            </p>
          </div>

          {/* System Health Status */}
          <Alert className={health?.error ? 'border-destructive' : 'border-green-500'}>
            <Activity className="h-4 w-4" />
            <AlertDescription>
              <span className="font-medium">System Status: </span>
              {health?.error ? (
                <span className="text-destructive">Issues Detected - {health.error}</span>
              ) : (
                <span className="text-green-600">All Systems Operational</span>
              )}
            </AlertDescription>
          </Alert>

          {/* Analytics Overview */}
          {!isLoading && analytics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
              <Card data-testid="stat-budget">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Budget</p>
                      <p className="text-2xl font-bold">
                        ${parseInt(analytics.overview?.financial?.totalBudget || '0').toLocaleString()}
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
              
              <Card data-testid="stat-payments">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Payments</p>
                      <p className="text-2xl font-bold">
                        ${parseInt(analytics.overview?.financial?.totalPayments || '0').toLocaleString()}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
              
              <Card data-testid="stat-vendors">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Active Vendors</p>
                      <p className="text-2xl font-bold">
                        {analytics.overview?.operational?.activeVendors || 0}
                      </p>
                    </div>
                    <Users className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
              
              <Card data-testid="stat-grants">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Active Grants</p>
                      <p className="text-2xl font-bold">
                        {analytics.overview?.operational?.activeGrants || 0}
                      </p>
                    </div>
                    <Briefcase className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Admin Management Tabs */}
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="space-y-6">
            <TabsList className="grid w-full grid-cols-6 max-w-6xl">
              <TabsTrigger value="employees" data-testid="tab-employees">
                <Users className="mr-2 h-4 w-4" />
                Employee Management
              </TabsTrigger>
              {Object.entries(integrationCategories).map(([key, category]) => {
                const Icon = category.icon;
                return (
                  <TabsTrigger key={key} value={key} data-testid={`tab-${key}`}>
                    <Icon className="mr-2 h-4 w-4" />
                    {category.name}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {/* Employee Management Tab Content */}
            <TabsContent value="employees" className="space-y-4">
              <AdminEmployeeUpload />
            </TabsContent>

            {Object.entries(integrationCategories).map(([key, category]) => (
              <TabsContent key={key} value={key} className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{category.name} Integrations</CardTitle>
                    <CardDescription>
                      Configure and manage {category.name.toLowerCase()} provider integrations
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {category.providers.map((provider) => {
                        const providerHealth = health?.[key]?.providers?.find((p: any) => 
                          p.name === provider
                        );
                        const isActive = providerHealth?.status === 'active';
                        
                        return (
                          <div
                            key={provider}
                            className="flex items-center justify-between p-4 border rounded-lg"
                            data-testid={`provider-${provider}`}
                          >
                            <div className="flex items-center gap-4">
                              <div className={`p-2 rounded-full ${
                                isActive ? 'bg-green-100' : 'bg-gray-100'
                              }`}>
                                <Link2 className={`h-4 w-4 ${
                                  isActive ? 'text-green-600' : 'text-gray-400'
                                }`} />
                              </div>
                              <div>
                                <p className="font-medium capitalize">
                                  {provider.replace('_', ' ')}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {isActive ? 'Connected and active' : 'Not configured'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {isActive ? (
                                <Badge variant="default">
                                  <CheckCircle2 className="mr-1 h-3 w-3" />
                                  Active
                                </Badge>
                              ) : (
                                <Badge variant="secondary">
                                  <AlertCircle className="mr-1 h-3 w-3" />
                                  Inactive
                                </Badge>
                              )}
                              <Dialog open={configureDialog && selectedProvider === provider} 
                                     onOpenChange={(open) => {
                                       setConfigureDialog(open);
                                       if (open) setSelectedProvider(provider);
                                     }}>
                                <DialogTrigger asChild>
                                  <Button size="sm" variant="outline" data-testid={`button-configure-${provider}`}>
                                    <Settings className="mr-1 h-3 w-3" />
                                    Configure
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Configure {provider.replace('_', ' ')}</DialogTitle>
                                    <DialogDescription>
                                      Enter the API credentials for this integration
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4 pt-4">
                                    <div className="space-y-2">
                                      <Label htmlFor="apiKey">API Key</Label>
                                      <Input
                                        id="apiKey"
                                        type="password"
                                        placeholder="Enter API key"
                                        value={apiKeys.apiKey || ''}
                                        onChange={(e) => setApiKeys({...apiKeys, apiKey: e.target.value})}
                                        data-testid={`input-api-key-${provider}`}
                                      />
                                    </div>
                                    {provider === 'stripe' && (
                                      <div className="space-y-2">
                                        <Label htmlFor="webhookSecret">Webhook Secret (Optional)</Label>
                                        <Input
                                          id="webhookSecret"
                                          type="password"
                                          placeholder="whsec_..."
                                          value={apiKeys.webhookSecret || ''}
                                          onChange={(e) => setApiKeys({...apiKeys, webhookSecret: e.target.value})}
                                          data-testid={`input-webhook-secret-${provider}`}
                                        />
                                      </div>
                                    )}
                                    {(provider === 'paypal' || provider === 'square') && (
                                      <div className="space-y-2">
                                        <Label htmlFor="clientSecret">Client Secret</Label>
                                        <Input
                                          id="clientSecret"
                                          type="password"
                                          placeholder="Enter client secret"
                                          value={apiKeys.clientSecret || ''}
                                          onChange={(e) => setApiKeys({...apiKeys, clientSecret: e.target.value})}
                                          data-testid={`input-client-secret-${provider}`}
                                        />
                                      </div>
                                    )}
                                    <div className="flex gap-2 pt-4">
                                      <Button
                                        variant="outline"
                                        onClick={() => {
                                          setConfigureDialog(false);
                                          setApiKeys({});
                                        }}
                                        data-testid={`button-cancel-${provider}`}
                                      >
                                        Cancel
                                      </Button>
                                      <Button
                                        onClick={handleProviderConfiguration}
                                        disabled={configureProviderMutation.isPending}
                                        data-testid={`button-save-${provider}`}
                                      >
                                        {configureProviderMutation.isPending ? 'Saving...' : 'Save Configuration'}
                                      </Button>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Provider-specific analytics */}
                {analytics?.providers && key === 'payment' && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Provider Performance</CardTitle>
                      <CardDescription>Transaction volumes and performance metrics</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {analytics.providers.map((provider: any) => (
                          <div key={provider.provider} className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="font-medium capitalize">
                                {provider.provider}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {provider.transactionCount} transactions
                              </span>
                            </div>
                            <Progress 
                              value={(provider.transactionCount / 100) * 100} 
                              className="h-2"
                            />
                            <div className="flex justify-between text-sm text-muted-foreground">
                              <span>Volume: ${provider.totalVolume.toLocaleString()}</span>
                              <span>Avg: ${provider.avgTransaction.toFixed(2)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            ))}
          </Tabs>

          {/* Compliance Analytics */}
          {analytics?.compliance && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Compliance Overview</CardTitle>
                <CardDescription>System-wide compliance and risk metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold">
                      {analytics.compliance.complianceRate?.toFixed(1) || 0}%
                    </p>
                    <p className="text-sm text-muted-foreground">Compliance Rate</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-orange-600">
                      {analytics.compliance.pendingReviewCount || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Pending Reviews</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-red-600">
                      {analytics.compliance.highRiskCount || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">High Risk Entities</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Grant Analytics */}
          {analytics?.grants && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Grant Management</CardTitle>
                <CardDescription>Federal and state grant utilization</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Grants</p>
                    <p className="text-2xl font-bold">{analytics.grants.totalGrants}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Amount</p>
                    <p className="text-2xl font-bold">${analytics.grants.totalAmount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Utilization</p>
                    <p className="text-2xl font-bold">{analytics.grants.utilizationRate.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Remaining</p>
                    <p className="text-2xl font-bold">${analytics.grants.remainingBalance.toLocaleString()}</p>
                  </div>
                </div>
                <Progress value={analytics.grants.utilizationRate} className="mt-4" />
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>System Administration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="outline" className="h-auto flex-col py-4" data-testid="action-users">
                  <Users className="mb-2 h-5 w-5" />
                  User Management
                </Button>
                <Button variant="outline" className="h-auto flex-col py-4" data-testid="action-backup">
                  <Database className="mb-2 h-5 w-5" />
                  Database Backup
                </Button>
                <Button variant="outline" className="h-auto flex-col py-4" data-testid="action-security">
                  <Lock className="mb-2 h-5 w-5" />
                  Security Settings
                </Button>
                <Button variant="outline" className="h-auto flex-col py-4" data-testid="action-notifications">
                  <Bell className="mb-2 h-5 w-5" />
                  Notifications
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}