import type { AttendanceStatus } from '../types/attendance.types'
import { ATTENDANCE_STATUS_BG, ATTENDANCE_STATUS_COLORS, ATTENDANCE_STATUS_SHORT } from '../types/attendance.types'

interface Props {
  status:   AttendanceStatus
  selected: boolean
  onClick:  () => void
  disabled?: boolean
}

export function AttendanceStatusButton({ status, selected, onClick, disabled }: Props) {
  const bg    = ATTENDANCE_STATUS_BG[status]
  const color = ATTENDANCE_STATUS_COLORS[status]
  const short = ATTENDANCE_STATUS_SHORT[status]

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        w-8 h-8 rounded-full text-xs font-bold transition-all border-2
        disabled:opacity-40 disabled:cursor-not-allowed
        ${selected
          ? 'border-current shadow-md scale-110'
          : 'border-slate-200 hover:border-current hover:scale-105 bg-white'
        }
      `}
      style={selected ? { backgroundColor: bg, color, borderColor: color } : { color }}
      title={status}
    >
      {short}
    </button>
  )
}
