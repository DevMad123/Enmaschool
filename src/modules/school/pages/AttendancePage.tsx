import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardCheck, BarChart2, FileText, Calendar } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { useSchoolStore } from '../store/schoolStore'
import { useAcademicYears } from '../hooks/useAcademicYears'
import { useClasses } from '../hooks/useClasses'
import { useClassAttendanceStats } from '../hooks/useAttendance'
import { AttendanceRateBar } from '../components/AttendanceRateBar'
import { AbsenceRiskBadge } from '../components/AbsenceRiskBadge'
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner'
import { formatAbsenceHours } from '../lib/attendanceHelpers'

type Tab = 'sheet' | 'stats' | 'justifications'

export function AttendancePage() {
  const navigate           = useNavigate()
  const { currentYearId }  = useSchoolStore()
  const [tab,          setTab]          = useState<Tab>('stats')
  const [selectedClassId, setSelectedClassId] = useState<number>(0)
  const [periodId,     setPeriodId]     = useState<number | undefined>()

  const { data: yearsData } = useAcademicYears()
  const years               = yearsData?.data ?? []
  const yearId              = currentYearId ?? 0

  const { data: classesData } = useClasses({ academic_year_id: yearId || undefined })
  const classes               = classesData?.data ?? []

  const { data: classStats, isLoading } = useClassAttendanceStats(
    selectedClassId || undefined,
    periodId,
  )

  const tabs: { id: Tab; label: string; icon: typeof ClipboardCheck }[] = [
    { id: 'sheet',          label: 'Feuille d\'appel', icon: ClipboardCheck },
    { id: 'stats',          label: 'Statistiques',     icon: BarChart2 },
    { id: 'justifications', label: 'Justifications',   icon: FileText },
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
            <ClipboardCheck className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Présences & Absences</h1>
            <p className="text-sm text-slate-500">Suivi des présences par classe et par élève</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1 w-fit">
        {tabs.map((t) => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              onClick={() => {
                if (t.id === 'sheet') navigate('/school/attendance/sheet')
                else if (t.id === 'justifications') navigate('/school/attendance/justifications')
                else setTab(t.id)
              }}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                tab === t.id
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500">Classe</label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(Number(e.target.value))}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm min-w-[200px]"
          >
            <option value={0}>Sélectionner une classe</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.display_name}</option>)}
          </select>
        </div>
        <div className="flex items-end">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={!selectedClassId}
            onClick={() => navigate(`/school/attendance/class/${selectedClassId}`)}
          >
            <BarChart2 className="h-4 w-4" />
            Voir statistiques complètes
          </Button>
        </div>
        <div className="flex items-end ml-auto">
          <Button
            onClick={() => navigate('/school/attendance/sheet')}
            disabled={!selectedClassId}
            size="sm"
            className="gap-1.5"
          >
            <ClipboardCheck className="h-4 w-4" />
            Faire l'appel
          </Button>
        </div>
      </div>

      {/* Stats overview */}
      {tab === 'stats' && (
        <>
          {!selectedClassId ? (
            <div className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 p-12 text-center">
              <BarChart2 className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">Sélectionnez une classe pour voir les statistiques.</p>
            </div>
          ) : isLoading ? (
            <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
          ) : classStats ? (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-lg border border-slate-200 bg-white p-4 text-center">
                  <div className="text-2xl font-bold text-slate-900">{classStats.summary.total_students}</div>
                  <div className="text-xs text-slate-500 mt-1">Élèves inscrits</div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-4 text-center">
                  <div className={`text-2xl font-bold ${classStats.summary.avg_attendance_rate >= 80 ? 'text-green-700' : 'text-orange-600'}`}>
                    {classStats.summary.avg_attendance_rate}%
                  </div>
                  <div className="text-xs text-slate-500 mt-1">Taux moyen de présence</div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-4 text-center">
                  <div className={`text-2xl font-bold ${classStats.summary.students_at_risk > 0 ? 'text-red-600' : 'text-green-700'}`}>
                    {classStats.summary.students_at_risk}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">Élèves à risque</div>
                </div>
              </div>

              {/* Student list */}
              <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Élève</th>
                      <th className="text-center px-3 py-3 text-xs font-medium text-green-700">Présences</th>
                      <th className="text-center px-3 py-3 text-xs font-medium text-red-600">Absences</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 w-48">Taux</th>
                      <th className="px-3 py-3 text-xs font-medium text-slate-500"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {classStats.students.map((s) => (
                      <tr key={s.enrollment_id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                        <td className="px-4 py-2.5">
                          <div className="font-medium text-slate-900">{s.student?.full_name}</div>
                          <div className="text-xs text-slate-400">{s.total_courses} séances</div>
                        </td>
                        <td className="text-center px-3 py-2.5 text-green-700">{s.present + s.late}</td>
                        <td className="text-center px-3 py-2.5">
                          <span className="text-red-600">{s.absent}</span>
                          {s.excused > 0 && <span className="text-blue-600 ml-1">+{s.excused}j</span>}
                        </td>
                        <td className="px-4 py-2.5 min-w-[160px]">
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
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
