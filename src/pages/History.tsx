import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { History, Trophy, Clock, XCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function BetHistory() {
  const { user } = useAuth();

  const { data: bets, isLoading } = useQuery({
    queryKey: ['bets', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('bets')
        .select(`
          *,
          lotteries:lottery_id (name)
        `)
        .eq('user_id', user.id)
        .order('placed_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const pendingBets = bets?.filter(b => b.status === 'pending') || [];
  const wonBets = bets?.filter(b => b.status === 'won') || [];
  const lostBets = bets?.filter(b => b.status === 'lost') || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="gap-1"><Clock className="w-3 h-3" /> Pending</Badge>;
      case 'won':
        return <Badge className="bg-success gap-1"><Trophy className="w-3 h-3" /> Won</Badge>;
      case 'lost':
        return <Badge variant="secondary" className="gap-1"><XCircle className="w-3 h-3" /> Lost</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getBetTypeColor = (type: string) => {
    switch (type) {
      case 'single': return 'bg-lottery-single';
      case 'double': return 'bg-lottery-double';
      case 'triple': return 'bg-lottery-triple';
      default: return 'bg-primary';
    }
  };

  const BetList = ({ bets }: { bets: typeof pendingBets }) => (
    <div className="space-y-3">
      {bets.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No bets found</p>
      ) : (
        bets.map((bet) => (
          <Card key={bet.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={cn("text-white", getBetTypeColor(bet.bet_type))}>
                      {bet.bet_type.charAt(0).toUpperCase() + bet.bet_type.slice(1)}
                    </Badge>
                    {getStatusBadge(bet.status)}
                    {bet.is_box && <Badge variant="outline" className="text-lottery-box border-lottery-box">BOX</Badge>}
                  </div>
                  <p className="font-semibold text-lg">
                    {bet.position && `${bet.position}: `}
                    {bet.selected_number}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {bet.lotteries?.name} • {bet.quantity}x ₹{Number(bet.unit_price).toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(bet.placed_at), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Bet Amount</p>
                  <p className="font-semibold">₹{Number(bet.total_amount).toFixed(2)}</p>
                  {bet.status === 'won' && bet.win_amount && (
                    <>
                      <p className="text-sm text-success mt-1">Won</p>
                      <p className="font-bold text-success">₹{Number(bet.win_amount).toFixed(2)}</p>
                    </>
                  )}
                  {bet.status === 'pending' && (
                    <>
                      <p className="text-sm text-muted-foreground mt-1">Potential Win</p>
                      <p className="font-semibold text-primary">₹{Number(bet.potential_win_amount).toFixed(2)}</p>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-6 flex justify-center items-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-6 max-w-4xl">
        <div className="flex items-center gap-2 mb-6">
          <History className="w-6 h-6" />
          <h1 className="text-2xl font-bold">Bet History</h1>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{pendingBets.length}</p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
          <Card className="bg-success/10 border-success/30">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-success">{wonBets.length}</p>
              <p className="text-sm text-muted-foreground">Won</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-muted-foreground">{lostBets.length}</p>
              <p className="text-sm text-muted-foreground">Lost</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="all" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All ({bets?.length || 0})</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="won">Won</TabsTrigger>
            <TabsTrigger value="lost">Lost</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <BetList bets={bets || []} />
          </TabsContent>
          <TabsContent value="pending">
            <BetList bets={pendingBets} />
          </TabsContent>
          <TabsContent value="won">
            <BetList bets={wonBets} />
          </TabsContent>
          <TabsContent value="lost">
            <BetList bets={lostBets} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
