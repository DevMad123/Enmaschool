import { getWorkloadColor, getWorkloadPercentage, formatWeeklyHours } from '../lib/teacherHelpers'

interface WorkloadBarProps {
  current: number
  max: number
  compact?: boolean
}

export function WorkloadBar({ current, max, compact = false }: WorkloadBarProps) {
  const percentage = Math.min(getWorkloadPercentage(current, max), 100)
  const color = getWorkloadColor(getWorkloadPercentage(current, max))

  const barColor =
    color === 'red'
      ? 'bg-red-500'
      : color === 'orange'
        ? 'bg-orange-400'
        : 'bg-green-500'

  if (compact) {
    return (
      <div className="flex items-center gap-2 min-w-[120px]">
        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${barColor}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className={`text-xs tabular-nums ${color === 'red' ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
          {formatWeeklyHours(current)}
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{current}h</span>
        <span>{max}h max</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
