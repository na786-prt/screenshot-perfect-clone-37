import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BetTypeSelector, BetType } from './BetTypeSelector';
import { PositionSelector } from './PositionSelector';
import { NumberInput } from './NumberInput';
import { QuantitySelector } from './QuantitySelector';
import { BoxOption } from './BoxOption';
import { CartItem } from './BetCart';
import { Plus, Trophy } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface Lottery {
  id: string;
  name: string;
  single_digit_price: number;
  single_digit_win_amount: number;
  double_digit_price: number;
  double_digit_win_amount: number;
  triple_digit_price: number;
  triple_digit_win_amount: number;
  triple_box_price: number;
  triple_box_win_amount: number;
}

interface BettingFormProps {
  lottery: Lottery;
  onAddToCart: (item: CartItem) => void;
}

export function BettingForm({ lottery, onAddToCart }: BettingFormProps) {
  const [betType, setBetType] = useState<BetType>('single');
  const [position, setPosition] = useState<string | null>('A');
  const [number, setNumber] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isBox, setIsBox] = useState(false);

  const getPrice = () => {
    if (betType === 'single') return lottery.single_digit_price;
    if (betType === 'double') return lottery.double_digit_price;
    if (betType === 'triple') {
      return isBox ? lottery.triple_box_price : lottery.triple_digit_price;
    }
    return 0;
  };

  const getWinAmount = () => {
    if (betType === 'single') return lottery.single_digit_win_amount;
    if (betType === 'double') return lottery.double_digit_win_amount;
    if (betType === 'triple') {
      return isBox ? lottery.triple_box_win_amount : lottery.triple_digit_win_amount;
    }
    return 0;
  };

  const isValidBet = () => {
    const requiredLength = betType === 'single' ? 1 : betType === 'double' ? 2 : 3;
    if (number.length !== requiredLength) return false;
    if ((betType === 'single' || betType === 'double') && !position) return false;
    return true;
  };

  const handleAddToCart = () => {
    if (!isValidBet()) return;

    const item: CartItem = {
      id: uuidv4(),
      betType,
      position: betType === 'triple' ? null : position,
      number,
      isBox: betType === 'triple' && isBox,
      quantity,
      unitPrice: getPrice(),
      potentialWin: getWinAmount(),
    };

    onAddToCart(item);
    
    // Reset form
    setNumber('');
    setQuantity(1);
  };

  const handleBetTypeChange = (type: BetType) => {
    setBetType(type);
    setNumber('');
    setIsBox(false);
    if (type === 'single') setPosition('A');
    else if (type === 'double') setPosition('AB');
    else setPosition(null);
  };

  const price = getPrice();
  const winAmount = getWinAmount();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Place Your Bet</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <BetTypeSelector 
          selectedType={betType} 
          onTypeChange={handleBetTypeChange} 
        />

        <PositionSelector
          betType={betType}
          selectedPosition={position}
          onPositionChange={setPosition}
        />

        <NumberInput
          betType={betType}
          value={number}
          onChange={setNumber}
        />

        {betType === 'triple' && (
          <BoxOption isBox={isBox} onBoxChange={setIsBox} />
        )}

        <QuantitySelector
          quantity={quantity}
          onQuantityChange={setQuantity}
        />

        {/* Price & Win Display */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-muted rounded-lg text-center">
            <p className="text-xs text-muted-foreground mb-1">Price per ticket</p>
            <p className="text-xl font-bold">₹{price}</p>
          </div>
          <div className="p-3 bg-success/10 rounded-lg text-center">
            <p className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1">
              <Trophy className="w-3 h-3" /> Win Amount
            </p>
            <p className="text-xl font-bold text-success">₹{winAmount}</p>
          </div>
        </div>

        <div className="p-3 bg-primary/5 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="text-lg font-bold">₹{(price * quantity).toFixed(2)}</span>
          </div>
        </div>

        <Button 
          className="w-full" 
          size="lg"
          onClick={handleAddToCart}
          disabled={!isValidBet()}
        >
          <Plus className="w-5 h-5 mr-2" />
          Add to Cart
        </Button>
      </CardContent>
    </Card>
  );
}
