import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from "@/lib/queryClient";
import { Shield, CheckCircle2, XCircle } from 'lucide-react';

export default function EmployeeVerificationForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    employeeId: '',
    lastName: '',
    dateOfBirth: ''
  });
  const [error, setError] = useState<string | null>(null);

  const verifyMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest('POST', '/api/employee/verify', data);
    },
    onSuccess: async (response) => {
      const data = await response.json();
      if (data.success) {
        toast({
          title: "Verification Successful",
          description: data.message,
          variant: "default",
        });
        // Invalidate queries to refresh dashboard
        queryClient.invalidateQueries({ queryKey: ['/api/employee/dashboard'] });
        queryClient.invalidateQueries({ queryKey: ['/api/employee/verification-status'] });
      }
    },
    onError: async (error: any) => {
      const errorMessage = error.message || "Verification failed";
      setError(errorMessage);
      toast({
        title: "Verification Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!formData.employeeId || !formData.lastName || !formData.dateOfBirth) {
      setError("Please fill in all required fields");
      return;
    }
    
    verifyMutation.mutate(formData);
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <Card className="border-2">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Shield className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">Employee Verification Required</CardTitle>
          <CardDescription>
            To access the employee portal, please verify your identity using the information from your HR department
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="employeeId">Employee ID</Label>
              <Input
                id="employeeId"
                type="text"
                placeholder="Enter your employee ID (e.g., EMP001)"
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                required
                data-testid="input-employee-id"
              />
              <p className="text-sm text-muted-foreground">
                Your unique employee identifier provided by HR
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                type="text"
                placeholder="Enter your last name"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
                data-testid="input-last-name"
              />
              <p className="text-sm text-muted-foreground">
                Must match exactly as it appears in HR records
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                required
                data-testid="input-date-of-birth"
              />
              <p className="text-sm text-muted-foreground">
                Format: MM/DD/YYYY
              </p>
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={verifyMutation.isPending}
              data-testid="button-verify"
            >
              {verifyMutation.isPending ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Verify My Identity
                </>
              )}
            </Button>
          </form>
          
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h3 className="font-semibold text-sm mb-2">Need Help?</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Contact your HR department if you don't have your employee ID</li>
              <li>• Ensure your information matches exactly as provided by HR</li>
              <li>• After 5 failed attempts, you'll need to contact HR to reset</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}