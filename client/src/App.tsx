import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Wallets from "@/pages/wallets";
import Payments from "@/pages/payments";
import Budgets from "@/pages/budgets";
import Expenses from "@/pages/expenses";
import Vendors from "@/pages/vendors";
import Reports from "@/pages/reports";
import CitizenPortal from "@/pages/citizen-portal";
import VendorPortal from "@/pages/vendor-portal";
import EmployeeDashboard from "@/pages/employee-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import PublicServices from "@/pages/public-services";
import About from "@/pages/about";
import Contact from "@/pages/contact";
import ServicesDirectory from "@/pages/services-directory";
import FAQ from "@/pages/faq";
import News from "@/pages/news";
import Careers from "@/pages/careers";
import RoleSelector from "@/pages/role-selector";
import CardManagement from "@/pages/card-management";
import DirectDeposits from "@/pages/direct-deposits";
import PaymentHub from "@/pages/payment-hub";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Determine user type for routing
  const userRole = (user as any)?.role || 'citizen';
  const isCitizen = !isAuthenticated || userRole === 'citizen';
  const isVendor = userRole === 'vendor';
  const isEmployee = userRole === 'employee' || userRole === 'user';
  const isAdmin = userRole === 'admin';

  if (isLoading) {
    return <Route path="/" component={Landing} />;
  }

  return (
    <Switch>
      {/* Public/Citizen Routes */}
      {isCitizen ? (
        <>
          <Route path="/" component={RoleSelector} />
          <Route path="/services" component={PublicServices} />
          <Route path="/citizen" component={CitizenPortal} />
          <Route path="/vendor-registration" component={VendorPortal} />
          <Route path="/services-directory" component={ServicesDirectory} />
          <Route path="/about" component={About} />
          <Route path="/contact" component={Contact} />
          <Route path="/faq" component={FAQ} />
          <Route path="/news" component={News} />
          <Route path="/careers" component={Careers} />
        </>
      ) : null}
      
      {/* Vendor Routes */}
      {isVendor ? (
        <>
          <Route path="/" component={VendorPortal} />
          <Route path="/vendor" component={VendorPortal} />
        </>
      ) : null}
      
      {/* Employee Routes */}
      {isEmployee && !isAdmin ? (
        <>
          <Route path="/" component={EmployeeDashboard} />
          <Route path="/employee" component={EmployeeDashboard} />
          <Route path="/expenses" component={Expenses} />
          <Route path="/direct-deposit" component={DirectDeposits} />
          <Route path="/reports" component={Reports} />
        </>
      ) : null}
      
      {/* Admin Routes */}
      {isAdmin ? (
        <>
          <Route path="/" component={AdminDashboard} />
          <Route path="/dashboard" component={AdminDashboard} />
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/wallets" component={Wallets} />
          <Route path="/payments" component={Payments} />
          <Route path="/payment-hub" component={PaymentHub} />
          <Route path="/cards" component={CardManagement} />
          <Route path="/direct-deposits" component={DirectDeposits} />
          <Route path="/budgets" component={Budgets} />
          <Route path="/expenses" component={Expenses} />
          <Route path="/vendors" component={Vendors} />
          <Route path="/reports" component={Reports} />
          <Route path="/employee" component={EmployeeDashboard} />
          <Route path="/citizen" component={CitizenPortal} />
          <Route path="/vendor-portal" component={VendorPortal} />
          <Route path="/services-directory" component={ServicesDirectory} />
          <Route path="/about" component={About} />
          <Route path="/contact" component={Contact} />
          <Route path="/faq" component={FAQ} />
          <Route path="/news" component={News} />
          <Route path="/careers" component={Careers} />
        </>
      ) : null}
      
      {/* Default Landing for unauthenticated - Removed duplicate logic */}
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
