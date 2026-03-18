// ===== src/modules/superadmin/components/StatsCard.tsx =====

import type { LucideIcon } from 'lucide-react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface Trend {
  value: number
  label?: string
}

interface StatsCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  color?: 'indigo' | 'green' | 'amber' | 'red' | 'violet' | 'slate' | 'sky'
  trend?: Trend
  loading?: boolean
}

const colorMap: Record<string, string> = {
  indigo: 'bg-indigo-50 text-indigo-600',
  green: 'bg-green-50 text-green-600',
  amber: 'bg-amber-50 text-amber-600',
  red: 'bg-red-50 text-red-600',
  violet: 'bg-violet-50 text-violet-600',
  slate: 'bg-slate-100 text-slate-600',
  sky: 'bg-sky-50 text-sky-600',
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'indigo',
  trend,
  loading = false,
}: StatsCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-slate-500 truncate">{title}</p>
          {loading ? (
            <div className="mt-1 h-8 w-24 animate-pulse rounded bg-slate-100" />
          ) : (
            <p className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">
              {value}
            </p>
          )}
          {subtitle && (
            <p className="mt-0.5 text-xs text-slate-400 truncate">{subtitle}</p>
          )}
        </div>
        <div className={`shrink-0 rounded-xl p-3 ${colorMap[color] ?? colorMap.indigo}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {trend !== undefined && !loading && (
        <div className="mt-4 flex items-center gap-1.5 text-xs border-t border-slate-100 pt-3">
          {trend.value > 0 ? (
            <TrendingUp className="h-3.5 w-3.5 text-green-500" />
          ) : trend.value < 0 ? (
            <TrendingDown className="h-3.5 w-3.5 text-red-500" />
          ) : (
            <Minus className="h-3.5 w-3.5 text-slate-400" />
          )}
          <span
            className={
              trend.value > 0
                ? 'font-medium text-green-600'
                : trend.value < 0
                  ? 'font-medium text-red-600'
                  : 'font-medium text-slate-500'
            }
          >
            {trend.value > 0 ? '+' : ''}
            {trend.value}
          </span>
          {trend.label && <span className="text-slate-400">{trend.label}</span>}
        </div>
      )}
    </div>
  )
}
