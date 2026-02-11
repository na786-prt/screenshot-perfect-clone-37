import { useEffect, useState } from 'react';
import { format, differenceInSeconds } from 'date-fns';
import { Timer } from 'lucide-react';

interface LotteryHeaderProps {
  name: string;
  drawTime: string;
}

export function LotteryHeader({ name, drawTime }: LotteryHeaderProps) {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const drawDate = new Date(drawTime);

  useEffect(() => {
    const calc = () => {
      const diff = differenceInSeconds(drawDate, new Date());
      if (diff <= 0) return { hours: 0, minutes: 0, seconds: 0 };
      return {
        hours: Math.floor(diff / 3600),
        minutes: Math.floor((diff % 3600) / 60),
        seconds: diff % 60,
      };
    };
    setTimeLeft(calc());
    const interval = setInterval(() => setTimeLeft(calc()), 1000);
    return () => clearInterval(interval);
  }, [drawDate]);

  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    <div className="bg-gradient-to-br from-primary/10 via-secondary to-secondary/50 rounded-2xl p-4 mb-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-extrabold text-xl tracking-tight">{name}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Draw at {format(drawDate, 'h:mm a')}
          </p>
        </div>

        <div className="flex items-center gap-2 bg-foreground/5 rounded-xl px-3 py-2">
          <Timer className="w-4 h-4 text-primary" />
          <div className="flex items-center gap-0.5 font-mono font-bold text-lg tabular-nums">
            <span>{pad(timeLeft.hours)}</span>
            <span className="text-primary animate-pulse-soft">:</span>
            <span>{pad(timeLeft.minutes)}</span>
            <span className="text-primary animate-pulse-soft">:</span>
            <span>{pad(timeLeft.seconds)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
