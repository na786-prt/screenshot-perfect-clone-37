import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useWallet } from '@/hooks/useWallet';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Wallet, Plus, Minus, ArrowUpRight, ArrowDownRight, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function WalletPage() {
  const { user } = useAuth();
  const { balance, refetch: refetchWallet } = useWallet();
  const { toast } = useToast();
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [upiReference, setUpiReference] = useState('');
  const [upiId, setUpiId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch transactions
  const { data: transactions, isLoading: txLoading } = useQuery({
    queryKey: ['transactions', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch payment requests
  const { data: paymentRequests, isLoading: prLoading, refetch: refetchPR } = useQuery({
    queryKey: ['payment_requests', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('payment_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('requested_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const handleDeposit = async () => {
    if (!user || !depositAmount || !upiReference) return;

    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount < 100) {
      toast({
        variant: 'destructive',
        title: 'Invalid Amount',
        description: 'Minimum deposit is ₹100',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('payment_requests')
        .insert({
          user_id: user.id,
          type: 'deposit',
          amount,
          upi_reference: upiReference,
        });

      if (error) throw error;

      toast({
        title: 'Deposit Request Submitted',
        description: 'Your deposit will be credited after admin verification.',
      });

      setDepositAmount('');
      setUpiReference('');
      refetchPR();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWithdraw = async () => {
    if (!user || !withdrawAmount || !upiId) return;

    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount < 100) {
      toast({
        variant: 'destructive',
        title: 'Invalid Amount',
        description: 'Minimum withdrawal is ₹100',
      });
      return;
    }

    if (amount > balance) {
      toast({
        variant: 'destructive',
        title: 'Insufficient Balance',
        description: 'You cannot withdraw more than your current balance.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('payment_requests')
        .insert({
          user_id: user.id,
          type: 'withdrawal',
          amount,
          upi_id: upiId,
        });

      if (error) throw error;

      toast({
        title: 'Withdrawal Request Submitted',
        description: 'Your withdrawal will be processed within 24 hours.',
      });

      setWithdrawAmount('');
      setUpiId('');
      refetchPR();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="gap-1"><Clock className="w-3 h-3" /> Pending</Badge>;
      case 'approved':
      case 'completed':
        return <Badge className="bg-success gap-1"><CheckCircle className="w-3 h-3" /> Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" /> Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTransactionIcon = (type: string, amount: number) => {
    if (type === 'deposit' || type === 'bet_won' || type === 'bet_refund') {
      return <ArrowDownRight className="w-5 h-5 text-success" />;
    }
    return <ArrowUpRight className="w-5 h-5 text-destructive" />;
  };

  return (
    <Layout>
      <div className="container py-6 max-w-4xl">
        {/* Balance Card */}
        <Card className="mb-6 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                <Wallet className="w-7 h-7" />
              </div>
              <div>
                <p className="text-sm opacity-80">Wallet Balance</p>
                <p className="text-3xl font-bold">₹{Number(balance).toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="deposit" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="deposit">Deposit</TabsTrigger>
            <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="deposit">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5 text-success" />
                  Add Money via UPI
                </CardTitle>
                <CardDescription>
                  Make a UPI payment and submit the reference number for verification
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-2">UPI Payment Details</p>
                  <p className="text-lg font-mono">example@upi</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Pay to this UPI ID and enter the UTR/Reference number below
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Amount (₹)</Label>
                  <Input
                    type="number"
                    placeholder="Enter amount (min ₹100)"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    min={100}
                  />
                </div>

                <div className="space-y-2">
                  <Label>UPI Reference / UTR Number</Label>
                  <Input
                    placeholder="Enter 12-digit UTR number"
                    value={upiReference}
                    onChange={(e) => setUpiReference(e.target.value)}
                  />
                </div>

                <Button 
                  className="w-full" 
                  onClick={handleDeposit}
                  disabled={isSubmitting || !depositAmount || !upiReference}
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Submit Deposit Request
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="withdraw">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Minus className="w-5 h-5 text-primary" />
                  Withdraw to UPI
                </CardTitle>
                <CardDescription>
                  Request a withdrawal to your UPI ID
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Amount (₹)</Label>
                  <Input
                    type="number"
                    placeholder="Enter amount (min ₹100)"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    min={100}
                    max={balance}
                  />
                  <p className="text-xs text-muted-foreground">
                    Available: ₹{Number(balance).toFixed(2)}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Your UPI ID</Label>
                  <Input
                    placeholder="yourname@upi"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                  />
                </div>

                <Button 
                  className="w-full" 
                  onClick={handleWithdraw}
                  disabled={isSubmitting || !withdrawAmount || !upiId}
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Request Withdrawal
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <div className="space-y-4">
              {/* Payment Requests */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  {prLoading ? (
                    <div className="text-center py-4">Loading...</div>
                  ) : paymentRequests?.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">No payment requests yet</p>
                  ) : (
                    <div className="space-y-3">
                      {paymentRequests?.map((pr) => (
                        <div key={pr.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            {pr.type === 'deposit' ? (
                              <ArrowDownRight className="w-5 h-5 text-success" />
                            ) : (
                              <ArrowUpRight className="w-5 h-5 text-primary" />
                            )}
                            <div>
                              <p className="font-medium capitalize">{pr.type}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(pr.requested_at), 'MMM d, h:mm a')}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={cn(
                              "font-semibold",
                              pr.type === 'deposit' ? "text-success" : ""
                            )}>
                              {pr.type === 'deposit' ? '+' : '-'}₹{Number(pr.amount).toFixed(2)}
                            </p>
                            {getStatusBadge(pr.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Transaction History */}
              <Card>
                <CardHeader>
                  <CardTitle>Transaction History</CardTitle>
                </CardHeader>
                <CardContent>
                  {txLoading ? (
                    <div className="text-center py-4">Loading...</div>
                  ) : transactions?.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">No transactions yet</p>
                  ) : (
                    <div className="space-y-3">
                      {transactions?.map((tx) => (
                        <div key={tx.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            {getTransactionIcon(tx.type, Number(tx.amount))}
                            <div>
                              <p className="font-medium">{tx.description || tx.type.replace('_', ' ')}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(tx.created_at), 'MMM d, h:mm a')}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={cn(
                              "font-semibold",
                              Number(tx.amount) > 0 ? "text-success" : "text-destructive"
                            )}>
                              {Number(tx.amount) > 0 ? '+' : ''}₹{Math.abs(Number(tx.amount)).toFixed(2)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Bal: ₹{Number(tx.balance_after).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
