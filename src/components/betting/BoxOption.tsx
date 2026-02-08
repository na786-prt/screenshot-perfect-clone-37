import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface BoxOptionProps {
  isBox: boolean;
  onBoxChange: (isBox: boolean) => void;
}

export function BoxOption({ isBox, onBoxChange }: BoxOptionProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-lottery-box/10 rounded-lg border border-lottery-box/30">
      <div className="flex items-center gap-2">
        <Label htmlFor="box-option" className="font-medium cursor-pointer">
          BOX Option
        </Label>
        <Tooltip>
          <TooltipTrigger asChild>
            <HelpCircle className="w-4 h-4 text-muted-foreground" />
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p>BOX wins if your 3 digits appear in ANY order. Lower payout but higher chance to win.</p>
          </TooltipContent>
        </Tooltip>
      </div>
      <Switch
        id="box-option"
        checked={isBox}
        onCheckedChange={onBoxChange}
      />
    </div>
  );
}
