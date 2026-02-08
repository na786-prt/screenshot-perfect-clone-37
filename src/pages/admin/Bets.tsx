import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminBets() {
  const { data: bets, isLoading } = useQuery({
    queryKey: ['admin-all-bets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bets')
        .select(`
          *,
          lotteries:lottery_id (name)
        `)
        .order('placed_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      case 'won':
        return <Badge className="bg-success">Won</Badge>;
      case 'lost':
        return <Badge variant="secondary">Lost</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">All Bets</h1>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : bets?.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No bets found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lottery</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Number</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Win</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bets?.map((bet) => (
                  <TableRow key={bet.id}>
                    <TableCell>{bet.lotteries?.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {bet.bet_type}
                        {bet.is_box && ' BOX'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono">
                      {bet.position && `${bet.position}: `}
                      {bet.selected_number}
                    </TableCell>
                    <TableCell>₹{Number(bet.total_amount).toFixed(2)}</TableCell>
                    <TableCell className={cn(bet.status === 'won' && 'text-success font-semibold')}>
                      {bet.status === 'won' ? `₹${Number(bet.win_amount).toFixed(2)}` : '-'}
                    </TableCell>
                    <TableCell>{getStatusBadge(bet.status)}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(bet.placed_at), 'MMM d, h:mm a')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
