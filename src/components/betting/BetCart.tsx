import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CartItem {
  id: string;
  betType: 'single' | 'double' | 'triple';
  position: string | null;
  number: string;
  isBox: boolean;
  quantity: number;
  unitPrice: number;
  potentialWin: number;
}

interface BetCartProps {
  items: CartItem[];
  onRemoveItem: (id: string) => void;
  onCheckout: () => void;
  isLoading?: boolean;
  walletBalance: number;
}

export function BetCart({ items, onRemoveItem, onCheckout, isLoading, walletBalance }: BetCartProps) {
  const total = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  const totalPotentialWin = items.reduce((sum, item) => sum + (item.potentialWin * item.quantity), 0);
  const hasInsufficientBalance = total > walletBalance;

  const getBetTypeColor = (type: string) => {
    switch (type) {
      case 'single': return 'bg-lottery-single';
      case 'double': return 'bg-lottery-double';
      case 'triple': return 'bg-lottery-triple';
      default: return 'bg-primary';
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No bets added yet
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between p-3 bg-muted/50 rounded-xl animate-fade-in"
        >
          <div className="flex items-center gap-2.5">
            <Badge className={cn("text-white text-[10px] px-2 py-0.5 rounded-lg", getBetTypeColor(item.betType))}>
              {item.betType.charAt(0).toUpperCase()}
            </Badge>
            <div>
              <p className="font-bold text-sm">
                {item.position && `${item.position}: `}
                {item.number}
                {item.isBox && <span className="text-[10px] ml-1 text-lottery-box font-semibold">(BOX)</span>}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {item.quantity}× ₹{item.unitPrice} = ₹{item.unitPrice * item.quantity}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 rounded-lg"
            onClick={() => onRemoveItem(item.id)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      ))}

      <div className="space-y-2 pt-3 border-t">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Total</span>
          <span className="font-bold">₹{total.toFixed(0)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Potential Win</span>
          <span className="font-bold text-success">₹{totalPotentialWin.toFixed(0)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Balance</span>
          <span className={cn("font-medium", hasInsufficientBalance && "text-destructive")}>
            ₹{walletBalance.toFixed(0)}
          </span>
        </div>
      </div>

      {hasInsufficientBalance && (
        <p className="text-xs text-destructive text-center">Insufficient balance</p>
      )}

      <Button
        className="w-full h-12 rounded-2xl font-bold text-base"
        onClick={onCheckout}
        disabled={isLoading || hasInsufficientBalance}
      >
        {isLoading ? 'Placing...' : `Place Bets · ₹${total.toFixed(0)}`}
      </Button>
    </div>
  );
}
