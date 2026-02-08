import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Loader2, TrendingUp, TrendingDown, Wallet, Trophy, CreditCard } from 'lucide-react';

export default function AdminReports() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-reports'],
    queryFn: async () => {
      const [betsRes, paymentsRes, transactionsRes] = await Promise.all([
        supabase.from('bets').select('*'),
        supabase.from('payment_requests').select('*').eq('status', 'approved'),
        supabase.from('transactions').select('*'),
      ]);

      const bets = betsRes.data || [];
      const payments = paymentsRes.data || [];
      const transactions = transactionsRes.data || [];

      const totalBetAmount = bets.reduce((sum, b) => sum + Number(b.total_amount), 0);
      const totalWinAmount = bets
        .filter(b => b.status === 'won')
        .reduce((sum, b) => sum + Number(b.win_amount), 0);

      const totalDeposits = payments
        .filter(p => p.type === 'deposit')
        .reduce((sum, p) => sum + Number(p.amount), 0);

      const totalWithdrawals = payments
        .filter(p => p.type === 'withdrawal')
        .reduce((sum, p) => sum + Number(p.amount), 0);

      const profit = totalBetAmount - totalWinAmount;

      return {
        totalBetAmount,
        totalWinAmount,
        totalDeposits,
        totalWithdrawals,
        profit,
        totalBets: bets.length,
        wonBets: bets.filter(b => b.status === 'won').length,
        lostBets: bets.filter(b => b.status === 'lost').length,
        pendingBets: bets.filter(b => b.status === 'pending').length,
      };
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Reports</h1>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Bets</CardTitle>
            <Trophy className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{(stats?.totalBetAmount || 0).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.totalBets || 0} bets placed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Payouts</CardTitle>
            <TrendingDown className="w-4 h-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">₹{(stats?.totalWinAmount || 0).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.wonBets || 0} winning bets
            </p>
          </CardContent>
        </Card>

        <Card className={stats?.profit && stats.profit > 0 ? 'bg-success/10 border-success/30' : 'bg-destructive/10 border-destructive/30'}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <TrendingUp className={`w-4 h-4 ${stats?.profit && stats.profit > 0 ? 'text-success' : 'text-destructive'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats?.profit && stats.profit > 0 ? 'text-success' : 'text-destructive'}`}>
              ₹{(stats?.profit || 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Bets - Payouts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Bets</CardTitle>
            <CreditCard className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingBets || 0}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting results
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-success" />
              Total Deposits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">₹{(stats?.totalDeposits || 0).toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-primary" />
              Total Withdrawals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">₹{(stats?.totalWithdrawals || 0).toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Bet Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Bet Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-3xl font-bold">{stats?.totalBets || 0}</p>
              <p className="text-sm text-muted-foreground">Total Bets</p>
            </div>
            <div className="p-4 bg-success/10 rounded-lg">
              <p className="text-3xl font-bold text-success">{stats?.wonBets || 0}</p>
              <p className="text-sm text-muted-foreground">Won</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-3xl font-bold text-muted-foreground">{stats?.lostBets || 0}</p>
              <p className="text-sm text-muted-foreground">Lost</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
