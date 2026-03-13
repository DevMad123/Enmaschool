// ===== src/shared/components/feedback/LoadingSpinner.tsx =====

import { Loader2 } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
} as const;

export function LoadingSpinner({
  size = 'md',
  fullScreen = false,
}: LoadingSpinnerProps) {
  const spinner = (
    <Loader2 className={cn('animate-spin text-indigo-600', sizeMap[size])} />
  );

  if (fullScreen) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        {spinner}
      </div>
    );
  }

  return spinner;
}
