import type { CalendarDay } from '../types/attendance.types'
import { getAttendanceRateColor } from '../lib/attendanceHelpers'

interface Props {
  days:  CalendarDay[]
  month: string  // YYYY-MM
}

const WEEK_DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

function getDayBg(day: CalendarDay): string {
  if (!day.recorded) return '#f8fafc'
  if (day.attendance_rate === null) return '#f1f5f9'
  const rate = day.attendance_rate
  if (rate >= 90) return '#dcfce7'
  if (rate >= 70) return '#ffedd5'
  return '#fee2e2'
}

function getDayColor(day: CalendarDay): string {
  if (!day.recorded || day.attendance_rate === null) return '#94a3b8'
  const rate = day.attendance_rate
  if (rate >= 90) return '#15803d'
  if (rate >= 70) return '#c2410c'
  return '#b91c1c'
}

export function AttendanceCalendarWidget({ days, month }: Props) {
  const firstDay = new Date(`${month}-01`)
  // ISO day of week for first day (1=Mon … 7=Sun)
  const firstIso = ((firstDay.getDay() + 6) % 7) // 0=Mon … 6=Sun

  const byDate = Object.fromEntries(days.map((d) => [d.date, d]))

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      {/* Week day headers */}
      <div className="grid grid-cols-7 mb-1">
        {WEEK_DAYS.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-slate-400 py-1">{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells before first day */}
        {Array.from({ length: firstIso }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {/* Day cells */}
        {days.map((day) => {
          const date    = new Date(day.date)
          const dayNum  = date.getDate()
          const bg      = getDayBg(day)
          const color   = getDayColor(day)
          const tooltip = day.recorded && day.attendance_rate !== null
            ? `Taux: ${day.attendance_rate}%`
            : 'Non saisi'

          return (
            <div
              key={day.date}
              className="aspect-square flex flex-col items-center justify-center rounded text-xs cursor-default"
              style={{ backgroundColor: bg, color }}
              title={tooltip}
            >
              <span className="font-medium">{dayNum}</span>
              {day.recorded && day.attendance_rate !== null && (
                <span className="text-[9px] leading-none">{day.attendance_rate.toFixed(0)}%</span>
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-3 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded bg-[#dcfce7]" /> ≥90%
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded bg-[#ffedd5]" /> 70-90%
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded bg-[#fee2e2]" /> &lt;70%
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded bg-slate-100" /> Non saisi
        </span>
      </div>
    </div>
  )
}
