import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, Receipt, DollarSign, Calendar, TrendingUp, Briefcase, UserCheck, Clock, ChevronRight, FileText } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import EmployeeVerificationForm from '@/components/employee-verification-form';

export default function EmployeeDashboard() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedCard, setSelectedCard] = useState<any>(null);

  // Check verification status
  const { data: verificationStatus } = useQuery({
    queryKey: ['/api/employee/verification-status'],
  });

  // Fetch employee dashboard data
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['/api/employee/dashboard'],
    enabled: verificationStatus?.isVerified || false, // Only fetch if verified
  });

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Show verification form if not verified
  if (verificationStatus?.requiresVerification || dashboardData?.requiresVerification) {
    return <EmployeeVerificationForm />;
  }

  const cards = dashboardData?.cards || [];
  const expenses = dashboardData?.expenses || [];
  const grants = dashboardData?.managedGrants || [];
  const message = dashboardData?.message;

  // Show welcome message if not associated with organization (deprecated - now using verification)
  if (message && !dashboardData?.requiresVerification) {
    return (
      <div className="container mx-auto py-8 px-4" data-testid="employee-dashboard">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Welcome to GOFAP</CardTitle>
              <CardDescription>Government Operations and Financial Accounting Platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-muted-foreground">{message}</p>
                <div className="p-4 bg-muted rounded-lg">
                  <h3 className="font-semibold mb-2">Getting Started</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Your administrator needs to associate your account with an organization</li>
                    <li>• Once set up, you'll have access to expense management and digital cards</li>
                    <li>• You'll be able to submit timesheets and manage work orders</li>
                    <li>• Track your training and certifications</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4" data-testid="employee-dashboard">
      {/* Header with Profile */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Employee Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your expenses, cards, and work-related financial activities
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="font-medium">{user.firstName} {user.lastName}</p>
            <p className="text-sm text-muted-foreground">{user.role || 'Employee'}</p>
          </div>
          <Avatar className="h-12 w-12" data-testid="avatar-user">
            <AvatarImage src={user.profileImageUrl} />
            <AvatarFallback>
              {user.firstName?.[0]}{user.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card data-testid="stat-expenses">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Expenses</p>
                <p className="text-2xl font-bold">$2,450</p>
              </div>
              <Receipt className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card data-testid="stat-approved">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approved This Month</p>
                <p className="text-2xl font-bold">$5,200</p>
              </div>
              <UserCheck className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card data-testid="stat-cards">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Cards</p>
                <p className="text-2xl font-bold">{cards.length}</p>
              </div>
              <CreditCard className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card data-testid="stat-grants">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Managed Grants</p>
                <p className="text-2xl font-bold">{grants.length}</p>
              </div>
              <Briefcase className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 max-w-4xl">
          <TabsTrigger value="overview" data-testid="tab-overview">
            <TrendingUp className="mr-2 h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="expenses" data-testid="tab-expenses">
            <Receipt className="mr-2 h-4 w-4" />
            Expenses
          </TabsTrigger>
          <TabsTrigger value="cards" data-testid="tab-cards">
            <CreditCard className="mr-2 h-4 w-4" />
            Cards
          </TabsTrigger>
          <TabsTrigger value="grants" data-testid="tab-grants">
            <Briefcase className="mr-2 h-4 w-4" />
            Grants
          </TabsTrigger>
          <TabsTrigger value="reports" data-testid="tab-reports">
            <FileText className="mr-2 h-4 w-4" />
            Reports
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest transactions and activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { type: 'expense', description: 'Travel to conference', amount: 450, date: '2 hours ago', status: 'pending' },
                  { type: 'card', description: 'Office supplies purchase', amount: 125.50, date: '1 day ago', status: 'approved' },
                  { type: 'grant', description: 'Grant milestone completed', amount: 10000, date: '3 days ago', status: 'completed' },
                ].map((activity, index) => (
                  <div key={index} className="flex items-center justify-between" data-testid={`activity-${index}`}>
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${
                        activity.type === 'expense' ? 'bg-blue-100' :
                        activity.type === 'card' ? 'bg-green-100' :
                        'bg-purple-100'
                      }`}>
                        {activity.type === 'expense' ? <Receipt className="h-4 w-4" /> :
                         activity.type === 'card' ? <CreditCard className="h-4 w-4" /> :
                         <Briefcase className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="font-medium">{activity.description}</p>
                        <p className="text-sm text-muted-foreground">{activity.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${activity.amount.toFixed(2)}</p>
                      <Badge variant={
                        activity.status === 'completed' ? 'default' :
                        activity.status === 'approved' ? 'secondary' :
                        'outline'
                      }>
                        {activity.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4" data-testid="button-view-all">
                View All Activity
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="outline" className="h-auto flex-col py-4" data-testid="action-submit-expense">
                  <Receipt className="mb-2 h-5 w-5" />
                  Submit Expense
                </Button>
                <Button variant="outline" className="h-auto flex-col py-4" data-testid="action-request-card">
                  <CreditCard className="mb-2 h-5 w-5" />
                  Request Card
                </Button>
                <Button variant="outline" className="h-auto flex-col py-4" data-testid="action-view-payslip">
                  <DollarSign className="mb-2 h-5 w-5" />
                  View Payslip
                </Button>
                <Button variant="outline" className="h-auto flex-col py-4" data-testid="action-time-off">
                  <Calendar className="mb-2 h-5 w-5" />
                  Time Off
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Expenses Tab */}
        <TabsContent value="expenses" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Expense Management</CardTitle>
                <CardDescription>Submit and track your expense reimbursements</CardDescription>
              </div>
              <Button data-testid="button-new-expense">
                <Receipt className="mr-2 h-4 w-4" />
                New Expense
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {expenses.map((expense: any, index: number) => (
                  <Card key={expense.id || index} data-testid={`expense-${expense.id || index}`}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{expense.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {expense.category} • {new Date(expense.expenseDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">${parseFloat(expense.amount).toFixed(2)}</p>
                          <Badge variant={
                            expense.status === 'approved' ? 'default' :
                            expense.status === 'rejected' ? 'destructive' :
                            'secondary'
                          }>
                            {expense.status}
                          </Badge>
                        </div>
                      </div>
                      {expense.receiptUrl && (
                        <Button variant="link" size="sm" className="mt-2 p-0" data-testid={`button-receipt-${expense.id}`}>
                          View Receipt
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cards Tab */}
        <TabsContent value="cards" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Payment Cards</CardTitle>
                <CardDescription>Manage your government-issued payment cards</CardDescription>
              </div>
              <Button data-testid="button-request-new-card">
                <CreditCard className="mr-2 h-4 w-4" />
                Request New Card
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cards.length > 0 ? cards.map((card: any) => (
                  <Card key={card.id} className="bg-gradient-to-br from-slate-800 to-slate-600 text-white" data-testid={`card-${card.id}`}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start mb-8">
                        <div>
                          <p className="text-xs opacity-75 uppercase">{card.cardType} Card</p>
                          <p className="text-lg font-medium">{card.holderName}</p>
                        </div>
                        <Badge variant={card.status === 'active' ? 'default' : 'secondary'}>
                          {card.status}
                        </Badge>
                      </div>
                      <p className="text-xl font-mono tracking-wider mb-4">
                        {card.cardNumber}
                      </p>
                      <div className="flex justify-between text-sm">
                        <div>
                          <p className="text-xs opacity-75">Expires</p>
                          <p>{card.expiryDate || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs opacity-75">Monthly Limit</p>
                          <p>${card.monthlyLimit || '0'}</p>
                        </div>
                        <div>
                          <p className="text-xs opacity-75">Spent</p>
                          <p>$850.00</p>
                        </div>
                      </div>
                      <Progress value={35} className="mt-4 bg-white/20" />
                    </CardContent>
                  </Card>
                )) : (
                  <div className="col-span-2 text-center py-8 text-muted-foreground">
                    No payment cards assigned. Request a card to get started.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Grants Tab */}
        <TabsContent value="grants" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Grant Management</CardTitle>
              <CardDescription>Grants you're managing or involved with</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {grants.length > 0 ? grants.map((grant: any) => (
                  <Card key={grant.id} data-testid={`grant-${grant.id}`}>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{grant.grantName}</p>
                            <p className="text-sm text-muted-foreground">
                              {grant.grantorName} • Grant #{grant.grantNumber}
                            </p>
                          </div>
                          <Badge variant={
                            grant.status === 'active' ? 'default' :
                            grant.status === 'completed' ? 'secondary' :
                            'outline'
                          }>
                            {grant.status}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Total Amount</p>
                            <p className="font-medium">${parseFloat(grant.amount).toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Received</p>
                            <p className="font-medium">${parseFloat(grant.amountReceived).toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Spent</p>
                            <p className="font-medium">${parseFloat(grant.amountSpent).toLocaleString()}</p>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Progress</span>
                            <span>{Math.round((parseFloat(grant.amountSpent) / parseFloat(grant.amount)) * 100)}%</span>
                          </div>
                          <Progress value={(parseFloat(grant.amountSpent) / parseFloat(grant.amount)) * 100} />
                        </div>
                        
                        {grant.endDate && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            Ends: {new Date(grant.endDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No grants currently assigned to you.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reports & Documents</CardTitle>
              <CardDescription>Access your financial reports and documents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="cursor-pointer hover:bg-muted/50 transition-colors" data-testid="report-expense">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <Receipt className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Expense Reports</p>
                        <p className="text-sm text-muted-foreground">Monthly expense summaries</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="cursor-pointer hover:bg-muted/50 transition-colors" data-testid="report-payroll">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <DollarSign className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Payroll History</p>
                        <p className="text-sm text-muted-foreground">Pay stubs and tax documents</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="cursor-pointer hover:bg-muted/50 transition-colors" data-testid="report-benefits">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <UserCheck className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Benefits Summary</p>
                        <p className="text-sm text-muted-foreground">Health, retirement, and other benefits</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="cursor-pointer hover:bg-muted/50 transition-colors" data-testid="report-tax">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <FileText className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Tax Documents</p>
                        <p className="text-sm text-muted-foreground">W-2s and tax withholding info</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}