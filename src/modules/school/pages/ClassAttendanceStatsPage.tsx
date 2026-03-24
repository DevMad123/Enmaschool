import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { BarChart2, ArrowLeft, ClipboardCheck } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner'
import { useClassAttendanceStats, useClassAttendanceCalendar } from '../hooks/useAttendance'
import { useClasses } from '../hooks/useClasses'
import { useSchoolStore } from '../store/schoolStore'
import { AttendanceRateBar } from '../components/AttendanceRateBar'
import { AbsenceRiskBadge } from '../components/AbsenceRiskBadge'
import { AttendanceCalendarWidget } from '../components/AttendanceCalendarWidget'
import { formatAbsenceHours } from '../lib/attendanceHelpers'

export function ClassAttendanceStatsPage() {
  const { id }            = useParams<{ id: string }>()
  const navigate          = useNavigate()
  const classeId          = Number(id)
  const { currentYearId } = useSchoolStore()

  const [periodId, setPeriodId] = useState<number | undefined>()
  const [month,    setMonth]    = useState<string>(() => new Date().toISOString().slice(0, 7))

  const { data: classesData } = useClasses()
  const classe = classesData?.data?.find((c) => c.id === classeId)

  const { data: stats, isLoading } = useClassAttendanceStats(classeId, periodId)

  const { data: calendarDays } = useClassAttendanceCalendar(
    classeId,
    currentYearId ?? undefined,
    month,
  )

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-slate-500 hover:text-slate-700">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50">
            <BarChart2 className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {classe?.display_name ?? 'Classe'} — Statistiques de présence
            </h1>
            <p className="text-sm text-slate-500">Taux de présence par élève</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => navigate(`/school/attendance/sheet?class_id=${classeId}`)}
        >
          <ClipboardCheck className="h-4 w-4" />
          Faire l'appel
        </Button>
      </div>

      {/* Summary + Calendar side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Summary cards */}
        {stats && (
          <div className="lg:col-span-2 grid grid-cols-3 gap-4">
            <SummaryCard
              label="Élèves inscrits"
              value={String(stats.summary.total_students)}
              color="text-slate-900"
            />
            <SummaryCard
              label="Taux moyen"
              value={`${stats.summary.avg_attendance_rate}%`}
              color={stats.summary.avg_attendance_rate >= 80 ? 'text-green-700' : 'text-orange-600'}
            />
            <SummaryCard
              label="Élèves à risque"
              value={String(stats.summary.students_at_risk)}
              color={stats.summary.students_at_risk > 0 ? 'text-red-600' : 'text-green-700'}
            />
          </div>
        )}

        {/* Calendar widget */}
        <div className="lg:col-span-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Calendrier mensuel</span>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="text-xs rounded border border-slate-300 px-2 py-1"
            />
          </div>
          {calendarDays ? (
            <AttendanceCalendarWidget days={calendarDays} month={month} />
          ) : (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center text-xs text-slate-400">
              Aucune donnée
            </div>
          )}
        </div>
      </div>

      {/* Student table */}
      {isLoading ? (
        <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
      ) : stats ? (
        <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
            <h2 className="text-sm font-semibold text-slate-800">Détail par élève</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Élève</th>
                <th className="text-center px-3 py-2.5 text-xs font-medium text-green-700">Présences</th>
                <th className="text-center px-3 py-2.5 text-xs font-medium text-orange-600">Retards</th>
                <th className="text-center px-3 py-2.5 text-xs font-medium text-red-600">Absences</th>
                <th className="text-center px-3 py-2.5 text-xs font-medium text-blue-600">Justifiés</th>
                <th className="text-center px-3 py-2.5 text-xs font-medium text-slate-500">Heures abs.</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 min-w-[160px]">Taux</th>
                <th className="px-3 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {stats.students.map((s) => (
                <tr key={s.enrollment_id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-2.5">
                    <div className="font-medium text-slate-900">{s.student?.full_name}</div>
                    <div className="text-xs text-slate-400">{s.total_courses} séances</div>
                  </td>
                  <td className="text-center px-3 py-2.5 text-green-700 font-medium">{s.present}</td>
                  <td className="text-center px-3 py-2.5 text-orange-600">{s.late}</td>
                  <td className="text-center px-3 py-2.5 text-red-600 font-medium">{s.absent}</td>
                  <td className="text-center px-3 py-2.5 text-blue-600">{s.excused}</td>
                  <td className="text-center px-3 py-2.5 text-slate-600">
                    {formatAbsenceHours(s.total_absent_hours)}
                  </td>
                  <td className="px-4 py-2.5">
                    <AttendanceRateBar rate={s.attendance_rate} />
                  </td>
                  <td className="px-3 py-2.5">
                    <AbsenceRiskBadge rate={s.attendance_rate} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  )
}

function SummaryCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 text-center">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-slate-500 mt-1">{label}</div>
    </div>
  )
}
