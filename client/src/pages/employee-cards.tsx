import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import Sidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';
import { CreditCard, Lock, Unlock, AlertCircle, Shield, Activity, DollarSign, Calendar } from 'lucide-react';

export default function EmployeeCards() {
  const { toast } = useToast();
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [isPinDialog, setPinDialog] = useState(false);
  const [pin, setPin] = useState('');

  // Fetch employee's cards
  const { data: myCards, isLoading } = useQuery({
    queryKey: ['/api/employee/cards'],
  });

  // Fetch spending summary
  const { data: spendingSummary } = useQuery({
    queryKey: ['/api/employee/spending-summary'],
  });

  // Toggle card status mutation
  const toggleCardMutation = useMutation({
    mutationFn: async ({ cardId, action }: { cardId: string; action: 'freeze' | 'unfreeze' }) => {
      return apiRequest('PATCH', `/api/employee/cards/${cardId}/${action}`, {});
    },
    onSuccess: async (response, variables) => {
      toast({
        title: variables.action === 'freeze' ? "Card Temporarily Locked" : "Card Activated",
        description: `Your card has been ${variables.action === 'freeze' ? 'temporarily locked for security' : 'reactivated'}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/employee/cards'] });
    },
  });

  // Report lost/stolen card
  const reportCardMutation = useMutation({
    mutationFn: async ({ cardId, reason }: { cardId: string; reason: string }) => {
      return apiRequest('POST', `/api/employee/cards/${cardId}/report`, { reason });
    },
    onSuccess: () => {
      toast({
        title: "Card Reported",
        description: "Your card has been reported and permanently deactivated. A replacement will be issued.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/employee/cards'] });
    },
  });

  // Set PIN mutation
  const setPinMutation = useMutation({
    mutationFn: async ({ cardId, pin }: { cardId: string; pin: string }) => {
      return apiRequest('POST', `/api/employee/cards/${cardId}/pin`, { pin });
    },
    onSuccess: () => {
      toast({
        title: "PIN Set Successfully",
        description: "Your card PIN has been updated",
      });
      setPinDialog(false);
      setPin('');
    },
  });

  const formatCardNumber = (number: string) => {
    return number.replace(/(.{4})/g, '$1 ').trim();
  };

  const getCardStatus = (status: string) => {
    switch (status) {
      case 'active':
        return { label: 'Active', variant: 'default' as const, icon: <Activity className="w-3 h-3" /> };
      case 'frozen':
        return { label: 'Temporarily Locked', variant: 'secondary' as const, icon: <Lock className="w-3 h-3" /> };
      case 'cancelled':
        return { label: 'Cancelled', variant: 'destructive' as const, icon: <AlertCircle className="w-3 h-3" /> };
      default:
        return { label: status, variant: 'outline' as const, icon: null };
    }
  };

  return (
    <div className="flex h-screen bg-muted/30" data-testid="employee-cards">
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">My Corporate Cards</h1>
            <p className="text-muted-foreground mt-1">Manage your issued corporate cards and view spending</p>
          </div>

          {/* Spending Overview */}
          {spendingSummary && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Current Month Spending</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${spendingSummary.currentMonth || '0.00'}</div>
                  <p className="text-xs text-muted-foreground">
                    Limit: ${spendingSummary.monthlyLimit || 'No limit'}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Available Balance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    ${spendingSummary.available || '0.00'}
                  </div>
                  <p className="text-xs text-muted-foreground">Across all active cards</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Pending Transactions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${spendingSummary.pending || '0.00'}</div>
                  <p className="text-xs text-muted-foreground">Awaiting settlement</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Active Cards</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{myCards?.filter((c: any) => c.status === 'active').length || 0}</div>
                  <p className="text-xs text-muted-foreground">Total: {myCards?.length || 0} cards</p>
                </CardContent>
              </Card>
            </div>
          )}

          <Tabs defaultValue="cards">
            <TabsList>
              <TabsTrigger value="cards" data-testid="tab-cards">My Cards</TabsTrigger>
              <TabsTrigger value="transactions" data-testid="tab-transactions">Transactions</TabsTrigger>
              <TabsTrigger value="security" data-testid="tab-security">Security</TabsTrigger>
            </TabsList>

            <TabsContent value="cards" className="space-y-4">
              {/* Virtual Cards Display */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {isLoading ? (
                  <Card className="p-8">
                    <div className="text-center text-muted-foreground">Loading cards...</div>
                  </Card>
                ) : myCards?.length === 0 ? (
                  <Card className="p-8">
                    <div className="text-center">
                      <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">No cards issued to your account</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Contact your administrator to request a corporate card
                      </p>
                    </div>
                  </Card>
                ) : (
                  myCards?.map((card: any) => {
                    const status = getCardStatus(card.status);
                    return (
                      <Card key={card.id} className="relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-primary/5 rounded-bl-full" />
                        
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg">
                                {card.cardType === 'virtual' ? 'Virtual Card' : 'Physical Card'}
                              </CardTitle>
                              <CardDescription>{card.department} Department</CardDescription>
                            </div>
                            <Badge variant={status.variant} className="flex items-center gap-1">
                              {status.icon}
                              {status.label}
                            </Badge>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="space-y-4">
                          <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-4 rounded-lg">
                            <div className="flex justify-between items-center mb-6">
                              <CreditCard className="w-8 h-8" />
                              <span className="text-xs opacity-75">{card.cardType.toUpperCase()}</span>
                            </div>
                            <div className="font-mono text-lg mb-4">
                              {formatCardNumber(card.cardNumber || '**** **** **** ' + (card.lastFour || '0000'))}
                            </div>
                            <div className="flex justify-between text-sm">
                              <div>
                                <span className="opacity-75">Valid Thru</span>
                                <div>{card.expiryDate || '12/25'}</div>
                              </div>
                              <div className="text-right">
                                <span className="opacity-75">CVV</span>
                                <div>***</div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Spending Limit</span>
                              <span className="font-medium">${card.spendingLimit}/{card.limitPeriod}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Current Spending</span>
                              <span className="font-medium">${card.currentSpending || '0.00'}</span>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            {card.status === 'active' ? (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex-1"
                                onClick={() => toggleCardMutation.mutate({ cardId: card.id, action: 'freeze' })}
                                data-testid={`button-freeze-${card.id}`}
                              >
                                <Lock className="w-4 h-4 mr-1" />
                                Lock Card
                              </Button>
                            ) : card.status === 'frozen' ? (
                              <Button 
                                variant="default" 
                                size="sm" 
                                className="flex-1"
                                onClick={() => toggleCardMutation.mutate({ cardId: card.id, action: 'unfreeze' })}
                                data-testid={`button-unfreeze-${card.id}`}
                              >
                                <Unlock className="w-4 h-4 mr-1" />
                                Unlock Card
                              </Button>
                            ) : null}
                            
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedCard(card);
                                setPinDialog(true);
                              }}
                              disabled={card.status !== 'active'}
                              data-testid={`button-pin-${card.id}`}
                            >
                              Set PIN
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </TabsContent>

            <TabsContent value="transactions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Transactions</CardTitle>
                  <CardDescription>Your card transaction history</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Transaction history will appear here</p>
                    <p className="text-sm mt-1">Make a purchase to see your transactions</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="space-y-4">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Keep your card information secure. Never share your card details, PIN, or CVV with anyone.
                  Report any suspicious activity immediately.
                </AlertDescription>
              </Alert>

              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>Manage your card security preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Report Lost or Stolen Card</h4>
                    <p className="text-sm text-muted-foreground">
                      If your card is lost or stolen, report it immediately to prevent unauthorized use.
                    </p>
                    {myCards?.filter((c: any) => c.status === 'active').map((card: any) => (
                      <div key={card.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <span className="text-sm">Card ending in {card.lastFour || '0000'}</span>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => reportCardMutation.mutate({ 
                            cardId: card.id, 
                            reason: 'lost_stolen' 
                          })}
                          data-testid={`button-report-${card.id}`}
                        >
                          Report Lost/Stolen
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Fraud Alert</h4>
                    <p className="text-sm text-muted-foreground">
                      If you notice any unauthorized transactions, contact security immediately at:
                    </p>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="font-mono text-sm">1-800-SEC-DEPT</p>
                      <p className="text-sm text-muted-foreground">Available 24/7</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Set PIN Dialog */}
          <Dialog open={isPinDialog} onOpenChange={setPinDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Set Card PIN</DialogTitle>
                <DialogDescription>
                  Set a 4-digit PIN for your card. This will be required for certain transactions.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="pin">Enter 4-digit PIN</Label>
                  <Input
                    id="pin"
                    type="password"
                    maxLength={4}
                    pattern="[0-9]{4}"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="****"
                    data-testid="input-pin"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setPinDialog(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (pin.length === 4 && selectedCard) {
                      setPinMutation.mutate({ cardId: selectedCard.id, pin });
                    } else {
                      toast({
                        title: "Invalid PIN",
                        description: "Please enter a 4-digit PIN",
                        variant: "destructive",
                      });
                    }
                  }}
                  disabled={pin.length !== 4}
                  data-testid="button-set-pin"
                >
                  Set PIN
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}