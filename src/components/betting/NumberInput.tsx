import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Shuffle } from 'lucide-react';
import { BetType } from './BetTypeSelector';

interface NumberInputProps {
  betType: BetType;
  value: string;
  onChange: (value: string) => void;
}

export function NumberInput({ betType, value, onChange }: NumberInputProps) {
  const maxLength = betType === 'single' ? 1 : betType === 'double' ? 2 : 3;
  const placeholder = betType === 'single' ? '0-9' : betType === 'double' ? '00-99' : '000-999';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '').slice(0, maxLength);
    onChange(val);
  };

  const handleQuickGuess = () => {
    let randomNum = '';
    for (let i = 0; i < maxLength; i++) {
      randomNum += Math.floor(Math.random() * 10).toString();
    }
    onChange(randomNum);
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-muted-foreground">
        Enter Number
      </label>
      <div className="flex gap-2">
        <Input
          type="text"
          inputMode="numeric"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          className="text-center text-2xl font-bold tracking-widest h-14"
          maxLength={maxLength}
        />
        <Button 
          type="button" 
          variant="outline" 
          className="h-14 px-4"
          onClick={handleQuickGuess}
        >
          <Shuffle className="w-5 h-5 mr-2" />
          Quick
        </Button>
      </div>
    </div>
  );
}
