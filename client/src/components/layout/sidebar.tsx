import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  Building, 
  BarChart3, 
  Wallet, 
  CreditCard, 
  PieChart, 
  Receipt, 
  Users, 
  Settings, 
  Plug,
  Menu,
  X
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3 },
  { name: "Digital Wallets", href: "/wallets", icon: Wallet },
  { name: "Payments", href: "/payments", icon: CreditCard },
  { name: "Budgets", href: "/budgets", icon: PieChart },
  { name: "Expenses", href: "/expenses", icon: Receipt },
  { name: "Vendors", href: "/vendors", icon: Building },
  { name: "Reports", href: "/reports", icon: BarChart3 },
];

const systemNavigation = [
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Integrations", href: "/integrations", icon: Plug },
];

export default function Sidebar() {
  const [location] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleMobile = () => setIsMobileOpen(!isMobileOpen);

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="sm"
        className="md:hidden fixed top-4 left-4 z-50"
        onClick={toggleMobile}
        data-testid="button-mobile-menu"
      >
        {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
          "w-64 bg-card border-r border-border flex flex-col shadow-sm transition-transform duration-300 ease-in-out",
          "md:relative md:translate-x-0 fixed inset-y-0 left-0 z-50",
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
              <Building className="text-primary-foreground text-sm" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">GOFAP</h1>
              <p className="text-xs text-muted-foreground">Financial Platform</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {/* Financial Operations Section */}
          <div className="space-y-2">
            {navigation.map((item) => {
              const isActive = location === item.href;
              return (
                <Link key={item.name} href={item.href}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className={cn(
                      "w-full justify-start space-x-3",
                      isActive 
                        ? "bg-primary text-primary-foreground" 
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                    onClick={() => setIsMobileOpen(false)}
                    data-testid={`nav-${item.name.toLowerCase().replace(' ', '-')}`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Button>
                </Link>
              );
            })}
          </div>

          {/* System Section */}
          <div className="pt-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 pb-2">
              System
            </h3>
            <div className="space-y-2">
              {systemNavigation.map((item) => {
                const isActive = location === item.href;
                return (
                  <Link key={item.name} href={item.href}>
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      className={cn(
                        "w-full justify-start space-x-3",
                        isActive 
                          ? "bg-primary text-primary-foreground" 
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                      onClick={() => setIsMobileOpen(false)}
                      data-testid={`nav-${item.name.toLowerCase()}`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{item.name}</span>
                    </Button>
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
              <Users className="text-secondary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">Government User</p>
              <p className="text-xs text-muted-foreground truncate">Finance Administrator</p>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => window.location.href = "/api/logout"}
              data-testid="button-logout"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
