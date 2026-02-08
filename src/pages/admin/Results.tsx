import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Trophy, Loader2, CheckCircle } from 'lucide-react';

export default function AdminResults() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedLotteryId, setSelectedLotteryId] = useState<string>('');
  const [winningNumber, setWinningNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch lotteries without results
  const { data: lotteries } = useQuery({
    queryKey: ['admin-lotteries-for-results'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lotteries')
        .select(`
          *,
          lottery_results (id)
        `)
        .lt('draw_time', new Date().toISOString())
        .order('draw_time', { ascending: false });
      if (error) throw error;
      // Filter lotteries that don't have results yet
      return data?.filter(l => !l.lottery_results) || [];
    },
  });

  // Fetch existing results
  const { data: results, isLoading } = useQuery({
    queryKey: ['admin-lottery-results'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lottery_results')
        .select(`
          *,
          lotteries:lottery_id (name, draw_time)
        `)
        .order('result_declared_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const handleDeclareResult = async () => {
    if (!selectedLotteryId || winningNumber.length !== 3) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select a lottery and enter a 3-digit number',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Insert result
      const { error: resultError } = await supabase
        .from('lottery_results')
        .insert({
          lottery_id: selectedLotteryId,
          winning_number: winningNumber,
          digit_a: winningNumber[0],
          digit_b: winningNumber[1],
          digit_c: winningNumber[2],
          created_by: user?.id,
        });

      if (resultError) throw resultError;

      // Fetch bets for this lottery
      const { data: bets, error: betsError } = await supabase
        .from('bets')
        .select('*')
        .eq('lottery_id', selectedLotteryId)
        .eq('status', 'pending');

      if (betsError) throw betsError;

      // Calculate winners
      const digitA = winningNumber[0];
      const digitB = winningNumber[1];
      const digitC = winningNumber[2];
      const sortedDigits = winningNumber.split('').sort().join('');

      for (const bet of bets || []) {
        let isWinner = false;

        if (bet.bet_type === 'single') {
          if (bet.position === 'A' && bet.selected_number === digitA) isWinner = true;
          if (bet.position === 'B' && bet.selected_number === digitB) isWinner = true;
          if (bet.position === 'C' && bet.selected_number === digitC) isWinner = true;
        } else if (bet.bet_type === 'double') {
          const doubleAB = digitA + digitB;
          const doubleBC = digitB + digitC;
          const doubleAC = digitA + digitC;
          if (bet.position === 'AB' && bet.selected_number === doubleAB) isWinner = true;
          if (bet.position === 'BC' && bet.selected_number === doubleBC) isWinner = true;
          if (bet.position === 'AC' && bet.selected_number === doubleAC) isWinner = true;
        } else if (bet.bet_type === 'triple') {
          if (bet.is_box) {
            const betSorted = bet.selected_number.split('').sort().join('');
            if (betSorted === sortedDigits) isWinner = true;
          } else {
            if (bet.selected_number === winningNumber) isWinner = true;
          }
        }

        // Update bet status
        const newStatus = isWinner ? 'won' : 'lost';
        const winAmount = isWinner ? Number(bet.potential_win_amount) : 0;

        await supabase
          .from('bets')
          .update({
            status: newStatus,
            win_amount: winAmount,
            settled_at: new Date().toISOString(),
          })
          .eq('id', bet.id);

        // Credit winner's wallet
        if (isWinner) {
          const { data: wallet } = await supabase
            .from('wallets')
            .select('balance')
            .eq('user_id', bet.user_id)
            .single();

          if (wallet) {
            const newBalance = Number(wallet.balance) + winAmount;
            await supabase
              .from('wallets')
              .update({ balance: newBalance })
              .eq('user_id', bet.user_id);

            await supabase
              .from('transactions')
              .insert({
                user_id: bet.user_id,
                type: 'bet_won',
                amount: winAmount,
                balance_after: newBalance,
                reference_id: bet.id,
                description: `Won bet on ${winningNumber}`,
              });
          }
        }
      }

      toast({
        title: 'Result Declared',
        description: `Winning number ${winningNumber} has been recorded and winners have been paid.`,
      });

      setIsDialogOpen(false);
      setSelectedLotteryId('');
      setWinningNumber('');
      queryClient.invalidateQueries({ queryKey: ['admin-lottery-results'] });
      queryClient.invalidateQueries({ queryKey: ['admin-lotteries-for-results'] });
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Results</h1>
        {lotteries && lotteries.length > 0 && (
          <Button onClick={() => setIsDialogOpen(true)}>
            <Trophy className="w-4 h-4 mr-2" />
            Declare Result
          </Button>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Declare Lottery Result</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Select Lottery</Label>
              <Select value={selectedLotteryId} onValueChange={setSelectedLotteryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a lottery" />
                </SelectTrigger>
                <SelectContent>
                  {lotteries?.map((lottery) => (
                    <SelectItem key={lottery.id} value={lottery.id}>
                      {lottery.name} - {format(new Date(lottery.draw_time), 'MMM d, h:mm a')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Winning Number (3 digits)</Label>
              <Input
                value={winningNumber}
                onChange={(e) => setWinningNumber(e.target.value.replace(/[^0-9]/g, '').slice(0, 3))}
                placeholder="123"
                className="text-center text-3xl font-bold tracking-widest"
                maxLength={3}
              />
            </div>

            {winningNumber.length === 3 && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">Winning digits:</p>
                <div className="flex gap-2">
                  <Badge className="text-lg">A: {winningNumber[0]}</Badge>
                  <Badge className="text-lg">B: {winningNumber[1]}</Badge>
                  <Badge className="text-lg">C: {winningNumber[2]}</Badge>
                </div>
              </div>
            )}

            <Button
              className="w-full"
              onClick={handleDeclareResult}
              disabled={isSubmitting || !selectedLotteryId || winningNumber.length !== 3}
            >
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Declare Result & Pay Winners
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Past Results */}
      <Card>
        <CardHeader>
          <CardTitle>Past Results</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : results?.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No results declared yet</p>
          ) : (
            <div className="space-y-3">
              {results?.map((result) => (
                <div key={result.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-semibold">{result.lotteries?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Draw: {format(new Date(result.lotteries?.draw_time), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-success" />
                      <span className="text-2xl font-bold tracking-widest">{result.winning_number}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Declared: {format(new Date(result.result_declared_at), 'MMM d, h:mm a')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
