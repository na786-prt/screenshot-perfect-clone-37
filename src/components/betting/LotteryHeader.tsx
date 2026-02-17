import { useEffect, useState } from 'react';
import { format, differenceInSeconds } from 'date-fns';
import { Timer, Zap } from 'lucide-react';

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
  const isExpired = timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0;

  return (
    <div className="gradient-primary rounded-2xl p-4 mb-4 text-primary-foreground shadow-glow">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <Zap className="w-4 h-4" />
            <span className="text-xs font-medium opacity-80">LIVE DRAW</span>
          </div>
          <h2 className="font-extrabold text-xl tracking-tight">{name}</h2>
          <p className="text-sm opacity-80 mt-0.5">
            Draw at {format(drawDate, 'h:mm a')}
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-xl px-3 py-2">
          <Timer className="w-4 h-4 opacity-80" />
          <div className="flex items-center gap-0.5 font-mono font-bold text-lg tabular-nums">
            {isExpired ? (
              <span className="text-sm font-semibold">Ended</span>
            ) : (
              <>
                <span>{pad(timeLeft.hours)}</span>
                <span className="animate-pulse-soft">:</span>
                <span>{pad(timeLeft.minutes)}</span>
                <span className="animate-pulse-soft">:</span>
                <span>{pad(timeLeft.seconds)}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
