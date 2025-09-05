import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building } from "lucide-react";
import { type Vendor } from "@shared/schema";

export default function TopVendors() {
  const { data: vendors, isLoading } = useQuery<Vendor[]>({
    queryKey: ["/api/analytics/top-vendors"],
    retry: false,
  });

  const getVendorIcon = (businessType?: string) => {
    // Return different icons based on business type in the future
    return <Building className="h-5 w-5 text-chart-1" />;
  };

  return (
    <Card className="border border-border shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground">Top Vendors by Spend</CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-sm text-primary hover:text-primary/80"
            data-testid="button-view-all-vendors"
          >
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : !vendors || vendors.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No vendor data available</p>
          </div>
        ) : (
          <div className="space-y-4">
            {vendors.slice(0, 4).map((vendor, index) => (
              <div key={vendor.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-chart-1/10 rounded-full flex items-center justify-center">
                    {getVendorIcon(vendor.businessType || undefined)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{vendor.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {vendor.businessType || "Business"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">
                    ${parseFloat(vendor.totalSpend || "0").toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-muted-foreground">YTD</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
