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
import { Dice5, Trophy, Clock, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
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
        toast({ variant: 'destructive', title: 'Insufficient Balance', description: 'Please add funds to your wallet.' });
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
      const { error: betsError } = await supabase.from('bets').insert(betsToInsert);
      if (betsError) throw betsError;
      const { error: walletError } = await supabase.from('wallets').update({ balance: balance - totalAmount }).eq('user_id', user.id);
      if (walletError) throw walletError;
      const { error: txError } = await supabase.from('transactions').insert({
        user_id: user.id, type: 'bet_placed', amount: -totalAmount,
        balance_after: balance - totalAmount,
        description: `Placed ${cartItems.length} bet(s) on ${selectedLottery.name}`,
      });
      if (txError) throw txError;
      toast({ title: 'Bets Placed! 🎉', description: `${cartItems.length} bet(s) for ₹${totalAmount.toFixed(0)}` });
      setCartItems([]);
      refetchWallet();
    } catch (error: any) {
      console.error('Error placing bets:', error);
      toast({ variant: 'destructive', title: 'Failed to Place Bets', description: error.message || 'Something went wrong.' });
    } finally {
      setIsPlacingBets(false);
    }
  };

  // Landing page
  if (!user) {
    return (
      <Layout>
        <div className="min-h-[85vh] flex flex-col items-center justify-center px-5 py-12">
          <div className="text-center max-w-md mx-auto">
            <div className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-primary/30">
              <Dice5 className="w-10 h-10 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-extrabold mb-3 tracking-tight">RASI Game</h1>
            <p className="text-muted-foreground mb-8 text-base leading-relaxed">
              Play Kerala Lottery and more. Bet on single, double, or triple digit combinations.
            </p>

            <div className="grid grid-cols-3 gap-3 mb-8">
              {[
                { icon: '1', label: 'Single', win: '9x', color: 'bg-lottery-single' },
                { icon: '12', label: 'Double', win: '90x', color: 'bg-lottery-double' },
                { icon: '123', label: 'Triple', win: '900x', color: 'bg-lottery-triple' },
              ].map(item => (
                <div key={item.label} className="p-3 bg-card rounded-2xl border text-center">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold mx-auto mb-2", item.color)}>
                    {item.icon}
                  </div>
                  <p className="font-semibold text-sm">{item.label}</p>
                  <p className="text-xs text-muted-foreground">Win {item.win}</p>
                </div>
              ))}
            </div>

            <Button size="lg" onClick={() => navigate('/auth')} className="w-full gap-2 h-12 rounded-2xl text-base font-bold shadow-lg shadow-primary/25">
              Get Started <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  // Betting interface
  if (selectedLottery) {
    return (
      <Layout hideBottomNav>
        <div className="px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setSelectedLotteryId(null); setCartItems([]); }}
            className="mb-3 gap-1 -ml-2 h-9"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
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

  // Dashboard
  return (
    <Layout>
      <div className="px-4 py-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">Today's Draws</h1>
            <p className="text-sm text-muted-foreground">Pick a lottery to play</p>
          </div>
          <div className="pill bg-success/10 text-success">
            <Sparkles className="w-3.5 h-3.5" />
            Live
          </div>
        </div>

        {lotteriesLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-36 w-full rounded-2xl" />
            ))}
          </div>
        ) : lotteries.length === 0 ? (
          <div className="text-center py-16 bg-muted/50 rounded-2xl">
            <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-semibold">No Active Lotteries</h3>
            <p className="text-muted-foreground text-sm">Check back later for upcoming draws.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
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
                    "lottery-card p-4 text-left animate-fade-in",
                    isExpired && "opacity-40 grayscale",
                    !isExpired && "active:scale-[0.97]"
                  )}
                >
                  <div className="flex flex-col h-full min-h-[7rem]">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-base leading-tight">{lottery.name}</h3>
                      {!isExpired && (
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <ArrowRight className="w-3.5 h-3.5 text-primary" />
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Cutoff {format(drawDate, 'h:mm a')}
                    </p>

                    <div className="mt-auto pt-2 flex items-center justify-between">
                      {isExpired ? (
                        <span className="pill bg-destructive/10 text-destructive">Closed</span>
                      ) : (
                        <span className="pill bg-success/10 text-success animate-pulse-soft">
                          {timeLeft}
                        </span>
                      )}
                      <span className="text-xs font-bold text-primary">
                        ₹{Number(lottery.single_digit_price)}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
