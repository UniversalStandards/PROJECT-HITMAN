import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Bell } from "lucide-react";

export default function Header() {
  return (
    <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Financial Dashboard</h1>
          <p className="text-sm text-muted-foreground">City of Springfield</p>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        {/* Quick Actions */}
        <Button 
          className="bg-primary text-primary-foreground hover:bg-primary/90"
          data-testid="button-new-payment"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Payment
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className="relative text-muted-foreground hover:text-foreground"
          data-testid="button-notifications"
        >
          <Bell className="h-5 w-5" />
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-xs p-0"
          >
            3
          </Badge>
        </Button>
      </div>
    </header>
  );
}
