import type { AttendanceSummary } from '../types/attendance.types'

interface Props {
  summary: AttendanceSummary
}

export function AttendanceSummaryBar({ summary }: Props) {
  const { present, late, absent, excused, total, attendance_rate } = summary

  const segments = [
    { count: present, color: '#22c55e', label: 'Présents' },
    { count: late,    color: '#f97316', label: 'En retard' },
    { count: excused, color: '#3b82f6', label: 'Justifiés' },
    { count: absent,  color: '#ef4444', label: 'Absents' },
  ]

  return (
    <div className="space-y-1.5">
      {/* Barre segmentée */}
      {total > 0 && (
        <div className="flex h-2 rounded-full overflow-hidden">
          {segments.map(({ count, color, label }) =>
            count > 0 ? (
              <div
                key={label}
                className="h-full transition-all"
                style={{ width: `${(count / total) * 100}%`, backgroundColor: color }}
                title={`${label}: ${count}`}
              />
            ) : null
          )}
        </div>
      )}

      {/* Compteurs */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
        <span className="font-semibold text-green-700">{present} Présents</span>
        {late > 0 && <span className="text-orange-600">{late} En retard</span>}
        {excused > 0 && <span className="text-blue-600">{excused} Justifiés</span>}
        {absent > 0 && <span className="text-red-600">{absent} Absents</span>}
        <span className="ml-auto font-semibold">
          Taux : <span className={attendance_rate >= 80 ? 'text-green-700' : 'text-red-600'}>
            {attendance_rate.toFixed(1)}%
          </span>
        </span>
      </div>
    </div>
  )
}
