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

    // Auto-focus next input
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
    <div className="flex items-center gap-2 py-1.5">
      {/* Position badges */}
      <div className="flex gap-0.5 shrink-0">
        {positions.map((pos, idx) => (
          <div
            key={pos}
            className={cn(
              "w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs",
              colors[idx] || colors[0]
            )}
          >
            {pos}
          </div>
        ))}
      </div>

      {/* Digit inputs */}
      <div className="flex gap-1.5 flex-1">
        {digits.map((digit, idx) => (
          <input
            key={idx}
            ref={el => { inputRefs.current[idx] = el; }}
            type="text"
            inputMode="numeric"
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
      <div className="flex items-center gap-0.5 shrink-0">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-lg"
          onClick={() => setQuantity(Math.max(1, quantity - 1))}
        >
          <Minus className="w-3.5 h-3.5" />
        </Button>
        <span className="w-7 text-center font-bold text-sm">{quantity}</span>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-lg"
          onClick={() => setQuantity(quantity + 1)}
        >
          <Plus className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Add button */}
      <Button
        onClick={handleAdd}
        disabled={!isComplete}
        size="sm"
        className="shrink-0 rounded-xl h-9 px-4 font-bold"
      >
        Add
      </Button>
    </div>
  );
}
