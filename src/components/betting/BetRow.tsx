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

  const isCompact = digitCount === 3;

  return (
    <div className={cn("flex items-center py-2", isCompact ? "gap-1" : "gap-1.5")}>
      {/* Position badges */}
      <div className="flex shrink-0">
        {positions.map((pos, idx) => (
          <div
            key={pos}
            className={cn(
              "h-7 flex items-center justify-center text-white font-bold",
              isCompact ? "w-6 text-[10px]" : "px-2 text-xs",
              idx === 0 ? "rounded-l-lg" : "",
              idx === positions.length - 1 ? "rounded-r-lg" : "",
              colors[idx] || colors[0]
            )}
          >
            {pos}
          </div>
        ))}
      </div>

      {/* Digit inputs */}
      <div className={cn("flex flex-1 justify-center", isCompact ? "gap-0.5" : "gap-1")}>
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
            className={cn("digit-input", isCompact && "w-8 h-10 text-base")}
            maxLength={1}
            placeholder="·"
          />
        ))}
      </div>

      {/* Quantity */}
      <div className="flex items-center gap-0.5 shrink-0">
        <button
          onClick={() => setQuantity(Math.max(1, quantity - 1))}
          className={cn("rounded-lg border flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors", isCompact ? "w-7 h-7" : "w-8 h-8")}
        >
          <Minus className="w-3 h-3" />
        </button>
        <span className="w-5 text-center font-bold text-sm tabular-nums">{quantity}</span>
        <button
          onClick={() => setQuantity(quantity + 1)}
          className={cn("rounded-lg border flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors", isCompact ? "w-7 h-7" : "w-8 h-8")}
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>

      {/* Add button */}
      <Button
        onClick={handleAdd}
        disabled={!isComplete}
        size="sm"
        className={cn("shrink-0 rounded-xl h-8 font-bold text-xs", isCompact ? "px-2" : "px-3")}
      >
        Add
      </Button>
    </div>
  );
}
