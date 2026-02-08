import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export type BetType = 'single' | 'double' | 'triple';

interface BetTypeSelectorProps {
  selectedType: BetType;
  onTypeChange: (type: BetType) => void;
}

export function BetTypeSelector({ selectedType, onTypeChange }: BetTypeSelectorProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <Button
        variant="outline"
        className={cn(
          "flex flex-col h-auto py-3 transition-all",
          selectedType === 'single' && "border-lottery-single bg-lottery-single/10 text-lottery-single"
        )}
        onClick={() => onTypeChange('single')}
      >
        <span className="text-2xl font-bold">1</span>
        <span className="text-xs">Single</span>
      </Button>
      
      <Button
        variant="outline"
        className={cn(
          "flex flex-col h-auto py-3 transition-all",
          selectedType === 'double' && "border-lottery-double bg-lottery-double/10 text-lottery-double"
        )}
        onClick={() => onTypeChange('double')}
      >
        <span className="text-2xl font-bold">2</span>
        <span className="text-xs">Double</span>
      </Button>
      
      <Button
        variant="outline"
        className={cn(
          "flex flex-col h-auto py-3 transition-all",
          selectedType === 'triple' && "border-lottery-triple bg-lottery-triple/10 text-lottery-triple"
        )}
        onClick={() => onTypeChange('triple')}
      >
        <span className="text-2xl font-bold">3</span>
        <span className="text-xs">Triple</span>
      </Button>
    </div>
  );
}
