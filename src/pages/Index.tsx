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
import { Dice5, Clock, ArrowRight, ArrowLeft, Sparkles, TrendingUp } from 'lucide-react';
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

  const handleUpdateCartQuantity = (id: string, quantity: number) => {
    setCartItems(prev => prev.map(item => item.id === id ? { ...item, quantity } : item));
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
            <div className="w-20 h-20 gradient-primary rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-glow">
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
                <div key={item.label} className="p-4 bg-card rounded-2xl border text-center">
                  <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold mx-auto mb-2.5", item.color)}>
                    {item.icon}
                  </div>
                  <p className="font-bold text-sm">{item.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Win {item.win}</p>
                </div>
              ))}
            </div>

            <Button size="lg" onClick={() => navigate('/auth')} className="w-full gap-2 h-12 rounded-2xl text-base font-bold shadow-glow">
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
        <div className="px-4 py-3 pb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setSelectedLotteryId(null); setCartItems([]); }}
            className="mb-3 gap-1.5 -ml-2 h-10 rounded-xl font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <NewBettingInterface
            lottery={selectedLottery}
            cartItems={cartItems}
            onAddToCart={handleAddToCart}
            onRemoveFromCart={handleRemoveFromCart}
            onUpdateCartQuantity={handleUpdateCartQuantity}
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
      <div className="px-4 py-5 pb-24">
        {/* Welcome & Live badge */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Today's Draws</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Pick a lottery to play</p>
          </div>
          <div className="pill bg-success/10 text-success border border-success/20">
            <Sparkles className="w-3.5 h-3.5" />
            Live
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-card rounded-2xl border p-3.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-lottery-single/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-lottery-single" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Active</p>
              <p className="text-lg font-bold">{lotteries.filter(l => !isPast(new Date(l.draw_time))).length}</p>
            </div>
          </div>
          <div className="bg-card rounded-2xl border p-3.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-lg font-bold">{lotteries.length}</p>
            </div>
          </div>
        </div>

        {lotteriesLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-24 w-full rounded-2xl" />
            ))}
          </div>
        ) : lotteries.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-2xl border">
            <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-semibold">No Active Lotteries</h3>
            <p className="text-muted-foreground text-sm">Check back later for upcoming draws.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {lotteries.map((lottery, index) => {
              const drawDate = new Date(lottery.draw_time);
              const isExpired = isPast(drawDate);
              const timeLeft = formatDistanceToNow(drawDate, { addSuffix: false });

              return (
                <button
                  key={lottery.id}
                  onClick={() => !isExpired && setSelectedLotteryId(lottery.id)}
                  disabled={isExpired}
                  className={cn(
                    "w-full lottery-card p-4 text-left animate-fade-in",
                    isExpired && "opacity-50 grayscale",
                    !isExpired && "active:scale-[0.98] hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
                  )}
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  <div className="flex items-center gap-4">
                    {/* Left icon */}
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-white font-extrabold text-sm",
                      isExpired ? "bg-muted-foreground/30" : "gradient-primary shadow-glow"
                    )}>
                      {lottery.name.charAt(0)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-bold text-base truncate">{lottery.name}</h3>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Cutoff {format(drawDate, 'h:mm a')} · From ₹{Number(lottery.single_digit_price)}
                      </p>
                    </div>

                    {/* Right side */}
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      {isExpired ? (
                        <span className="pill bg-destructive/10 text-destructive text-[10px]">Closed</span>
                      ) : (
                        <span className="pill bg-success/10 text-success text-[10px] animate-pulse-soft border border-success/20">
                          {timeLeft}
                        </span>
                      )}
                      {!isExpired && (
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <ArrowRight className="w-4 h-4 text-primary" />
                        </div>
                      )}
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
