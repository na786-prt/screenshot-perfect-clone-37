import { Layout } from '@/components/layout/Layout';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Trophy, Clock, XCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function BetHistory() {
  const { user } = useAuth();

  const { data: bets, isLoading } = useQuery({
    queryKey: ['bets', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('bets')
        .select(`*, lotteries:lottery_id (name)`)
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
      case 'pending': return <Badge variant="outline" className="gap-1 text-[10px]"><Clock className="w-3 h-3" /> Pending</Badge>;
      case 'won': return <Badge className="bg-success gap-1 text-[10px]"><Trophy className="w-3 h-3" /> Won</Badge>;
      case 'lost': return <Badge variant="secondary" className="gap-1 text-[10px]"><XCircle className="w-3 h-3" /> Lost</Badge>;
      default: return <Badge>{status}</Badge>;
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
    <div className="space-y-2">
      {bets.length === 0 ? (
        <p className="text-center text-muted-foreground py-12 text-sm">No bets found</p>
      ) : (
        bets.map((bet) => (
          <div key={bet.id} className="bg-card rounded-2xl border p-4 animate-fade-in">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                  <Badge className={cn("text-white text-[10px]", getBetTypeColor(bet.bet_type))}>
                    {bet.bet_type.charAt(0).toUpperCase() + bet.bet_type.slice(1)}
                  </Badge>
                  {getStatusBadge(bet.status)}
                  {bet.is_box && <Badge variant="outline" className="text-lottery-box border-lottery-box text-[10px]">BOX</Badge>}
                </div>
                <p className="font-bold text-lg tabular-nums">
                  {bet.position && <span className="text-muted-foreground text-sm font-medium">{bet.position}: </span>}
                  {bet.selected_number}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {bet.lotteries?.name} · {bet.quantity}× ₹{Number(bet.unit_price)}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {format(new Date(bet.placed_at), 'MMM d, h:mm a')}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-muted-foreground">Amount</p>
                <p className="font-bold">₹{Number(bet.total_amount)}</p>
                {bet.status === 'won' && bet.win_amount && (
                  <p className="font-bold text-success text-sm mt-1">+₹{Number(bet.win_amount)}</p>
                )}
                {bet.status === 'pending' && (
                  <p className="text-xs text-primary mt-1">Win ₹{Number(bet.potential_win_amount)}</p>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="px-4 py-5 pb-24">
        <h1 className="text-2xl font-extrabold tracking-tight mb-1">Bet History</h1>
        <p className="text-sm text-muted-foreground mb-5">Track all your bets</p>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-2.5 mb-5">
          <div className="bg-card rounded-2xl border p-3 text-center">
            <p className="text-xl font-bold">{pendingBets.length}</p>
            <p className="text-[10px] text-muted-foreground font-medium">Pending</p>
          </div>
          <div className="bg-success/10 rounded-2xl border border-success/20 p-3 text-center">
            <p className="text-xl font-bold text-success">{wonBets.length}</p>
            <p className="text-[10px] text-muted-foreground font-medium">Won</p>
          </div>
          <div className="bg-card rounded-2xl border p-3 text-center">
            <p className="text-xl font-bold text-muted-foreground">{lostBets.length}</p>
            <p className="text-[10px] text-muted-foreground font-medium">Lost</p>
          </div>
        </div>

        <Tabs defaultValue="all" className="space-y-3">
          <TabsList className="grid w-full grid-cols-4 h-10 rounded-xl">
            <TabsTrigger value="all" className="rounded-lg text-xs">All</TabsTrigger>
            <TabsTrigger value="pending" className="rounded-lg text-xs">Pending</TabsTrigger>
            <TabsTrigger value="won" className="rounded-lg text-xs">Won</TabsTrigger>
            <TabsTrigger value="lost" className="rounded-lg text-xs">Lost</TabsTrigger>
          </TabsList>

          <TabsContent value="all"><BetList bets={bets || []} /></TabsContent>
          <TabsContent value="pending"><BetList bets={pendingBets} /></TabsContent>
          <TabsContent value="won"><BetList bets={wonBets} /></TabsContent>
          <TabsContent value="lost"><BetList bets={lostBets} /></TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
