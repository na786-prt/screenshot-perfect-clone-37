import { useState } from 'react';
import { Shuffle, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { BetRow } from './BetRow';

interface BetSectionProps {
  title: string;
  price: number;
  winAmount: number;
  rows: Array<{
    positions: string[];
    positionColors: string[];
  }>;
  digitCount: number;
  onAdd: (position: string, number: string, quantity: number) => void;
  showBox?: boolean;
  onBoxAdd?: (number: string, quantity: number) => void;
}

export function BetSection({
  title,
  price,
  winAmount,
  rows,
  digitCount,
  onAdd,
  showBox,
  onBoxAdd,
}: BetSectionProps) {
  const handleQuickGuess = () => {
    const randomDigits = Array(digitCount).fill(0).map(() => 
      Math.floor(Math.random() * 10).toString()
    ).join('');
    
    if (rows.length > 0) {
      const firstPosition = rows[0].positions.join('');
      onAdd(firstPosition, randomDigits, 1);
    }
  };

  return (
    <div className="bg-card rounded-xl p-4 mb-4 border">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <h3 className="font-bold text-lg">{title}</h3>
          <Badge variant="outline" className="bg-success/10 text-success border-success/30">
            Win ₹{winAmount.toLocaleString()}
          </Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleQuickGuess}
          className="gap-1"
        >
          <Shuffle className="w-4 h-4" />
          Quick Guess
        </Button>
      </div>
      
      <p className="text-sm text-muted-foreground mb-3">₹{price}</p>

      <div className="space-y-1">
        {rows.map((row, idx) => (
          <BetRow
            key={idx}
            positions={row.positions}
            digitCount={digitCount}
            positionColors={row.positionColors}
            onAdd={(number, quantity) => onAdd(row.positions.join(''), number, quantity)}
          />
        ))}
      </div>

      {showBox && onBoxAdd && (
        <div className="mt-3 pt-3 border-t">
          <TripleBoxRow onAdd={onBoxAdd} />
        </div>
      )}
    </div>
  );
}

function TripleBoxRow({ onAdd }: { onAdd: (number: string, quantity: number) => void }) {
  const [digits, setDigits] = useState<string[]>(['', '', '']);
  const [quantity, setQuantity] = useState(3);

  const handleDigitChange = (index: number, value: string) => {
    const sanitized = value.replace(/[^0-9]/g, '').slice(0, 1);
    const newDigits = [...digits];
    newDigits[index] = sanitized;
    setDigits(newDigits);
  };

  const handleAdd = () => {
    const number = digits.join('');
    if (number.length === 3) {
      onAdd(number, quantity);
      setDigits(['', '', '']);
      setQuantity(3);
    }
  };

  const isComplete = digits.every(d => d !== '');

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1 shrink-0">
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm bg-lottery-single">A</div>
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm bg-lottery-double">B</div>
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm bg-lottery-triple">C</div>
      </div>

      <div className="flex gap-1 flex-1">
        {digits.map((digit, idx) => (
          <Input
            key={idx}
            type="text"
            inputMode="numeric"
            value={digit}
            onChange={(e) => handleDigitChange(idx, e.target.value)}
            className="w-10 h-10 text-center text-lg font-semibold p-0"
            maxLength={1}
            placeholder="-"
          />
        ))}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => setQuantity(Math.max(1, quantity - 1))}
        >
          <Minus className="w-4 h-4" />
        </Button>
        <span className="w-6 text-center font-semibold">{quantity}</span>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => setQuantity(quantity + 1)}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <Button
        onClick={handleAdd}
        disabled={!isComplete}
        className="shrink-0 bg-lottery-box/20 text-lottery-box hover:bg-lottery-box hover:text-white"
        size="sm"
      >
        BOX
      </Button>

      <Button
        onClick={handleAdd}
        disabled={!isComplete}
        className="shrink-0 bg-primary/20 text-primary hover:bg-primary hover:text-primary-foreground"
        size="sm"
      >
        Add
      </Button>
    </div>
  );
}
