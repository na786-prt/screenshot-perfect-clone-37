import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Users, Ticket, Trophy, Wallet, Clock } from 'lucide-react';

export default function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [usersRes, lotteryRes, betsRes, pendingPayments] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact' }),
        supabase.from('lotteries').select('id', { count: 'exact' }).eq('is_active', true),
        supabase.from('bets').select('total_amount, status'),
        supabase.from('payment_requests').select('id', { count: 'exact' }).eq('status', 'pending'),
      ]);

      const bets = betsRes.data || [];
      const totalBetAmount = bets.reduce((sum, b) => sum + Number(b.total_amount), 0);
      const pendingBets = bets.filter(b => b.status === 'pending').length;

      return {
        totalUsers: usersRes.count || 0,
        activeLotteries: lotteryRes.count || 0,
        totalBets: bets.length,
        totalBetAmount,
        pendingBets,
        pendingPayments: pendingPayments.count || 0,
      };
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Lotteries</CardTitle>
            <Ticket className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeLotteries || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Bets</CardTitle>
            <Trophy className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalBets || 0}</div>
            <p className="text-xs text-muted-foreground">{stats?.pendingBets || 0} pending</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingPayments || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Total Bet Amount
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">₹{(stats?.totalBetAmount || 0).toFixed(2)}</div>
        </CardContent>
      </Card>
    </div>
  );
}
