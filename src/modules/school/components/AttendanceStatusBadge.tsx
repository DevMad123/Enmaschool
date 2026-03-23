import type { AttendanceStatus } from '../types/attendance.types'
import { ATTENDANCE_STATUS_BG, ATTENDANCE_STATUS_COLORS, ATTENDANCE_STATUS_LABELS, ATTENDANCE_STATUS_SHORT } from '../types/attendance.types'

interface Props {
  status: AttendanceStatus | null
  variant?: 'badge' | 'dot' | 'short'
}

export function AttendanceStatusBadge({ status, variant = 'badge' }: Props) {
  if (!status) {
    return <span className="text-slate-300 text-xs">—</span>
  }

  const bg    = ATTENDANCE_STATUS_BG[status]
  const color = ATTENDANCE_STATUS_COLORS[status]
  const label = ATTENDANCE_STATUS_LABELS[status]
  const short = ATTENDANCE_STATUS_SHORT[status]

  if (variant === 'dot') {
    return (
      <span
        className="inline-block w-2.5 h-2.5 rounded-full"
        style={{ backgroundColor: color }}
        title={label}
      />
    )
  }

  if (variant === 'short') {
    return (
      <span
        className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold"
        style={{ backgroundColor: bg, color }}
        title={label}
      >
        {short}
      </span>
    )
  }

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: bg, color }}
    >
      {label}
    </span>
  )
}
