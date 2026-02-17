import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
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

  const { data: transactions, isLoading: txLoading } = useQuery({
    queryKey: ['transactions', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('transactions').select('*').eq('user_id', user.id)
        .order('created_at', { ascending: false }).limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: paymentRequests, isLoading: prLoading, refetch: refetchPR } = useQuery({
    queryKey: ['payment_requests', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('payment_requests').select('*').eq('user_id', user.id)
        .order('requested_at', { ascending: false }).limit(20);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const handleDeposit = async () => {
    if (!user || !depositAmount || !upiReference) return;
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount < 100) {
      toast({ variant: 'destructive', title: 'Invalid Amount', description: 'Minimum deposit is ₹100' });
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('payment_requests').insert({ user_id: user.id, type: 'deposit', amount, upi_reference: upiReference });
      if (error) throw error;
      toast({ title: 'Deposit Submitted ✓', description: 'Will be credited after verification.' });
      setDepositAmount(''); setUpiReference(''); refetchPR();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally { setIsSubmitting(false); }
  };

  const handleWithdraw = async () => {
    if (!user || !withdrawAmount || !upiId) return;
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount < 100) {
      toast({ variant: 'destructive', title: 'Invalid Amount', description: 'Minimum withdrawal is ₹100' });
      return;
    }
    if (amount > balance) {
      toast({ variant: 'destructive', title: 'Insufficient Balance' });
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('payment_requests').insert({ user_id: user.id, type: 'withdrawal', amount, upi_id: upiId });
      if (error) throw error;
      toast({ title: 'Withdrawal Submitted ✓', description: 'Will be processed within 24 hours.' });
      setWithdrawAmount(''); setUpiId(''); refetchPR();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally { setIsSubmitting(false); }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="outline" className="text-[10px] gap-0.5"><Clock className="w-2.5 h-2.5" /> Pending</Badge>;
      case 'approved': case 'completed': return <Badge className="bg-success text-[10px] gap-0.5"><CheckCircle className="w-2.5 h-2.5" /> Done</Badge>;
      case 'rejected': return <Badge variant="destructive" className="text-[10px] gap-0.5"><XCircle className="w-2.5 h-2.5" /> Rejected</Badge>;
      default: return <Badge variant="secondary" className="text-[10px]">{status}</Badge>;
    }
  };

  return (
    <Layout>
      <div className="px-4 py-5 pb-24">
        {/* Balance Card */}
        <div className="gradient-primary rounded-2xl p-5 mb-5 text-primary-foreground shadow-glow">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
              <Wallet className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm opacity-80 font-medium">Wallet Balance</p>
              <p className="text-3xl font-extrabold tabular-nums">₹{Number(balance).toFixed(0)}</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="deposit" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 h-10 rounded-xl">
            <TabsTrigger value="deposit" className="rounded-lg text-xs font-semibold">Deposit</TabsTrigger>
            <TabsTrigger value="withdraw" className="rounded-lg text-xs font-semibold">Withdraw</TabsTrigger>
            <TabsTrigger value="history" className="rounded-lg text-xs font-semibold">History</TabsTrigger>
          </TabsList>

          <TabsContent value="deposit">
            <div className="bg-card rounded-2xl border p-4 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Plus className="w-5 h-5 text-success" />
                <h3 className="font-bold">Add Money via UPI</h3>
              </div>
              <div className="p-3 bg-muted rounded-xl">
                <p className="text-xs font-medium text-muted-foreground mb-1">Pay to UPI ID</p>
                <p className="text-base font-mono font-bold">example@upi</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Amount (₹)</Label>
                <Input type="number" placeholder="Min ₹100" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} className="h-11 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">UTR / Reference Number</Label>
                <Input placeholder="12-digit UTR" value={upiReference} onChange={(e) => setUpiReference(e.target.value)} className="h-11 rounded-xl" />
              </div>
              <Button className="w-full h-12 rounded-2xl font-bold" onClick={handleDeposit} disabled={isSubmitting || !depositAmount || !upiReference}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Submit Deposit
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="withdraw">
            <div className="bg-card rounded-2xl border p-4 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Minus className="w-5 h-5 text-primary" />
                <h3 className="font-bold">Withdraw to UPI</h3>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Amount (₹)</Label>
                <Input type="number" placeholder="Min ₹100" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} className="h-11 rounded-xl" />
                <p className="text-[10px] text-muted-foreground">Available: ₹{Number(balance).toFixed(0)}</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Your UPI ID</Label>
                <Input placeholder="yourname@upi" value={upiId} onChange={(e) => setUpiId(e.target.value)} className="h-11 rounded-xl" />
              </div>
              <Button className="w-full h-12 rounded-2xl font-bold" onClick={handleWithdraw} disabled={isSubmitting || !withdrawAmount || !upiId}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Request Withdrawal
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="history">
            <div className="space-y-3">
              {/* Payment Requests */}
              {(paymentRequests?.length ?? 0) > 0 && (
                <div className="bg-card rounded-2xl border p-4">
                  <h3 className="font-bold text-sm mb-3">Payment Requests</h3>
                  <div className="space-y-2">
                    {paymentRequests?.map((pr) => (
                      <div key={pr.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                        <div className="flex items-center gap-3">
                          {pr.type === 'deposit' ? <ArrowDownRight className="w-4 h-4 text-success" /> : <ArrowUpRight className="w-4 h-4 text-primary" />}
                          <div>
                            <p className="font-semibold text-sm capitalize">{pr.type}</p>
                            <p className="text-[10px] text-muted-foreground">{format(new Date(pr.requested_at), 'MMM d, h:mm a')}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={cn("font-bold text-sm", pr.type === 'deposit' ? "text-success" : "")}>
                            {pr.type === 'deposit' ? '+' : '-'}₹{Number(pr.amount)}
                          </p>
                          {getStatusBadge(pr.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Transactions */}
              <div className="bg-card rounded-2xl border p-4">
                <h3 className="font-bold text-sm mb-3">Transactions</h3>
                {txLoading ? (
                  <div className="text-center py-8"><Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" /></div>
                ) : (transactions?.length ?? 0) === 0 ? (
                  <p className="text-center text-muted-foreground py-8 text-sm">No transactions yet</p>
                ) : (
                  <div className="space-y-2">
                    {transactions?.map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                        <div className="flex items-center gap-3">
                          {Number(tx.amount) > 0
                            ? <ArrowDownRight className="w-4 h-4 text-success" />
                            : <ArrowUpRight className="w-4 h-4 text-destructive" />}
                          <div className="min-w-0">
                            <p className="font-semibold text-sm truncate">{tx.description || tx.type.replace('_', ' ')}</p>
                            <p className="text-[10px] text-muted-foreground">{format(new Date(tx.created_at), 'MMM d, h:mm a')}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={cn("font-bold text-sm", Number(tx.amount) > 0 ? "text-success" : "text-destructive")}>
                            {Number(tx.amount) > 0 ? '+' : ''}₹{Math.abs(Number(tx.amount))}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
