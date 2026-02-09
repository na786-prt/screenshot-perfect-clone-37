import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { NewBettingInterface } from '@/components/betting/NewBettingInterface';
import { CartItem } from '@/components/betting/BetCart';
import { useLotteries } from '@/hooks/useLotteries';
import { useWallet } from '@/hooks/useWallet';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dice5, Trophy, Clock, ArrowRight, ArrowLeft } from 'lucide-react';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import { cn } from '@/lib/utils';

export default function Index() {
  const { user } = useAuth();
  const { lotteries, isLoading: lotteriesLoading } = useLotteries();
  const { balance, refetch: refetchWallet } = useWallet();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [selectedLotteryId, setSelectedLotteryId] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isPlacingBets, setIsPlacingBets] = useState(false);

  const selectedLottery = lotteries.find(l => l.id === selectedLotteryId);

  const handleAddToCart = (item: CartItem) => {
    setCartItems(prev => [...prev, item]);
  };

  const handleRemoveFromCart = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const handleCheckout = async () => {
    if (!user || !selectedLottery || cartItems.length === 0) return;

    setIsPlacingBets(true);

    try {
      const totalAmount = cartItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
      
      if (totalAmount > balance) {
        toast({
          variant: 'destructive',
          title: 'Insufficient Balance',
          description: 'Please add funds to your wallet.',
        });
        return;
      }

      const betsToInsert = cartItems.map(item => ({
        user_id: user.id,
        lottery_id: selectedLottery.id,
        bet_type: item.betType as 'single' | 'double' | 'triple',
        position: item.position,
        selected_number: item.number,
        is_box: item.isBox,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_amount: item.unitPrice * item.quantity,
        potential_win_amount: item.potentialWin * item.quantity,
      }));

      const { error: betsError } = await supabase
        .from('bets')
        .insert(betsToInsert);

      if (betsError) throw betsError;

      const { error: walletError } = await supabase
        .from('wallets')
        .update({ balance: balance - totalAmount })
        .eq('user_id', user.id);

      if (walletError) throw walletError;

      const { error: txError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'bet_placed',
          amount: -totalAmount,
          balance_after: balance - totalAmount,
          description: `Placed ${cartItems.length} bet(s) on ${selectedLottery.name}`,
        });

      if (txError) throw txError;

      toast({
        title: 'Bets Placed Successfully!',
        description: `${cartItems.length} bet(s) placed for ₹${totalAmount.toFixed(2)}`,
      });

      setCartItems([]);
      refetchWallet();
    } catch (error: any) {
      console.error('Error placing bets:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to Place Bets',
        description: error.message || 'Something went wrong.',
      });
    } finally {
      setIsPlacingBets(false);
    }
  };

  // Landing page for non-authenticated users
  if (!user) {
    return (
      <Layout>
        <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-12">
          <div className="text-center max-w-2xl mx-auto">
            <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Dice5 className="w-10 h-10 text-primary-foreground" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              RASI Game
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Play Kerala Lottery and more. Bet on single, double, or triple digit combinations and win big!
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="p-4 bg-card rounded-xl border">
                <Trophy className="w-8 h-8 text-lottery-single mx-auto mb-2" />
                <h3 className="font-semibold">Single Digit</h3>
                <p className="text-sm text-muted-foreground">Win 9x on position A, B, or C</p>
              </div>
              <div className="p-4 bg-card rounded-xl border">
                <Trophy className="w-8 h-8 text-lottery-double mx-auto mb-2" />
                <h3 className="font-semibold">Double Digits</h3>
                <p className="text-sm text-muted-foreground">Win 90x on AB, BC, or AC</p>
              </div>
              <div className="p-4 bg-card rounded-xl border">
                <Trophy className="w-8 h-8 text-lottery-triple mx-auto mb-2" />
                <h3 className="font-semibold">Triple Digits</h3>
                <p className="text-sm text-muted-foreground">Win 900x on exact match</p>
              </div>
            </div>

            <Button size="lg" onClick={() => navigate('/auth')} className="gap-2">
              Get Started <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  // Show betting interface when a lottery is selected
  if (selectedLottery) {
    return (
      <Layout>
        <div className="container py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedLotteryId(null);
              setCartItems([]);
            }}
            className="mb-4 gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>

          <NewBettingInterface
            lottery={selectedLottery}
            cartItems={cartItems}
            onAddToCart={handleAddToCart}
            onRemoveFromCart={handleRemoveFromCart}
            onCheckout={handleCheckout}
            isCheckingOut={isPlacingBets}
            walletBalance={Number(balance)}
          />
        </div>
      </Layout>
    );
  }

  // Dashboard - Lottery selection grid
  return (
    <Layout>
      <div className="container py-6">
        <h1 className="text-2xl font-bold mb-6">Today's Lotteries</h1>

        {lotteriesLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))}
          </div>
        ) : lotteries.length === 0 ? (
          <div className="text-center py-12 bg-muted/50 rounded-xl">
            <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-semibold">No Active Lotteries</h3>
            <p className="text-muted-foreground">Check back later for upcoming draws.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {lotteries.map(lottery => {
              const drawDate = new Date(lottery.draw_time);
              const isExpired = isPast(drawDate);
              const timeLeft = formatDistanceToNow(drawDate, { addSuffix: false });

              return (
                <button
                  key={lottery.id}
                  onClick={() => !isExpired && setSelectedLotteryId(lottery.id)}
                  disabled={isExpired}
                  className={cn(
                    "relative p-4 rounded-xl border-2 text-left transition-all",
                    "bg-gradient-to-br from-primary/5 to-primary/10",
                    "hover:shadow-lg hover:border-primary/50 hover:scale-[1.02]",
                    isExpired && "opacity-50 cursor-not-allowed",
                    !isExpired && "cursor-pointer"
                  )}
                >
                  <div className="flex flex-col h-full">
                    <h3 className="font-bold text-lg mb-1">{lottery.name}</h3>
                    <p className="text-xs text-muted-foreground mb-2">
                      Cutoff: {format(drawDate, 'h:mm a')}
                    </p>
                    
                    {isExpired ? (
                      <span className="text-xs text-destructive font-medium">Closed</span>
                    ) : (
                      <span className="text-xs text-success font-medium">
                        {timeLeft} left
                      </span>
                    )}

                    <div className="mt-auto pt-3">
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                        ₹{Number(lottery.single_digit_price)}/bet
                      </span>
                    </div>
                  </div>

                  {!isExpired && (
                    <ArrowRight className="absolute top-4 right-4 w-5 h-5 text-primary" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}