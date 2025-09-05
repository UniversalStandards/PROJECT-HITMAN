import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, DollarSign, Users, BarChart3, CreditCard, Building } from "lucide-react";

export default function Landing() {
  const features = [
    {
      icon: <DollarSign className="h-8 w-8 text-primary" />,
      title: "Digital Wallets",
      description: "Create and manage digital accounts for employees, contractors, and citizens with bank-grade security."
    },
    {
      icon: <CreditCard className="h-8 w-8 text-primary" />,
      title: "Payment Processing",
      description: "Streamline payments with automated processing, approval workflows, and real-time tracking."
    },
    {
      icon: <BarChart3 className="h-8 w-8 text-primary" />,
      title: "Budget Management",
      description: "Track budgets, visualize spending patterns, and ensure fiscal responsibility across departments."
    },
    {
      icon: <Building className="h-8 w-8 text-primary" />,
      title: "Vendor Management",
      description: "Manage vendor relationships, track spending, and streamline procurement processes."
    },
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      title: "HR Integration",
      description: "Seamlessly integrate with HR systems for payroll, expense management, and employee benefits."
    },
    {
      icon: <CheckCircle className="h-8 w-8 text-primary" />,
      title: "Compliance Ready",
      description: "Built-in audit trails, reporting, and compliance features designed for government requirements."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-primary/10 to-background">
        <div className="container mx-auto px-6 py-24">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex items-center justify-center space-x-2 mb-6">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                <Building className="h-8 w-8 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-foreground">GOFAP</h1>
                <p className="text-sm text-muted-foreground">Government Operations & Financial Accounting Platform</p>
              </div>
            </div>
            
            <h2 className="text-5xl font-bold text-foreground mb-6">
              Streamline Government 
              <span className="text-primary"> Financial Operations</span>
            </h2>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Comprehensive financial management platform designed specifically for government entities. 
              Manage budgets, process payments, track expenses, and ensure compliance with ease.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="text-lg px-8 py-6"
                onClick={() => window.location.href = "/api/login"}
                data-testid="button-login"
              >
                Get Started
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="text-lg px-8 py-6"
                data-testid="button-learn-more"
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h3 className="text-3xl font-bold text-foreground mb-4">
            Everything You Need for Government Finance
          </h3>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From digital wallets to compliance reporting, GOFAP provides all the tools 
            necessary for modern government financial management.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="border border-border hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mb-4">{feature.icon}</div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-muted/30 py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-foreground mb-4">
              Why Choose GOFAP?
            </h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <CheckCircle className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h4 className="text-lg font-semibold text-foreground mb-2">Unlock Efficiency</h4>
                  <p className="text-muted-foreground">Streamlined financial operations and instant transactions reduce processing time by up to 80%.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <CheckCircle className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h4 className="text-lg font-semibold text-foreground mb-2">Gain Insights</h4>
                  <p className="text-muted-foreground">Comprehensive analytics and reporting provide deep insights into spending patterns and budget performance.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <CheckCircle className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h4 className="text-lg font-semibold text-foreground mb-2">Improve Security</h4>
                  <p className="text-muted-foreground">Role-based access control, audit logs, and bank-grade security protect sensitive financial data.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <CheckCircle className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h4 className="text-lg font-semibold text-foreground mb-2">Enhance Agility</h4>
                  <p className="text-muted-foreground">Rapidly deploy new digital finance tools aligned to your organization's unique needs.</p>
                </div>
              </div>
            </div>

            <div className="lg:pl-12">
              <Card className="border border-border">
                <CardHeader>
                  <CardTitle className="text-2xl text-center">Ready to Get Started?</CardTitle>
                  <CardDescription className="text-center">
                    Join government organizations already using GOFAP to modernize their financial operations.
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Button 
                    size="lg" 
                    className="w-full text-lg py-6"
                    onClick={() => window.location.href = "/api/login"}
                    data-testid="button-get-started-main"
                  >
                    Access Platform
                  </Button>
                  <p className="text-sm text-muted-foreground mt-4">
                    Secure login powered by Replit authentication
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="container mx-auto px-6">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                <Building className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-foreground">GOFAP</span>
            </div>
            <p className="text-muted-foreground mb-4">
              Government Operations and Financial Accounting Platform
            </p>
            <p className="text-sm text-muted-foreground">
              "We Account for Everything"
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
