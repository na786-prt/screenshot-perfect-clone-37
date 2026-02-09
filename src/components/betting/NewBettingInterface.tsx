import { v4 as uuidv4 } from 'uuid';
import { LotteryHeader } from './LotteryHeader';
import { BetSection } from './BetSection';
import { BetCart, CartItem } from './BetCart';
import { useToast } from '@/hooks/use-toast';

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
  lottery,
  cartItems,
  onAddToCart,
  onRemoveFromCart,
  onCheckout,
  isCheckingOut,
  walletBalance,
}: NewBettingInterfaceProps) {
  const { toast } = useToast();

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

    const item: CartItem = {
      id: uuidv4(),
      betType,
      position: betType === 'triple' ? null : position,
      number,
      isBox,
      quantity,
      unitPrice: prices[betType],
      potentialWin: winAmounts[betType],
    };

    onAddToCart(item);
    toast({
      title: 'Added to Cart',
      description: `${betType} digit bet on ${number} (${position || 'ABC'}) × ${quantity}`,
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-4">
        <LotteryHeader
          name={lottery.name}
          drawTime={lottery.draw_time}
        />

        <BetSection
          title="Single Digit"
          price={Number(lottery.single_digit_price)}
          winAmount={Number(lottery.single_digit_win_amount)}
          rows={singleRows}
          digitCount={1}
          onAdd={(position, number, quantity) => 
            handleAddBet('single', position, number, quantity)
          }
        />

        <BetSection
          title="Double Digits"
          price={Number(lottery.double_digit_price)}
          winAmount={Number(lottery.double_digit_win_amount)}
          rows={doubleRows}
          digitCount={2}
          onAdd={(position, number, quantity) => 
            handleAddBet('double', position, number, quantity)
          }
        />

        <BetSection
          title="Three Digits"
          price={Number(lottery.triple_digit_price)}
          winAmount={Number(lottery.triple_digit_win_amount)}
          rows={tripleRows}
          digitCount={3}
          onAdd={(position, number, quantity) => 
            handleAddBet('triple', position, number, quantity)
          }
          showBox
          onBoxAdd={(number, quantity) => 
            handleAddBet('triple', 'ABC', number, quantity, true)
          }
        />
      </div>

      <div className="lg:col-span-1">
        <div className="sticky top-4">
          <BetCart
            items={cartItems}
            onRemoveItem={onRemoveFromCart}
            onCheckout={onCheckout}
            isLoading={isCheckingOut}
            walletBalance={walletBalance}
          />
        </div>
      </div>
    </div>
  );
}
