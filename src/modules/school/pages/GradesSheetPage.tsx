import { useState, useCallback, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Plus, RefreshCw, Lock, Download } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner'
import { GradeInput } from '../components/GradeInput'
import { AverageBadge } from '../components/AverageBadge'
import { EvaluationTypeBadge } from '../components/EvaluationTypeBadge'
import { AutoSaveIndicator } from '../components/AutoSaveIndicator'
import { EvaluationFormModal } from './EvaluationFormModal'
import {
  useGradesSheet,
  useBulkSaveGrades,
  useRecalculateAverages,
} from '../hooks/useGrades'
import { useSchoolStore } from '../store/schoolStore'
import type { BulkGradeEntry } from '../types/grades.types'
import { calculateWeightedAverage, normalizeScore } from '../lib/gradeHelpers'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export function GradesSheetPage() {
  const [searchParams] = useSearchParams()
  const classeId  = parseInt(searchParams.get('class_id') ?? '0')
  const subjectId = parseInt(searchParams.get('subject_id') ?? '0')
  const periodId  = parseInt(searchParams.get('period_id') ?? '0')
  const { currentYearId } = useSchoolStore()

  const [showEvalModal, setShowEvalModal] = useState(false)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')

  // Local overrides: { [studentId]: { [evalId]: { score, is_absent } } }
  const [localGrades, setLocalGrades] = useState<
    Record<number, Record<string, { score: number | null; is_absent: boolean }>>
  >({})

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { data: sheet, isLoading } = useGradesSheet(classeId, subjectId, periodId)
  const bulkSaveMutation = useBulkSaveGrades()
  const recalcMutation   = useRecalculateAverages()

  const triggerSave = useCallback((
    studentId: number,
    evalId: string,
    score: number | null,
    isAbsent: boolean,
  ) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    setSaveStatus('saving')

    debounceRef.current = setTimeout(() => {
      // Collect all pending changes for this evaluation
      const evalIdNum = parseInt(evalId)

      if (!sheet) return

      const grades: BulkGradeEntry[] = sheet.students.map((row) => {
        const local = localGrades[row.student.id]?.[evalId]
        const original = row.grades[evalId]

        const finalScore   = row.student.id === studentId ? score : (local?.score ?? original?.score ?? null)
        const finalAbsent  = row.student.id === studentId ? isAbsent : (local?.is_absent ?? original?.is_absent ?? false)

        return {
          student_id:        row.student.id,
          score:             finalScore,
          is_absent:         finalAbsent,
          absence_justified: false,
        }
      })

      bulkSaveMutation.mutate(
        { evaluation_id: evalIdNum, grades },
        {
          onSuccess: () => setSaveStatus('saved'),
          onError:   () => setSaveStatus('error'),
        },
      )
    }, 1000)
  }, [sheet, localGrades, bulkSaveMutation])

  const handleScoreChange = (studentId: number, evalId: string, score: number | null) => {
    setLocalGrades((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] ?? {}),
        [evalId]: { score, is_absent: false },
      },
    }))
    triggerSave(studentId, evalId, score, false)
  }

  const handleAbsentChange = (studentId: number, evalId: string, absent: boolean) => {
    setLocalGrades((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] ?? {}),
        [evalId]: { score: absent ? null : null, is_absent: absent },
      },
    }))
    triggerSave(studentId, evalId, null, absent)
  }

  const handleExport = () => {
    if (!sheet) return
    const headers = ['Élève', ...sheet.evaluations.map((ev) => `${ev.title} (/${ev.max_score})`), 'Moyenne /20']
    const rows = sheet.students.map((row) => {
      const scores = sheet.evaluations.map((ev) => {
        const local    = localGrades[row.student.id]?.[String(ev.id)]
        const original = row.grades[String(ev.id)]
        const absent   = local?.is_absent ?? original?.is_absent ?? false
        const score    = local?.score ?? original?.score ?? null
        return absent ? 'ABS' : (score !== null ? String(score) : '')
      })
      const avg = row.period_average !== null ? row.period_average.toFixed(2) : ''
      return [row.student.full_name, ...scores, avg]
    })
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv, ], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `notes_${sheet.classe.display_name}_${sheet.subject.name}_${sheet.period.name}.csv`
      .replace(/[^a-zA-Z0-9_\-. ]/g, '_')
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!classeId || !subjectId || !periodId) {
    return (
      <p className="text-center py-12 text-sm text-gray-400">
        Paramètres manquants. Revenez à la page des notes.
      </p>
    )
  }

  if (isLoading) return <LoadingSpinner />

  if (!sheet) {
    return <p className="text-center py-12 text-sm text-gray-400">Aucune donnée disponible.</p>
  }

  return (
    <div className="space-y-4">
      {/* Back link */}
      <Link
        to={`/school/grades?class_id=${classeId}&subject_id=${subjectId}&period_id=${periodId}`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux évaluations
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">
            {sheet.classe.display_name} — {sheet.subject.name}
          </h1>
          <p className="text-sm text-gray-500">{sheet.period.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <AutoSaveIndicator status={saveStatus} />
          <Button variant="ghost" size="sm" onClick={handleExport}>
            <Download className="mr-1.5 h-4 w-4" />
            Exporter
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => recalcMutation.mutate({ classeId, periodId })}
            disabled={recalcMutation.isPending}
          >
            <RefreshCw className="mr-1.5 h-4 w-4" />
            Recalculer
          </Button>
          <Button size="sm" onClick={() => setShowEvalModal(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Nouvelle évaluation
          </Button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm shadow-sm">
        <span className="text-gray-500">
          Moy. classe : <strong className="text-gray-800">
            {sheet.class_stats.average !== null ? sheet.class_stats.average.toFixed(2) : '—'}
          </strong>
        </span>
        <span className="text-gray-300">|</span>
        <span className="text-gray-500">
          Min : <strong className="text-red-600">{sheet.class_stats.min?.toFixed(2) ?? '—'}</strong>
        </span>
        <span className="text-gray-500">
          Max : <strong className="text-green-600">{sheet.class_stats.max?.toFixed(2) ?? '—'}</strong>
        </span>
        <span className="text-gray-300">|</span>
        <span className="text-gray-500">
          Réussite : <strong className="text-indigo-600">{sheet.class_stats.passing_rate}%</strong>
          {' '}({sheet.class_stats.passing_count}/{sheet.class_stats.total_count})
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600 sticky left-0 bg-gray-50 z-10 min-w-40">
                Élève
              </th>
              {sheet.evaluations.map((ev) => (
                <th key={ev.id} className="px-3 py-3 text-center font-medium text-gray-600 min-w-36">
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex items-center gap-1">
                      <EvaluationTypeBadge type={ev.type.value} color={ev.type.color} />
                      {ev.is_locked && <Lock className="h-3 w-3 text-gray-400" />}
                    </div>
                    <span className="text-xs text-gray-500 font-normal truncate max-w-20" title={ev.title}>
                      {ev.title}
                    </span>
                    <span className="text-xs text-gray-400">/{ev.max_score} · c{ev.coefficient}</span>
                  </div>
                </th>
              ))}
              <th className="px-4 py-3 text-center font-medium text-gray-600 min-w-20">Moy.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sheet.students.map((row) => {
              // Compute local average
              const gradeEntries = sheet.evaluations.map((ev) => {
                const local    = localGrades[row.student.id]?.[String(ev.id)]
                const original = row.grades[String(ev.id)]
                const score    = local?.score ?? original?.score ?? null
                const isAbsent = local?.is_absent ?? original?.is_absent ?? false

                if (isAbsent || score === null) return null

                const scoreOn20 = ev.max_score === 20 ? score : normalizeScore(score, ev.max_score)
                return { score_on_20: scoreOn20, coefficient: ev.coefficient }
              }).filter((x): x is { score_on_20: number; coefficient: number } => x !== null)

              const localAvg = calculateWeightedAverage(gradeEntries)

              return (
                <tr key={row.student.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-medium text-gray-800 sticky left-0 bg-white">
                    {row.student.full_name}
                  </td>
                  {sheet.evaluations.map((ev) => {
                    const local    = localGrades[row.student.id]?.[String(ev.id)]
                    const original = row.grades[String(ev.id)]
                    const score    = local?.score ?? original?.score ?? null
                    const isAbsent = local?.is_absent ?? original?.is_absent ?? false

                    return (
                      <td key={ev.id} className="px-3 py-2 text-center">
                        <GradeInput
                          value={score}
                          isAbsent={isAbsent}
                          maxScore={ev.max_score}
                          disabled={!ev.is_editable}
                          onChange={(val) => handleScoreChange(row.student.id, String(ev.id), val)}
                          onAbsent={(absent) => handleAbsentChange(row.student.id, String(ev.id), absent)}
                        />
                      </td>
                    )
                  })}
                  <td className="px-4 py-2.5 text-center">
                    <AverageBadge average={localAvg ?? row.period_average} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {currentYearId && (
        <EvaluationFormModal
          open={showEvalModal}
          onClose={() => setShowEvalModal(false)}
          classeId={classeId}
          subjectId={subjectId}
          periodId={periodId}
          academicYearId={currentYearId}
        />
      )}
    </div>
  )
}
