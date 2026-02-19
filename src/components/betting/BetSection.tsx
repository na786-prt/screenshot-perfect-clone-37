import { Shuffle } from 'lucide-react';
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
}

export function BetSection({ title, price, winAmount, rows, digitCount, onAdd }: BetSectionProps) {
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
    </div>
  );
}

