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
    <div className="bg-card rounded-2xl p-4 border mb-3">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-base">{title}</h3>
          <Badge variant="outline" className="bg-success/10 text-success border-success/30 text-xs rounded-lg">
            Win ₹{winAmount.toLocaleString()}
          </Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={handleQuickGuess} className="gap-1 h-8 text-xs text-primary">
          <Shuffle className="w-3.5 h-3.5" />
          Random
        </Button>
      </div>

      <p className="text-xs text-muted-foreground mb-2">₹{price} per bet</p>

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

  const handleAdd = (isBox: boolean) => {
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
      <div className="flex gap-0.5 shrink-0">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs bg-lottery-single">A</div>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs bg-lottery-double">B</div>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs bg-lottery-triple">C</div>
      </div>

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

      <div className="flex items-center gap-0.5 shrink-0">
        <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
          <Minus className="w-3.5 h-3.5" />
        </Button>
        <span className="w-7 text-center font-bold text-sm">{quantity}</span>
        <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setQuantity(quantity + 1)}>
          <Plus className="w-3.5 h-3.5" />
        </Button>
      </div>

      <Button
        onClick={() => handleAdd(true)}
        disabled={!isComplete}
        size="sm"
        variant="outline"
        className="shrink-0 rounded-xl h-9 px-3 font-bold text-lottery-box border-lottery-box/30 hover:bg-lottery-box hover:text-white"
      >
        BOX
      </Button>
    </div>
  );
}
