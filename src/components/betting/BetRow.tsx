import { useState, useRef } from 'react';
import { Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleDigitChange = (index: number, value: string) => {
    const sanitized = value.replace(/[^0-9]/g, '').slice(0, 1);
    const newDigits = [...digits];
    newDigits[index] = sanitized;
    setDigits(newDigits);
    if (sanitized && index < digitCount - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleAdd = () => {
    const number = digits.join('');
    if (number.length === digitCount) {
      onAdd(number, quantity);
      setDigits(Array(digitCount).fill(''));
      setQuantity(3);
      inputRefs.current[0]?.focus();
    }
  };

  const isComplete = digits.every(d => d !== '');
  const defaultColors = ['bg-lottery-single', 'bg-lottery-double', 'bg-lottery-triple'];
  const colors = positionColors || defaultColors;

  return (
    <div className="flex items-center gap-2 py-2">
      {/* Position badges */}
      <div className="flex gap-0.5 shrink-0">
        {positions.map((pos, idx) => (
          <div
            key={pos}
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs touch-target",
              colors[idx] || colors[0]
            )}
          >
            {pos}
          </div>
        ))}
      </div>

      {/* Digit inputs */}
      <div className="flex gap-1.5 flex-1 justify-center">
        {digits.map((digit, idx) => (
          <input
            key={idx}
            ref={el => { inputRefs.current[idx] = el; }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={digit}
            onChange={(e) => handleDigitChange(idx, e.target.value)}
            onKeyDown={(e) => handleKeyDown(idx, e)}
            className="digit-input"
            maxLength={1}
            placeholder="·"
          />
        ))}
      </div>

      {/* Quantity */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => setQuantity(Math.max(1, quantity - 1))}
          className="w-9 h-9 rounded-lg border flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors touch-target"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <span className="w-7 text-center font-bold text-sm tabular-nums">{quantity}</span>
        <button
          onClick={() => setQuantity(quantity + 1)}
          className="w-9 h-9 rounded-lg border flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors touch-target"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Add button */}
      <Button
        onClick={handleAdd}
        disabled={!isComplete}
        size="sm"
        className="shrink-0 rounded-xl h-10 px-4 font-bold touch-target"
      >
        Add
      </Button>
    </div>
  );
}
