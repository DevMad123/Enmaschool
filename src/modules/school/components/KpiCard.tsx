// ===== src/modules/school/components/KpiCard.tsx =====

import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { cn } from '@/shared/lib/utils';
import { TrendIndicator } from './TrendIndicator';

interface KpiCardProps {
  title: string;
  value: string | number;
  unit?: string;
  trend?: number;
  trendLabel?: string;
  icon?: React.ReactNode;
  color?: string;
  onClick?: () => void;
  href?: string;
  loading?: boolean;
  subtitle?: string;
}

export function KpiCard({
  title,
  value,
  unit,
  trend,
  trendLabel,
  icon,
  color = '#2563eb',
  onClick,
  href,
  loading = false,
  subtitle,
}: KpiCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) onClick();
    else if (href) navigate(href);
  };

  const isClickable = !!(onClick || href);

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <Skeleton className="h-4 w-24 mb-3" />
        <Skeleton className="h-8 w-20 mb-2" />
        <Skeleton className="h-3 w-16" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-xl border border-gray-200 bg-white p-5 shadow-sm',
        isClickable && 'cursor-pointer transition-shadow hover:shadow-md hover:border-blue-200',
      )}
      onClick={isClickable ? handleClick : undefined}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-gray-900 truncate">{value}</span>
            {unit && <span className="text-sm text-gray-500">{unit}</span>}
          </div>
          {subtitle && <p className="mt-1 text-xs text-gray-400">{subtitle}</p>}
          {trend !== undefined && (
            <div className="mt-2 flex items-center gap-1">
              <TrendIndicator value={trend} />
              {trendLabel && <span className="text-xs text-gray-400">{trendLabel}</span>}
            </div>
          )}
        </div>
        {icon && (
          <div
            className="ml-3 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${color}20`, color }}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
