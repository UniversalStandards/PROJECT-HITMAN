import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Plus, FileText, AlertTriangle } from "lucide-react";

export default function RecentActivity() {
  const { data: activity, isLoading } = useQuery({
    queryKey: ["/api/analytics/recent-activity"],
    retry: false,
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "payment":
        return <CheckCircle className="h-4 w-4 text-chart-2" />;
      case "vendor":
        return <Plus className="h-4 w-4 text-chart-1" />;
      case "expense":
        return <FileText className="h-4 w-4 text-chart-3" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
    }
  };

  const getActivityDescription = (item: any) => {
    switch (item.type) {
      case "payment":
        return `Payment processed: ${item.description}`;
      case "vendor":
        return `New vendor registered: ${item.description}`;
      case "expense":
        return `Expense report submitted: ${item.description}`;
      default:
        return item.description;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      return "Less than an hour ago";
    }
  };

  return (
    <Card className="border border-border shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : !activity || (activity as Activity[])?.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-4">
            {(activity as any[])?.slice(0, 4).map((item: any, index: number) => (
              <div key={item.id || index} className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-chart-2/10 rounded-full flex items-center justify-center flex-shrink-0">
                  {getActivityIcon(item.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">{getActivityDescription(item)}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.amount && `$${parseFloat(item.amount).toLocaleString()} • `}
                    {formatTimeAgo(item.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
        <Button 
          variant="ghost" 
          className="w-full mt-4 text-sm text-primary hover:text-primary/80"
          data-testid="button-view-all-activity"
        >
          View All Activity
        </Button>
      </CardContent>
    </Card>
  );
}
