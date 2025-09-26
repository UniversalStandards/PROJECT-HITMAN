import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import Sidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';
import { CreditCard, Plus, Lock, Unlock, DollarSign, Calendar, User, AlertCircle } from 'lucide-react';

export default function CardManagement() {
  const { toast } = useToast();
  const [isIssueDialogOpen, setIsIssueDialogOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<any>(null);
  
  // Form state for new card
  const [cardForm, setCardForm] = useState({
    holderName: '',
    employeeId: '',
    cardType: 'virtual',
    spendingLimit: '',
    limitPeriod: 'monthly',
    department: '',
  });

  // Fetch issued cards
  const { data: cards, isLoading } = useQuery({
    queryKey: ['/api/cards'],
  });

  // Issue new card mutation
  const issueCardMutation = useMutation({
    mutationFn: async (cardData: any) => {
      return apiRequest('POST', '/api/cards/issue', cardData);
    },
    onSuccess: async (response) => {
      const data = await response.json();
      toast({
        title: "Card Issued Successfully",
        description: `Virtual card issued to ${cardForm.holderName}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/cards'] });
      setIsIssueDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Card Issuance Failed",
        description: error.message || "Failed to issue card",
        variant: "destructive",
      });
    }
  });

  // Freeze/Unfreeze card mutation
  const toggleCardMutation = useMutation({
    mutationFn: async ({ cardId, action }: { cardId: string; action: 'freeze' | 'unfreeze' }) => {
      return apiRequest('PATCH', `/api/cards/${cardId}/${action}`, {});
    },
    onSuccess: async (response, variables) => {
      toast({
        title: variables.action === 'freeze' ? "Card Frozen" : "Card Activated",
        description: `Card has been ${variables.action === 'freeze' ? 'frozen' : 'activated'} successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/cards'] });
    },
  });

  const resetForm = () => {
    setCardForm({
      holderName: '',
      employeeId: '',
      cardType: 'virtual',
      spendingLimit: '',
      limitPeriod: 'monthly',
      department: '',
    });
  };

  const handleIssueCard = () => {
    issueCardMutation.mutate({
      ...cardForm,
      spendingLimit: parseFloat(cardForm.spendingLimit),
    });
  };

  const formatCardNumber = (number: string) => {
    // Format as XXXX-XXXX-XXXX-1234
    if (number.includes('*')) return number;
    const last4 = number.slice(-4);
    return `****-****-****-${last4}`;
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Digital Card Management</h1>
            <p className="text-muted-foreground">Issue and manage virtual payment cards for employees</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Cards</p>
                    <p className="text-2xl font-bold">{cards?.filter((c: any) => c.status === 'active').length || 0}</p>
                  </div>
                  <CreditCard className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Spend (Month)</p>
                    <p className="text-2xl font-bold">$45,230</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Frozen Cards</p>
                    <p className="text-2xl font-bold">{cards?.filter((c: any) => c.status === 'frozen').length || 0}</p>
                  </div>
                  <Lock className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pending Approval</p>
                    <p className="text-2xl font-bold">{cards?.filter((c: any) => c.status === 'pending').length || 0}</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="active" className="space-y-4">
            <div className="flex justify-between items-center">
              <TabsList>
                <TabsTrigger value="active">Active Cards</TabsTrigger>
                <TabsTrigger value="frozen">Frozen Cards</TabsTrigger>
                <TabsTrigger value="all">All Cards</TabsTrigger>
              </TabsList>
              
              <Dialog open={isIssueDialogOpen} onOpenChange={setIsIssueDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary" data-testid="button-issue-card">
                    <Plus className="mr-2 h-4 w-4" />
                    Issue New Card
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Issue Virtual Card</DialogTitle>
                    <DialogDescription>
                      Create a new virtual payment card with spending controls
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="holder">Cardholder Name</Label>
                      <Input
                        id="holder"
                        value={cardForm.holderName}
                        onChange={(e) => setCardForm({...cardForm, holderName: e.target.value})}
                        placeholder="John Doe"
                        data-testid="input-holder-name"
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="employee">Employee ID</Label>
                      <Input
                        id="employee"
                        value={cardForm.employeeId}
                        onChange={(e) => setCardForm({...cardForm, employeeId: e.target.value})}
                        placeholder="EMP001"
                        data-testid="input-employee-id"
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="type">Card Type</Label>
                      <Select value={cardForm.cardType} onValueChange={(v) => setCardForm({...cardForm, cardType: v})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="virtual">Virtual Card</SelectItem>
                          <SelectItem value="physical">Physical Card</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="limit">Spending Limit</Label>
                        <Input
                          id="limit"
                          type="number"
                          value={cardForm.spendingLimit}
                          onChange={(e) => setCardForm({...cardForm, spendingLimit: e.target.value})}
                          placeholder="5000"
                          data-testid="input-spending-limit"
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="period">Limit Period</Label>
                        <Select value={cardForm.limitPeriod} onValueChange={(v) => setCardForm({...cardForm, limitPeriod: v})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="per_transaction">Per Transaction</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="department">Department</Label>
                      <Input
                        id="department"
                        value={cardForm.department}
                        onChange={(e) => setCardForm({...cardForm, department: e.target.value})}
                        placeholder="Finance"
                        data-testid="input-department"
                      />
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsIssueDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleIssueCard}
                      disabled={issueCardMutation.isPending}
                      data-testid="button-confirm-issue"
                    >
                      {issueCardMutation.isPending ? "Issuing..." : "Issue Card"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            
            <TabsContent value="active" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Active Virtual Cards</CardTitle>
                  <CardDescription>Currently active cards with spending capabilities</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Card Number</TableHead>
                          <TableHead>Holder</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Spending Limit</TableHead>
                          <TableHead>Current Spend</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cards?.filter((card: any) => card.status === 'active').map((card: any) => (
                          <TableRow key={card.id}>
                            <TableCell className="font-mono">{formatCardNumber(card.cardNumber)}</TableCell>
                            <TableCell>{card.holderName}</TableCell>
                            <TableCell>{card.department}</TableCell>
                            <TableCell>${card.spendingLimit?.toLocaleString()}</TableCell>
                            <TableCell>${card.currentSpend?.toLocaleString() || '0'}</TableCell>
                            <TableCell>
                              <Badge variant="default">Active</Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => toggleCardMutation.mutate({ cardId: card.id, action: 'freeze' })}
                                data-testid={`button-freeze-${card.id}`}
                              >
                                <Lock className="h-4 w-4 mr-1" />
                                Freeze
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {(!cards || cards.filter((c: any) => c.status === 'active').length === 0) && (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center text-muted-foreground">
                              No active cards found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="frozen" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Frozen Cards</CardTitle>
                  <CardDescription>Cards temporarily suspended from use</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Card Number</TableHead>
                        <TableHead>Holder</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Frozen Date</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cards?.filter((card: any) => card.status === 'frozen').map((card: any) => (
                        <TableRow key={card.id}>
                          <TableCell className="font-mono">{formatCardNumber(card.cardNumber)}</TableCell>
                          <TableCell>{card.holderName}</TableCell>
                          <TableCell>{card.department}</TableCell>
                          <TableCell>{new Date(card.frozenAt).toLocaleDateString()}</TableCell>
                          <TableCell>{card.freezeReason || 'Manual freeze'}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toggleCardMutation.mutate({ cardId: card.id, action: 'unfreeze' })}
                              data-testid={`button-unfreeze-${card.id}`}
                            >
                              <Unlock className="h-4 w-4 mr-1" />
                              Unfreeze
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {(!cards || cards.filter((c: any) => c.status === 'frozen').length === 0) && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground">
                            No frozen cards
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="all" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>All Cards</CardTitle>
                  <CardDescription>Complete list of issued cards</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Card Number</TableHead>
                        <TableHead>Holder</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Issued Date</TableHead>
                        <TableHead>Expiry</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cards?.map((card: any) => (
                        <TableRow key={card.id}>
                          <TableCell className="font-mono">{formatCardNumber(card.cardNumber)}</TableCell>
                          <TableCell>{card.holderName}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{card.cardType}</Badge>
                          </TableCell>
                          <TableCell>{card.department}</TableCell>
                          <TableCell>{new Date(card.issuedAt).toLocaleDateString()}</TableCell>
                          <TableCell>{card.expiryDate}</TableCell>
                          <TableCell>
                            <Badge variant={card.status === 'active' ? 'default' : 'secondary'}>
                              {card.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                      {!cards || cards.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground">
                            No cards issued yet
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}