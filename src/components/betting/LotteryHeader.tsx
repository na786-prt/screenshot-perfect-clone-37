import { useEffect, useState } from 'react';
import { format, differenceInSeconds } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface LotteryHeaderProps {
  name: string;
  drawTime: string;
  luckyNumbers?: string;
}

export function LotteryHeader({ name, drawTime, luckyNumbers }: LotteryHeaderProps) {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const drawDate = new Date(drawTime);
  const lotteryId = format(drawDate, 'yyyyMMddHHmm');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const diff = differenceInSeconds(drawDate, now);
      
      if (diff <= 0) {
        return { hours: 0, minutes: 0, seconds: 0 };
      }

      const hours = Math.floor(diff / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      const seconds = diff % 60;

      return { hours, minutes, seconds };
    };

    setTimeLeft(calculateTimeLeft());
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, [drawDate]);

  const formatNumber = (num: number) => num.toString().padStart(2, '0');

  const displayNumbers = luckyNumbers?.split('') || ['?', '?', '?'];

  return (
    <div className="bg-gradient-to-r from-secondary to-secondary/50 rounded-xl p-4 mb-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="font-bold text-lg">{name}</h2>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="link" size="sm" className="text-primary h-auto p-0">
                  How to play
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>How to Play</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 text-sm">
                  <p><strong>Single Digit:</strong> Pick any digit (0-9) for position A, B, or C. Win if your digit matches that position.</p>
                  <p><strong>Double Digits:</strong> Pick two digits for positions AB, BC, or AC. Win if both digits match those positions.</p>
                  <p><strong>Three Digits:</strong> Pick all three digits (000-999). Win if the exact number matches, or use BOX for any order.</p>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <p className="text-sm text-muted-foreground mb-2">{lotteryId}</p>
          <div className="flex gap-1">
            {displayNumbers.map((digit, idx) => (
              <div
                key={idx}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                  idx === 0 ? 'bg-lottery-single' : idx === 1 ? 'bg-lottery-double' : 'bg-lottery-triple'
                }`}
              >
                {digit}
              </div>
            ))}
          </div>
        </div>

        <div className="text-right">
          <p className="text-xs text-muted-foreground mb-1">Time remaining</p>
          <div className="flex items-center gap-1">
            <div className="bg-foreground text-background px-2 py-1 rounded font-bold text-xl">
              {formatNumber(timeLeft.hours)}
            </div>
            <span className="text-xl font-bold">:</span>
            <div className="bg-foreground text-background px-2 py-1 rounded font-bold text-xl">
              {formatNumber(timeLeft.minutes)}
            </div>
            <span className="text-xl font-bold">:</span>
            <div className="bg-foreground text-background px-2 py-1 rounded font-bold text-xl">
              {formatNumber(timeLeft.seconds)}
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{format(drawDate, 'hh:mm a')}</p>
        </div>
      </div>
    </div>
  );
}
