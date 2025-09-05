import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, CreditCard, Building, Clock } from "lucide-react";

export default function StatsCards() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/analytics/stats"],
    retry: false,
  });

  const statsCards = [
    {
      title: "Total Budget",
      value: stats ? `$${parseFloat(stats.totalBudget || "0").toLocaleString()}` : "$0",
      change: "+12.5%",
      changeLabel: "from last month",
      icon: DollarSign,
      iconBg: "bg-chart-1/10",
      iconColor: "text-chart-1",
      changeColor: "text-chart-2",
    },
    {
      title: "Monthly Expenses",
      value: stats ? `$${parseFloat(stats.monthlyExpenses || "0").toLocaleString()}` : "$0",
      change: "-3.2%",
      changeLabel: "from last month",
      icon: CreditCard,
      iconBg: "bg-chart-3/10",
      iconColor: "text-chart-3",
      changeColor: "text-chart-3",
    },
    {
      title: "Active Vendors",
      value: stats ? stats.activeVendors.toString() : "0",
      change: "+8",
      changeLabel: "this month",
      icon: Building,
      iconBg: "bg-chart-2/10",
      iconColor: "text-chart-2",
      changeColor: "text-chart-2",
    },
    {
      title: "Pending Payments",
      value: stats ? stats.pendingPayments.toString() : "0",
      change: "$45.2K total",
      changeLabel: "",
      icon: Clock,
      iconBg: "bg-destructive/10",
      iconColor: "text-destructive",
      changeColor: "text-destructive",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statsCards.map((card, index) => (
        <Card key={index} className="border border-border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                <p className="text-3xl font-bold text-foreground">
                  {isLoading ? "..." : card.value}
                </p>
                <p className={`text-sm flex items-center mt-1 ${card.changeColor}`}>
                  <span>{card.change}</span>
                  {card.changeLabel && (
                    <span className="text-muted-foreground ml-1">{card.changeLabel}</span>
                  )}
                </p>
              </div>
              <div className={`w-12 h-12 ${card.iconBg} rounded-full flex items-center justify-center`}>
                <card.icon className={`h-6 w-6 ${card.iconColor}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
