import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardList, BookOpen, Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner'
import { useSchoolStore } from '../store/schoolStore'
import { useAcademicYears, useAcademicYearPeriods } from '../hooks/useAcademicYears'
import { useClasses } from '../hooks/useClasses'
import { useSubjects } from '../hooks/useSubjects'
import { useEvaluations, useDeleteEvaluation } from '../hooks/useGrades'
import { EvaluationTypeBadge } from '../components/EvaluationTypeBadge'
import { EvaluationFormModal } from './EvaluationFormModal'
import type { Evaluation } from '../types/grades.types'

export function GradesPage() {
  const navigate = useNavigate()
  const { currentYearId } = useSchoolStore()

  const [selectedClassId, setSelectedClassId]   = useState<number>(0)
  const [selectedSubjectId, setSelectedSubjectId] = useState<number>(0)
  const [selectedPeriodId, setSelectedPeriodId]   = useState<number>(0)
  const [selectedYearId, setSelectedYearId]       = useState<number | null>(null)

  // Initialise depuis l'année courante dès qu'elle arrive
  useEffect(() => {
    if (currentYearId && selectedYearId === null) {
      setSelectedYearId(currentYearId)
    }
  }, [currentYearId])

  const yearId = selectedYearId ?? 0

  const { data: yearsData }   = useAcademicYears()
  const years                 = yearsData?.data ?? []

  const { data: periodsData } = useAcademicYearPeriods(yearId)
  const periods               = periodsData?.data ?? []

  const { data: classesData } = useClasses({ academic_year_id: yearId || undefined })
  const classes               = classesData?.data ?? []

  const { data: subjectsData } = useSubjects()
  const subjects               = subjectsData?.data ?? []

  const evalFilters: Record<string, unknown> = {}
  if (selectedClassId)   evalFilters.class_id   = selectedClassId
  if (selectedSubjectId) evalFilters.subject_id  = selectedSubjectId
  if (selectedPeriodId)  evalFilters.period_id   = selectedPeriodId
  if (yearId)            evalFilters.academic_year_id = yearId

  const { data: evalsData, isLoading: evalsLoading } = useEvaluations(
    Object.keys(evalFilters).length > 0 ? evalFilters : undefined,
  )
  const evaluations = evalsData?.data ?? []

  const deleteMutation = useDeleteEvaluation()

  // Modal état
  const [evalModalOpen, setEvalModalOpen]     = useState(false)
  const [editingEval, setEditingEval]         = useState<Evaluation | null>(null)

  const canViewSheet = !!selectedClassId && !!selectedSubjectId && !!selectedPeriodId
  const canAddEval   = !!selectedClassId && !!selectedSubjectId && !!selectedPeriodId && !!selectedYearId


  const openNewEval = () => {
    setEditingEval(null)
    setEvalModalOpen(true)
  }

  const openEditEval = (ev: Evaluation) => {
    setEditingEval(ev)
    setEvalModalOpen(true)
  }

  const handleDelete = (ev: Evaluation) => {
    if (!confirm(`Supprimer l'évaluation "${ev.title}" ?`)) return
    deleteMutation.mutate(ev.id)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-indigo-500" />
            Notes & Évaluations
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Gérez les évaluations et les notes par classe, matière et période
          </p>
        </div>
        <div className="flex gap-2">
          {canAddEval && (
            <Button size="sm" variant="outline" onClick={openNewEval}>
              <Plus className="mr-1.5 h-4 w-4" />
              Nouvelle évaluation
            </Button>
          )}
          {canViewSheet && (
            <Button
              size="sm"
              onClick={() =>
                navigate(
                  `/school/grades/sheet?class_id=${selectedClassId}&subject_id=${selectedSubjectId}&period_id=${selectedPeriodId}`,
                )
              }
            >
              <BookOpen className="mr-1.5 h-4 w-4" />
              Cahier de notes
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Année scolaire */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Année scolaire</label>
          <select
            value={yearId}
            onChange={(e) => {
              const v = parseInt(e.target.value)
              setSelectedYearId(v)
              setSelectedClassId(0)
              setSelectedPeriodId(0)
            }}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value={0}>Toutes les années</option>
            {years.map((y) => (
              <option key={y.id} value={y.id}>{y.name}</option>
            ))}
          </select>
        </div>

        {/* Classe */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Classe</label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(parseInt(e.target.value))}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value={0}>Toutes les classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.display_name}</option>
            ))}
          </select>
        </div>

        {/* Matière */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Matière</label>
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(parseInt(e.target.value))}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value={0}>Toutes les matières</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* Période */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Période</label>
          <select
            value={selectedPeriodId}
            onChange={(e) => setSelectedPeriodId(parseInt(e.target.value))}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value={0}>Toutes les périodes</option>
            {periods.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Aide contextuelle */}
      {!canViewSheet && (
        <p className="text-xs text-gray-400 -mt-2">
          Sélectionnez une classe, une matière et une période pour accéder au cahier de notes et créer des évaluations.
        </p>
      )}

      {/* Evaluations list */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-4 py-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-gray-700">
            Évaluations
            {evaluations.length > 0 && (
              <span className="ml-2 text-xs text-gray-400">({evaluations.length})</span>
            )}
          </h2>
        </div>

        {evalsLoading ? (
          <div className="py-8">
            <LoadingSpinner />
          </div>
        ) : evaluations.length === 0 ? (
          <div className="py-10 text-center space-y-2">
            <p className="text-sm text-gray-400">Aucune évaluation trouvée.</p>
            {canAddEval ? (
              <Button size="sm" variant="outline" onClick={openNewEval}>
                <Plus className="mr-1.5 h-4 w-4" />
                Créer une évaluation
              </Button>
            ) : (
              <p className="text-xs text-gray-400">Filtrez par classe, matière et période pour en créer une.</p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-600">Titre</th>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-600">Type</th>
                  {!selectedClassId && (
                    <th className="px-4 py-2.5 text-left font-medium text-gray-600">Classe</th>
                  )}
                  {!selectedSubjectId && (
                    <th className="px-4 py-2.5 text-left font-medium text-gray-600">Matière</th>
                  )}
                  {!selectedPeriodId && (
                    <th className="px-4 py-2.5 text-left font-medium text-gray-600">Période</th>
                  )}
                  <th className="px-4 py-2.5 text-left font-medium text-gray-600">Date</th>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-600">Barème</th>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-600">Coeff</th>
                  <th className="px-4 py-2.5 text-right font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {evaluations.map((ev) => (
                  <tr key={ev.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-medium text-gray-800">
                      {ev.title}
                      {ev.is_locked && (
                        <span className="ml-2 text-xs text-gray-400">(verrouillé)</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <EvaluationTypeBadge type={ev.type.value} color={ev.type.color} />
                    </td>
                    {!selectedClassId && (
                      <td className="px-4 py-2.5 text-gray-500">{ev.classe?.display_name ?? '—'}</td>
                    )}
                    {!selectedSubjectId && (
                      <td className="px-4 py-2.5 text-gray-500">{ev.subject?.name ?? '—'}</td>
                    )}
                    {!selectedPeriodId && (
                      <td className="px-4 py-2.5 text-gray-500">{ev.period?.name ?? '—'}</td>
                    )}
                    <td className="px-4 py-2.5 text-gray-500">{ev.date}</td>
                    <td className="px-4 py-2.5 text-gray-500">/{ev.max_score}</td>
                    <td className="px-4 py-2.5 text-gray-500">{ev.coefficient}</td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {ev.is_editable && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => openEditEval(ev)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                        )}
                        {ev.classe && ev.subject && ev.period && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() =>
                              navigate(
                                `/school/grades/sheet?class_id=${ev.classe!.id}&subject_id=${ev.subject!.id}&period_id=${ev.period!.id}`,
                              )
                            }
                          >
                            <BookOpen className="h-3 w-3" />
                          </Button>
                        )}
                        {ev.is_editable && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-red-500 hover:text-red-700"
                            onClick={() => handleDelete(ev)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Evaluation form modal */}
      <EvaluationFormModal
        open={evalModalOpen}
        onClose={() => { setEvalModalOpen(false); setEditingEval(null) }}
        classeId={editingEval?.classe?.id ?? selectedClassId}
        subjectId={editingEval?.subject?.id ?? selectedSubjectId}
        periodId={editingEval?.period?.id ?? selectedPeriodId}
        academicYearId={yearId}
        evaluation={editingEval}
      />
    </div>
  )
}
