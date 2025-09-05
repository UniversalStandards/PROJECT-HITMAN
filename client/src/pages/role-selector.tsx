import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { 
  Users, Briefcase, Building, Shield, ArrowRight,
  CreditCard, FileText, UserCheck, Settings
} from 'lucide-react';

const roles = [
  {
    id: 'citizen',
    title: 'Citizens',
    description: 'Pay taxes, apply for permits, access public services',
    icon: Users,
    color: 'blue',
    features: [
      'Pay property taxes and utility bills',
      'Apply for permits and licenses',
      'Report issues and request services',
      'View public records'
    ],
    loginPath: '/api/login?role=citizen',
    portalPath: '/citizen'
  },
  {
    id: 'vendor',
    title: 'Vendors & Contractors',
    description: 'Submit bids, manage contracts, track payments',
    icon: Briefcase,
    color: 'green',
    features: [
      'View and respond to RFPs',
      'Submit invoices and track payments',
      'Manage contracts and documents',
      'Update business information'
    ],
    loginPath: '/api/login?role=vendor',
    portalPath: '/vendor-portal'
  },
  {
    id: 'employee',
    title: 'Government Employees',
    description: 'Manage expenses, access payroll, internal tools',
    icon: UserCheck,
    color: 'purple',
    features: [
      'Submit expense reports',
      'View payroll and benefits',
      'Manage government cards',
      'Access internal resources'
    ],
    loginPath: '/api/login?role=employee',
    portalPath: '/employee'
  },
  {
    id: 'admin',
    title: 'Administrators',
    description: 'System administration, financial oversight, reporting',
    icon: Shield,
    color: 'orange',
    features: [
      'Manage all financial operations',
      'Configure integrations',
      'Generate reports and analytics',
      'User and role management'
    ],
    loginPath: '/api/login?role=admin',
    portalPath: '/admin'
  }
];

export default function RoleSelector() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-blue-900 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <Building className="h-12 w-12 mx-auto mb-4" />
            <h1 className="text-4xl font-bold mb-2">Government Operations Platform</h1>
            <p className="text-xl text-blue-100">Select your role to access the appropriate portal</p>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {roles.map((role) => {
            const Icon = role.icon;
            const bgColor = `bg-${role.color}-50`;
            const borderColor = `border-${role.color}-200`;
            const iconBgColor = `bg-${role.color}-100`;
            const iconColor = `text-${role.color}-600`;
            
            return (
              <Card 
                key={role.id} 
                className={`hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer ${borderColor}`}
                data-testid={`role-${role.id}`}
              >
                <CardHeader className="text-center">
                  <div className={`inline-flex p-4 ${iconBgColor} rounded-full mb-4 mx-auto`}>
                    <Icon className={`h-8 w-8 ${iconColor}`} />
                  </div>
                  <CardTitle className="text-xl">{role.title}</CardTitle>
                  <CardDescription>{role.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-6">
                    {role.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <ArrowRight className="h-4 w-4 mt-0.5 flex-shrink-0 text-green-600" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <div className="space-y-2">
                    <Button 
                      className="w-full" 
                      asChild
                      data-testid={`button-login-${role.id}`}
                    >
                      <a href={role.loginPath}>
                        Sign In as {role.title.slice(0, -1)}
                      </a>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      asChild
                      data-testid={`button-explore-${role.id}`}
                    >
                      <Link href={role.portalPath}>
                        Explore Portal
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Access Section */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Quick Access</CardTitle>
            <CardDescription className="text-center">
              Common services available without login
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Button variant="outline" asChild data-testid="quick-services">
                <Link href="/services">
                  <FileText className="mr-2 h-4 w-4" />
                  View Services
                </Link>
              </Button>
              <Button variant="outline" asChild data-testid="quick-payments">
                <Link href="/citizen">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Make Payment
                </Link>
              </Button>
              <Button variant="outline" asChild data-testid="quick-contact">
                <Link href="/contact">
                  <Building className="mr-2 h-4 w-4" />
                  Contact Us
                </Link>
              </Button>
              <Button variant="outline" asChild data-testid="quick-faq">
                <Link href="/faq">
                  <Settings className="mr-2 h-4 w-4" />
                  Help & FAQ
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Information Footer */}
        <div className="text-center text-muted-foreground">
          <p className="mb-4">
            This platform provides secure access to government services based on your role and permissions.
          </p>
          <p className="text-sm">
            Need help? <Link href="/contact" className="underline">Contact Support</Link> or call (555) 010-0000
          </p>
        </div>
      </div>
    </div>
  );
}