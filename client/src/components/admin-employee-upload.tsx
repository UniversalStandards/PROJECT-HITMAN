import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from "@/lib/queryClient";
import { Upload, Users, CheckCircle2, XCircle, FileSpreadsheet, Download } from 'lucide-react';

export default function AdminEmployeeUpload() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [csvContent, setCsvContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [uploadResult, setUploadResult] = useState<any>(null);

  // Fetch existing employees
  const { data: employees, isLoading } = useQuery({
    queryKey: ['/api/admin/employees'],
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (csvData: string) => {
      return apiRequest('POST', '/api/admin/employees/upload', { csvData });
    },
    onSuccess: async (response) => {
      const data = await response.json();
      setUploadResult(data);
      
      if (data.success > 0) {
        toast({
          title: "Upload Successful",
          description: data.message,
        });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/employees'] });
      }
      
      if (data.errors && data.errors.length > 0) {
        toast({
          title: "Upload Completed with Errors",
          description: `${data.success} employees uploaded successfully. ${data.errors.length} errors occurred.`,
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload employees",
        variant: "destructive",
      });
    }
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setCsvContent(content);
      };
      reader.readAsText(file);
    }
  };

  const handleUpload = () => {
    if (!csvContent) {
      toast({
        title: "No File Selected",
        description: "Please select a CSV file to upload",
        variant: "destructive",
      });
      return;
    }
    uploadMutation.mutate(csvContent);
  };

  const downloadTemplate = () => {
    const template = `employee_id,first_name,last_name,middle_name,date_of_birth,email,department,position,hire_date,employment_type,phone,ssn_last4,federal_grade,federal_step,clearance_level,veteran_status,gender,ethnicity,race
EMP001,John,A,Doe,01/15/1985,john.doe@gov.org,IT,Software Engineer,06/01/2020,full-time,555-0101,1234,GS-13,5,secret,true,male,not-hispanic-or-latino,white
EMP002,Jane,M,Smith,03/22/1990,jane.smith@gov.org,Finance,Accountant,09/15/2021,full-time,555-0102,5678,GS-11,3,confidential,false,female,hispanic-or-latino,asian
EMP003,Robert,,Johnson,11/08/1988,robert.j@gov.org,HR,HR Manager,03/01/2019,full-time,555-0103,9012,GS-14,7,top-secret,true,male,not-hispanic-or-latino,black`;
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'employee_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Employee Management</CardTitle>
          <CardDescription>
            Upload employee data and manage employee verification
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">Upload Employees</TabsTrigger>
              <TabsTrigger value="list">Employee List</TabsTrigger>
            </TabsList>
            
            <TabsContent value="upload" className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <div className="mb-4">
                  <label htmlFor="csv-upload" className="cursor-pointer">
                    <span className="text-primary hover:underline">Choose CSV file</span>
                    <input
                      id="csv-upload"
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={handleFileSelect}
                      data-testid="input-csv-file"
                    />
                  </label>
                  <p className="text-sm text-gray-500 mt-2">
                    {fileName ? `Selected: ${fileName}` : 'No file selected'}
                  </p>
                </div>
                
                <Button
                  onClick={handleUpload}
                  disabled={!csvContent || uploadMutation.isPending}
                  className="mb-4"
                  data-testid="button-upload"
                >
                  {uploadMutation.isPending ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Employees
                    </>
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={downloadTemplate}
                  className="ml-2"
                  data-testid="button-download-template"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Template
                </Button>
              </div>
              
              <Alert>
                <AlertDescription>
                  <strong>CSV Format Requirements:</strong>
                  <ul className="mt-2 text-sm list-disc list-inside">
                    <li><strong>Required:</strong> employee_id, first_name, last_name, date_of_birth, email, department, position, hire_date, employment_type</li>
                    <li><strong>Government Fields:</strong> federal_grade (GS-1 to GS-15), federal_step (1-10), clearance_level (none/confidential/secret/top-secret)</li>
                    <li><strong>Demographics:</strong> gender, ethnicity (hispanic-or-latino/not-hispanic-or-latino), race, citizenship_status</li>
                    <li><strong>Military:</strong> veteran_status (true/false), military_branch, military_rank, discharge_type</li>
                    <li><strong>Contact:</strong> phone, mobile_phone, work_phone, address, city, state, zip_code</li>
                    <li><strong>Other:</strong> ssn_last4, middle_name, suffix, occupational_series</li>
                    <li>Date format must be MM/DD/YYYY</li>
                  </ul>
                </AlertDescription>
              </Alert>
              
              {uploadResult && (
                <div className="space-y-4">
                  <Alert variant={uploadResult.errors?.length > 0 ? "destructive" : "default"}>
                    <AlertDescription>
                      <strong>Upload Result:</strong>
                      <p>{uploadResult.message}</p>
                    </AlertDescription>
                  </Alert>
                  
                  {uploadResult.errors?.length > 0 && (
                    <Alert variant="destructive">
                      <AlertDescription>
                        <strong>Errors:</strong>
                        <ul className="mt-2 text-sm list-disc list-inside">
                          {uploadResult.errors.map((error: string, index: number) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="list">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Position</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Verified</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(employees as any[])?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground">
                            No employees uploaded yet
                          </TableCell>
                        </TableRow>
                      ) : (
                        (employees as any[])?.map((employee: any) => (
                          <TableRow key={employee.id}>
                            <TableCell className="font-medium">{employee.employeeId}</TableCell>
                            <TableCell>{employee.firstName} {employee.lastName}</TableCell>
                            <TableCell>{employee.department}</TableCell>
                            <TableCell>{employee.position}</TableCell>
                            <TableCell>{employee.email}</TableCell>
                            <TableCell>
                              <Badge variant={employee.employmentStatus === 'active' ? 'default' : 'secondary'}>
                                {employee.employmentStatus}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {employee.isVerified ? (
                                <Badge variant="default">
                                  <CheckCircle2 className="mr-1 h-3 w-3" />
                                  Verified
                                </Badge>
                              ) : (
                                <Badge variant="outline">
                                  <XCircle className="mr-1 h-3 w-3" />
                                  Not Verified
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}