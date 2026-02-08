import { format, formatDistanceToNow, isPast } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Trophy, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LotteryCardProps {
  id: string;
  name: string;
  description: string | null;
  drawTime: string;
  singleDigitPrice: number;
  doubleDigitPrice: number;
  tripleDigitPrice: number;
  onSelect: (id: string) => void;
  isSelected?: boolean;
}

export function LotteryCard({
  id,
  name,
  description,
  drawTime,
  singleDigitPrice,
  doubleDigitPrice,
  tripleDigitPrice,
  onSelect,
  isSelected,
}: LotteryCardProps) {
  const drawDate = new Date(drawTime);
  const isExpired = isPast(drawDate);
  const timeLeft = formatDistanceToNow(drawDate, { addSuffix: true });

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all hover:shadow-lg hover:border-primary/50",
        isSelected && "ring-2 ring-primary border-primary"
      )}
      onClick={() => !isExpired && onSelect(id)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg">{name}</h3>
              {isExpired ? (
                <Badge variant="secondary" className="text-xs">Closed</Badge>
              ) : (
                <Badge className="text-xs bg-success">Open</Badge>
              )}
            </div>
            
            {description && (
              <p className="text-sm text-muted-foreground mb-2">{description}</p>
            )}
            
            <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
              <Clock className="w-4 h-4" />
              <span>Draw: {format(drawDate, 'MMM d, h:mm a')}</span>
              {!isExpired && (
                <span className="text-primary font-medium ml-1">({timeLeft})</span>
              )}
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              <div className="bg-lottery-single/10 text-lottery-single px-2 py-1 rounded-full">
                1D: ₹{singleDigitPrice}
              </div>
              <div className="bg-lottery-double/10 text-lottery-double px-2 py-1 rounded-full">
                2D: ₹{doubleDigitPrice}
              </div>
              <div className="bg-lottery-triple/10 text-lottery-triple px-2 py-1 rounded-full">
                3D: ₹{tripleDigitPrice}
              </div>
            </div>
          </div>

          <Button 
            size="icon" 
            variant="ghost" 
            disabled={isExpired}
            className="shrink-0"
          >
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
