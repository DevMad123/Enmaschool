import { getAttendanceRateColor } from '../lib/attendanceHelpers'

interface Props {
  rate:       number
  threshold?: number
  showLabel?: boolean
  height?:    number
}

export function AttendanceRateBar({ rate, threshold = 80, showLabel = true, height = 6 }: Props) {
  const colorName = getAttendanceRateColor(rate, threshold)

  const bgMap: Record<string, string> = {
    green:  '#22c55e',
    orange: '#f97316',
    red:    '#ef4444',
  }
  const textMap: Record<string, string> = {
    green:  'text-green-700',
    orange: 'text-orange-600',
    red:    'text-red-600',
  }

  return (
    <div className="flex items-center gap-2">
      <div
        className="flex-1 rounded-full bg-slate-100 overflow-hidden"
        style={{ height }}
      >
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${Math.min(rate, 100)}%`, backgroundColor: bgMap[colorName] }}
        />
      </div>
      {showLabel && (
        <span className={`text-xs font-medium tabular-nums w-12 text-right ${textMap[colorName]}`}>
          {rate.toFixed(1)}%
        </span>
      )}
    </div>
  )
}
