import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface BetRowProps {
  positions: string[];
  digitCount: number;
  onAdd: (number: string, quantity: number) => void;
  positionColors?: string[];
}

export function BetRow({ positions, digitCount, onAdd, positionColors }: BetRowProps) {
  const [digits, setDigits] = useState<string[]>(Array(digitCount).fill(''));
  const [quantity, setQuantity] = useState(3);

  const handleDigitChange = (index: number, value: string) => {
    const sanitized = value.replace(/[^0-9]/g, '').slice(0, 1);
    const newDigits = [...digits];
    newDigits[index] = sanitized;
    setDigits(newDigits);
  };

  const handleAdd = () => {
    const number = digits.join('');
    if (number.length === digitCount) {
      onAdd(number, quantity);
      setDigits(Array(digitCount).fill(''));
      setQuantity(3);
    }
  };

  const isComplete = digits.every(d => d !== '');

  const defaultColors = ['bg-lottery-single', 'bg-lottery-double', 'bg-lottery-triple'];
  const colors = positionColors || defaultColors;

  return (
    <div className="flex items-center gap-2 py-2">
      <div className="flex gap-1 shrink-0">
        {positions.map((pos, idx) => (
          <div
            key={pos}
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm",
              colors[idx] || colors[0]
            )}
          >
            {pos}
          </div>
        ))}
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
        className="shrink-0 bg-primary/20 text-primary hover:bg-primary hover:text-primary-foreground"
        size="sm"
      >
        Add
      </Button>
    </div>
  );
}
