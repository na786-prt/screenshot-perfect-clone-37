import { v4 as uuidv4 } from 'uuid';
import { LotteryHeader } from './LotteryHeader';
import { BetSection } from './BetSection';
import { BetCart, CartItem } from './BetCart';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';

interface Lottery {
  id: string;
  name: string;
  description: string | null;
  draw_time: string;
  single_digit_price: number;
  single_digit_win_amount: number;
  double_digit_price: number;
  double_digit_win_amount: number;
  triple_digit_price: number;
  triple_digit_win_amount: number;
  triple_box_price: number;
  triple_box_win_amount: number;
}

interface NewBettingInterfaceProps {
  lottery: Lottery;
  cartItems: CartItem[];
  onAddToCart: (item: CartItem) => void;
  onRemoveFromCart: (id: string) => void;
  onCheckout: () => void;
  isCheckingOut: boolean;
  walletBalance: number;
}

export function NewBettingInterface({
  lottery, cartItems, onAddToCart, onRemoveFromCart, onCheckout, isCheckingOut, walletBalance,
}: NewBettingInterfaceProps) {
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const handleAddBet = (
    betType: 'single' | 'double' | 'triple',
    position: string,
    number: string,
    quantity: number,
    isBox: boolean = false
  ) => {
    const prices = {
      single: lottery.single_digit_price,
      double: lottery.double_digit_price,
      triple: isBox ? lottery.triple_box_price : lottery.triple_digit_price,
    };
    const winAmounts = {
      single: lottery.single_digit_win_amount,
      double: lottery.double_digit_win_amount,
      triple: isBox ? lottery.triple_box_win_amount : lottery.triple_digit_win_amount,
    };

    onAddToCart({
      id: uuidv4(),
      betType,
      position: betType === 'triple' ? null : position,
      number,
      isBox,
      quantity,
      unitPrice: prices[betType],
      potentialWin: winAmounts[betType],
    });
    toast({
      title: 'Added ✓',
      description: `${number} (${position || 'ABC'}) × ${quantity}`,
    });
  };

  const singleRows = [
    { positions: ['A'], positionColors: ['bg-lottery-single'] },
    { positions: ['B'], positionColors: ['bg-lottery-double'] },
    { positions: ['C'], positionColors: ['bg-lottery-triple'] },
  ];
  const doubleRows = [
    { positions: ['A', 'B'], positionColors: ['bg-lottery-single', 'bg-lottery-double'] },
    { positions: ['A', 'C'], positionColors: ['bg-lottery-single', 'bg-lottery-triple'] },
    { positions: ['B', 'C'], positionColors: ['bg-lottery-double', 'bg-lottery-triple'] },
  ];
  const tripleRows = [
    { positions: ['A', 'B', 'C'], positionColors: ['bg-lottery-single', 'bg-lottery-double', 'bg-lottery-triple'] },
  ];

  const totalAmount = cartItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);

  return (
    <div className="relative">
      <div className={isMobile ? '' : 'grid grid-cols-3 gap-4'}>
        <div className={isMobile ? '' : 'col-span-2'}>
          <LotteryHeader name={lottery.name} drawTime={lottery.draw_time} />

          <BetSection
            title="Single Digit"
            price={Number(lottery.single_digit_price)}
            winAmount={Number(lottery.single_digit_win_amount)}
            rows={singleRows} digitCount={1}
            onAdd={(pos, num, qty) => handleAddBet('single', pos, num, qty)}
          />
          <BetSection
            title="Double Digits"
            price={Number(lottery.double_digit_price)}
            winAmount={Number(lottery.double_digit_win_amount)}
            rows={doubleRows} digitCount={2}
            onAdd={(pos, num, qty) => handleAddBet('double', pos, num, qty)}
          />
          <BetSection
            title="Three Digits"
            price={Number(lottery.triple_digit_price)}
            winAmount={Number(lottery.triple_digit_win_amount)}
            rows={tripleRows} digitCount={3}
            onAdd={(pos, num, qty) => handleAddBet('triple', pos, num, qty)}
            showBox
            onBoxAdd={(num, qty) => handleAddBet('triple', 'ABC', num, qty, true)}
          />

          {/* Spacer for FAB on mobile */}
          {isMobile && cartItems.length > 0 && <div className="h-20" />}
        </div>

        {/* Desktop sidebar cart */}
        {!isMobile && (
          <div className="col-span-1">
            <div className="sticky top-16">
              <BetCart
                items={cartItems}
                onRemoveItem={onRemoveFromCart}
                onCheckout={onCheckout}
                isLoading={isCheckingOut}
                walletBalance={walletBalance}
              />
            </div>
          </div>
        )}
      </div>

      {/* Mobile FAB + Drawer */}
      {isMobile && cartItems.length > 0 && (
        <Drawer>
          <DrawerTrigger asChild>
            <button className="fab bottom-6 right-4 w-14 h-14 bg-primary text-primary-foreground flex items-center justify-center animate-slide-up">
              <ShoppingCart className="w-6 h-6" />
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-foreground text-background text-xs font-bold flex items-center justify-center">
                {cartItems.length}
              </span>
            </button>
          </DrawerTrigger>
          <DrawerContent className="max-h-[85vh]">
            <DrawerHeader className="pb-0">
              <DrawerTitle>Your Bets ({cartItems.length})</DrawerTitle>
            </DrawerHeader>
            <div className="overflow-y-auto px-4 pb-4">
              <BetCart
                items={cartItems}
                onRemoveItem={onRemoveFromCart}
                onCheckout={onCheckout}
                isLoading={isCheckingOut}
                walletBalance={walletBalance}
              />
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </div>
  );
}
