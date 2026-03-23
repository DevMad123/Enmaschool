import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner'
import { useClassSummary } from '../hooks/useGrades'
import { useSchoolStore } from '../store/schoolStore'
import { useAcademicYearPeriods } from '../hooks/useAcademicYears'
import { AverageBadge } from '../components/AverageBadge'
import type { PeriodAverage } from '../types/grades.types'

export function ClassGradesSummaryPage() {
  const { id }            = useParams<{ id: string }>()
  const classeId          = parseInt(id ?? '0')
  const { currentYearId } = useSchoolStore()
  const yearId            = currentYearId ?? 0

  const { data: periodsData } = useAcademicYearPeriods(yearId)
  const periods               = periodsData?.data ?? []

  const [selectedPeriodId, setSelectedPeriodId] = useState<number>(0)
  const periodId = selectedPeriodId || periods[0]?.id || 0

  const { data: summaryData, isLoading } = useClassSummary(classeId, periodId, yearId)
  const averages: PeriodAverage[] = (summaryData as { data?: PeriodAverage[] })?.data ?? []

  // Build subject × student matrix
  const subjects = [...new Map(averages.map((a) => [a.subject?.id, a.subject])).values()]
    .filter(Boolean)
  const students = [...new Map(averages.map((a) => [a.student?.id, a.student])).values()]
    .filter(Boolean)

  const getAvg = (studentId: number, subjectId: number) =>
    averages.find((a) => a.student?.id === studentId && a.subject?.id === subjectId)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Résultats de la classe</h2>
          <p className="text-sm text-gray-500">Tableau des moyennes par élève et matière</p>
        </div>
        <select
          value={selectedPeriodId}
          onChange={(e) => setSelectedPeriodId(parseInt(e.target.value))}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        >
          <option value={0}>Sélectionner une période</option>
          {periods.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : students.length === 0 ? (
        <p className="text-center py-10 text-sm text-gray-400">
          Aucune donnée. Sélectionnez une période et assurez-vous que les moyennes ont été calculées.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium text-gray-600 sticky left-0 bg-gray-50 min-w-40">Élève</th>
                {subjects.map((s) => (
                  <th key={s?.id} className="px-3 py-2.5 text-center font-medium text-gray-600 min-w-20">
                    <div className="flex flex-col items-center gap-0.5">
                      <span>{s?.name}</span>
                      <span className="text-xs text-gray-400 font-normal">coeff {s?.coefficient}</span>
                    </div>
                  </th>
                ))}
                <th className="px-4 py-2.5 text-center font-medium text-gray-600 min-w-20">Moy. gén.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {students.map((student) => {
                // Compute general average
                const studentAvgs = subjects.map((s) => {
                  const a = getAvg(student!.id, s!.id)
                  return a && a.weighted_average !== null
                    ? { wa: (a.weighted_average as unknown as number), c: (a.coefficient as unknown as number) }
                    : null
                }).filter(Boolean) as Array<{ wa: number; c: number }>

                const totalWA   = studentAvgs.reduce((sum, x) => sum + x.wa, 0)
                const totalCoef = studentAvgs.reduce((sum, x) => sum + x.c, 0)
                const genAvg    = totalCoef > 0 ? totalWA / totalCoef : null

                return (
                  <tr key={student?.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium text-gray-800 sticky left-0 bg-white">
                      {student?.full_name}
                    </td>
                    {subjects.map((s) => {
                      const avg = getAvg(student!.id, s!.id)
                      return (
                        <td key={s?.id} className="px-3 py-2 text-center">
                          <AverageBadge average={avg?.average ?? null} />
                        </td>
                      )
                    })}
                    <td className="px-4 py-2 text-center">
                      <AverageBadge average={genAvg} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
            {/* Class stats row */}
            <tfoot className="border-t border-gray-200 bg-gray-50">
              <tr>
                <td className="px-4 py-2 text-xs font-semibold text-gray-500 sticky left-0 bg-gray-50">
                  Moy. classe
                </td>
                {subjects.map((s) => {
                  const subAvgs = averages
                    .filter((a) => a.subject?.id === s?.id && a.class_average !== null)
                  const classAvg = subAvgs[0]?.class_average ?? null
                  return (
                    <td key={s?.id} className="px-3 py-2 text-center">
                      <AverageBadge average={classAvg as number | null} />
                    </td>
                  )
                })}
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}
