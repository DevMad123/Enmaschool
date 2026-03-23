import { AlertTriangle } from 'lucide-react'
import { getWorkloadColor, getWorkloadPercentage } from '../lib/teacherHelpers'

interface WorkloadGaugeProps {
  current: number
  max: number
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function WorkloadGauge({ current, max, showLabel = true, size = 'md' }: WorkloadGaugeProps) {
  const rawPct = getWorkloadPercentage(current, max)
  const percentage = Math.min(rawPct, 100)
  const isOverloaded = rawPct > 100
  const color = getWorkloadColor(rawPct)

  const barColor =
    color === 'red'
      ? 'bg-red-500'
      : color === 'orange'
        ? 'bg-orange-400'
        : 'bg-green-500'

  const textColor =
    color === 'red' ? 'text-red-600' : color === 'orange' ? 'text-orange-500' : 'text-green-600'

  const heightClass = size === 'sm' ? 'h-2' : size === 'lg' ? 'h-4' : 'h-3'
  const textClass = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base font-semibold' : 'text-sm'

  return (
    <div className="space-y-1.5">
      <div className={`${heightClass} bg-gray-100 rounded-full overflow-hidden`}>
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {showLabel && (
        <div className={`flex items-center justify-between ${textClass}`}>
          <span className={isOverloaded ? textColor : 'text-gray-600'}>
            {current}h / {max}h
          </span>
          {isOverloaded && (
            <span className={`flex items-center gap-1 ${textColor}`}>
              <AlertTriangle className="h-3.5 w-3.5" />
              Dépassement
            </span>
          )}
        </div>
      )}
    </div>
  )
}
