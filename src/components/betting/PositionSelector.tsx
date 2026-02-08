import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { BetType } from './BetTypeSelector';

interface PositionSelectorProps {
  betType: BetType;
  selectedPosition: string | null;
  onPositionChange: (position: string) => void;
}

export function PositionSelector({ betType, selectedPosition, onPositionChange }: PositionSelectorProps) {
  const singlePositions = ['A', 'B', 'C'];
  const doublePositions = ['AB', 'BC', 'AC'];

  if (betType === 'triple') {
    return null; // No position selector for triple
  }

  const positions = betType === 'single' ? singlePositions : doublePositions;
  const bgClass = betType === 'single' ? 'bg-lottery-single' : 'bg-lottery-double';

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-muted-foreground">
        Select Position
      </label>
      <div className="grid grid-cols-3 gap-2">
        {positions.map((pos) => (
          <Button
            key={pos}
            variant="outline"
            className={cn(
              "h-12 text-lg font-semibold transition-all",
              selectedPosition === pos && `${bgClass} text-white border-transparent`
            )}
            onClick={() => onPositionChange(pos)}
          >
            {pos}
          </Button>
        ))}
      </div>
    </div>
  );
}
