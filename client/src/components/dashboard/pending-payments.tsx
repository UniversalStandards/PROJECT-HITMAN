import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { type Payment } from "@shared/schema";

export default function PendingPayments() {
  const { data: payments, isLoading } = useQuery<Payment[]>({
    queryKey: ["/api/payments/pending"],
    retry: false,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      default:
        return "bg-red-100 text-red-800";
    }
  };

  return (
    <Card className="border border-border shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground">Pending Payments</CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-sm text-primary hover:text-primary/80"
            data-testid="button-view-all-payments"
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
        ) : !payments || payments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No pending payments</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Description
                  </TableHead>
                  <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Amount
                  </TableHead>
                  <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Due Date
                  </TableHead>
                  <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.slice(0, 3).map((payment) => (
                  <TableRow key={payment.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div>
                        <div className="text-sm font-medium text-foreground">
                          {payment.description || "Payment"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {payment.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-foreground">
                      ${parseFloat(payment.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-sm text-foreground">
                      {payment.dueDate ? new Date(payment.dueDate).toLocaleDateString() : "N/A"}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(payment.status || 'pending')}>
                        {payment.status ? payment.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Pending'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
