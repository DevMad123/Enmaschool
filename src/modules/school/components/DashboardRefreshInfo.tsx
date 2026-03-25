// ===== src/modules/school/components/DashboardRefreshInfo.tsx =====

import { RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { formatCacheAge } from '../lib/dashboardHelpers';
import { cn } from '@/shared/lib/utils';

interface DashboardRefreshInfoProps {
  generatedAt: string;
  cacheTtl?: number;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export function DashboardRefreshInfo({
  generatedAt,
  cacheTtl,
  onRefresh,
  isRefreshing = false,
}: DashboardRefreshInfoProps) {
  const [age, setAge] = useState(() => formatCacheAge(generatedAt));

  useEffect(() => {
    setAge(formatCacheAge(generatedAt));
    const interval = setInterval(() => setAge(formatCacheAge(generatedAt)), 30_000);
    return () => clearInterval(interval);
  }, [generatedAt]);

  const progress = cacheTtl
    ? Math.max(
        0,
        100 - ((Date.now() - new Date(generatedAt).getTime()) / 1000 / cacheTtl) * 100,
      )
    : null;

  return (
    <div className="flex items-center gap-3 text-xs text-gray-400">
      <span>Mis à jour {age}</span>
      {progress !== null && (
        <div className="h-1 w-20 rounded-full bg-gray-200 overflow-hidden">
          <div
            className="h-full rounded-full bg-blue-400 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      <button
        onClick={onRefresh}
        disabled={isRefreshing}
        className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
      >
        <RefreshCw className={cn('h-3 w-3', isRefreshing && 'animate-spin')} />
        Actualiser
      </button>
    </div>
  );
}
