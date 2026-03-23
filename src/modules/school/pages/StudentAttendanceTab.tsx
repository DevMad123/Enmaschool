import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Plus } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner'
import {
  useStudentAttendanceStats,
  useStudentAttendanceHistory,
  useJustifications,
} from '../hooks/useAttendance'
import { AttendanceStatusBadge } from '../components/AttendanceStatusBadge'
import { AttendanceRateBar } from '../components/AttendanceRateBar'
import { AbsenceRiskBadge } from '../components/AbsenceRiskBadge'
import { JustificationStatusBadge } from '../components/JustificationStatusBadge'
import { SubmitJustificationModal } from './SubmitJustificationModal'
import { formatAbsenceHours } from '../lib/attendanceHelpers'
import type { Attendance } from '../types/attendance.types'

interface Props {
  enrollmentId: number
  periodId?:    number
}

export function StudentAttendanceTab({ enrollmentId, periodId }: Props) {
  const [justifyOpen, setJustifyOpen] = useState(false)

  const { data: stats, isLoading: loadingStats } = useStudentAttendanceStats(enrollmentId, periodId)
  const { data: historyData, isLoading: loadingHistory } = useStudentAttendanceHistory(enrollmentId, { status: 'absent', per_page: 20 })
  const { data: justifData } = useJustifications({ enrollment_id: enrollmentId })

  const history      = historyData?.data ?? []
  const justifications = justifData?.data ?? []

  if (loadingStats) return <div className="flex justify-center py-10"><LoadingSpinner /></div>

  return (
    <div className="space-y-6">
      {/* Stats globales */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Taux de présence" value={`${stats.attendance_rate}%`} sub={<AttendanceRateBar rate={stats.attendance_rate} showLabel={false} />} />
          <StatCard label="Heures d'absence" value={formatAbsenceHours(stats.total_absent_hours)} sub={`${stats.absent} séances`} />
          <StatCard label="Absences justifiées" value={formatAbsenceHours(stats.excused_hours)} sub={`${stats.excused} séances`} colorClass="text-blue-700" />
          <StatCard label="Non justifiées" value={formatAbsenceHours(stats.absent_hours)} sub={`${stats.absent} séances`} colorClass="text-red-600" />
        </div>
      )}
      {stats && <AbsenceRiskBadge rate={stats.attendance_rate} />}

      {/* Historique des absences */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-800">Absences récentes</h3>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setJustifyOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            Soumettre une justification
          </Button>
        </div>

        {loadingHistory ? (
          <LoadingSpinner />
        ) : history.length === 0 ? (
          <p className="text-sm text-slate-500">Aucune absence enregistrée.</p>
        ) : (
          <div className="rounded-lg border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-2 text-xs font-medium text-slate-500">Date</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-slate-500">Cours</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-slate-500">Statut</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-slate-500">Note</th>
                </tr>
              </thead>
              <tbody>
                {history.map((att: Attendance) => (
                  <tr key={att.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-2.5 text-slate-700">{att.date}</td>
                    <td className="px-4 py-2.5 text-slate-600">
                      {att.timetable_entry
                        ? `${att.timetable_entry.subject.name} — ${att.timetable_entry.time_slot.time_range}`
                        : 'Journée entière'}
                    </td>
                    <td className="px-4 py-2.5">
                      <AttendanceStatusBadge status={att.status.value} />
                    </td>
                    <td className="px-4 py-2.5 text-slate-500 text-xs">{att.note ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Justifications */}
      {justifications.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Justifications soumises</h3>
          <div className="space-y-2">
            {justifications.map((j) => (
              <div key={j.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3">
                <div>
                  <div className="text-sm font-medium text-slate-900">{j.reason}</div>
                  <div className="text-xs text-slate-500">{j.date_from} → {j.date_to} ({j.days_count} jour{j.days_count > 1 ? 's' : ''})</div>
                </div>
                <JustificationStatusBadge status={j.status.value} />
              </div>
            ))}
          </div>
        </div>
      )}

      <SubmitJustificationModal
        open={justifyOpen}
        onClose={() => setJustifyOpen(false)}
        enrollmentId={enrollmentId}
      />
    </div>
  )
}

function StatCard({
  label, value, sub, colorClass = 'text-slate-900'
}: {
  label: string; value: string; sub: React.ReactNode; colorClass?: string
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="text-xs font-medium text-slate-500 mb-1">{label}</div>
      <div className={`text-2xl font-bold ${colorClass}`}>{value}</div>
      <div className="mt-1 text-xs text-slate-500">{sub}</div>
    </div>
  )
}
