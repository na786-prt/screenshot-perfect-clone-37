import { useState, useRef } from 'react';
import { Shuffle, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BetRow } from './BetRow';

interface BetSectionProps {
  title: string;
  price: number;
  winAmount: number;
  rows: Array<{ positions: string[]; positionColors: string[] }>;
  digitCount: number;
  onAdd: (position: string, number: string, quantity: number) => void;
  showBox?: boolean;
  onBoxAdd?: (number: string, quantity: number) => void;
}

export function BetSection({ title, price, winAmount, rows, digitCount, onAdd, showBox, onBoxAdd }: BetSectionProps) {
  const handleQuickGuess = () => {
    const randomDigits = Array(digitCount).fill(0).map(() =>
      Math.floor(Math.random() * 10).toString()
    ).join('');
    if (rows.length > 0) {
      onAdd(rows[0].positions.join(''), randomDigits, 1);
    }
  };

  return (
    <div className="section-card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-bold text-base">{title}</h3>
          <Badge variant="outline" className="bg-success/10 text-success border-success/30 text-xs rounded-lg">
            Win ₹{winAmount.toLocaleString()}
          </Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={handleQuickGuess} className="gap-1.5 h-9 text-xs text-primary rounded-xl touch-target">
          <Shuffle className="w-3.5 h-3.5" />
          Random
        </Button>
      </div>

      <p className="text-xs text-muted-foreground mb-3">₹{price} per bet</p>

      <div className="space-y-0.5">
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
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleDigitChange = (index: number, value: string) => {
    const sanitized = value.replace(/[^0-9]/g, '').slice(0, 1);
    const newDigits = [...digits];
    newDigits[index] = sanitized;
    setDigits(newDigits);
    if (sanitized && index < 2) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
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
    <div className="flex items-center gap-2 py-1">
      <div className="flex gap-0.5 shrink-0">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs bg-lottery-single touch-target">A</div>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs bg-lottery-double touch-target">B</div>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs bg-lottery-triple touch-target">C</div>
      </div>

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

      <Button
        onClick={handleAdd}
        disabled={!isComplete}
        size="sm"
        variant="outline"
        className="shrink-0 rounded-xl h-10 px-3 font-bold text-lottery-box border-lottery-box/30 hover:bg-lottery-box hover:text-white touch-target"
      >
        BOX
      </Button>
    </div>
  );
}
