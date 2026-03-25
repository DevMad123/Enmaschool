// ===== src/modules/school/components/TrendIndicator.tsx =====

import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface TrendIndicatorProps {
  value: number;
  suffix?: string;
  className?: string;
}

export function TrendIndicator({ value, suffix = '%', className }: TrendIndicatorProps) {
  const isPositive = value > 0;
  const isNeutral  = value === 0;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-xs font-medium',
        isNeutral  && 'text-gray-500',
        isPositive && 'text-green-600',
        !isPositive && !isNeutral && 'text-red-600',
        className,
      )}
    >
      {isNeutral ? (
        <Minus className="h-3 w-3" />
      ) : isPositive ? (
        <TrendingUp className="h-3 w-3" />
      ) : (
        <TrendingDown className="h-3 w-3" />
      )}
      {isPositive ? '+' : ''}{value.toFixed(1)}{suffix}
    </span>
  );
}
