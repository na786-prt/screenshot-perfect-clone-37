import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, ShoppingCart } from 'lucide-react';
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

export function BetCart({ 
  items, 
  onRemoveItem, 
  onCheckout, 
  isLoading,
  walletBalance 
}: BetCartProps) {
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

  return (
    <Card className="sticky top-20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ShoppingCart className="w-5 h-5" />
          Your Bets ({items.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            No bets added yet
          </p>
        ) : (
          items.map((item) => (
            <div 
              key={item.id} 
              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <Badge className={cn("text-white", getBetTypeColor(item.betType))}>
                  {item.betType.charAt(0).toUpperCase() + item.betType.slice(1)}
                </Badge>
                <div>
                  <p className="font-semibold">
                    {item.position && `${item.position}: `}
                    {item.number}
                    {item.isBox && <span className="text-xs ml-1 text-lottery-box">(BOX)</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.quantity}x ₹{item.unitPrice} = ₹{item.unitPrice * item.quantity}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => onRemoveItem(item.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))
        )}
      </CardContent>
      
      {items.length > 0 && (
        <CardFooter className="flex-col gap-3 pt-3 border-t">
          <div className="w-full space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Amount</span>
              <span className="font-bold">₹{total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Potential Win</span>
              <span className="font-bold text-success">₹{totalPotentialWin.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Wallet Balance</span>
              <span className={cn("font-medium", hasInsufficientBalance && "text-destructive")}>
                ₹{walletBalance.toFixed(2)}
              </span>
            </div>
          </div>
          
          {hasInsufficientBalance && (
            <p className="text-xs text-destructive text-center">
              Insufficient balance. Please add funds to your wallet.
            </p>
          )}
          
          <Button 
            className="w-full" 
            size="lg"
            onClick={onCheckout}
            disabled={isLoading || hasInsufficientBalance}
          >
            {isLoading ? 'Placing Bets...' : `Place Bets (₹${total.toFixed(2)})`}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
