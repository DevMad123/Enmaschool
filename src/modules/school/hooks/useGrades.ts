import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ApiError } from '@/shared/types/api.types'
import { toast } from '@/shared/lib/toast'
import type { EvaluationFormData, BulkGradeEntry } from '../types/grades.types'
import { evaluationsApi, gradesApi } from '../api/grades.api'

// ── Query keys ────────────────────────────────────────────────────────────────

export const evaluationKeys = {
  all:    ['evaluations'] as const,
  list:   (filters?: Record<string, unknown>) => ['evaluations', filters] as const,
  detail: (id: number) => ['evaluation', id] as const,
}

export const gradeKeys = {
  sheet:         (classeId: number, subjectId: number, periodId: number) =>
                   ['grades-sheet', classeId, subjectId, periodId] as const,
  studentGrades: (studentId: number, yearId: number) =>
                   ['student-grades', studentId, yearId] as const,
  classGrades:   (classeId: number, periodId: number, yearId: number) =>
                   ['class-grades', classeId, periodId, yearId] as const,
  periodAverages: (filters?: Record<string, unknown>) =>
                   ['period-averages', filters] as const,
}

// ── Évaluations ───────────────────────────────────────────────────────────────

export function useEvaluations(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: evaluationKeys.list(filters),
    queryFn:  () => evaluationsApi.getAll(filters).then((r) => r.data),
  })
}

export function useEvaluation(id: number) {
  return useQuery({
    queryKey: evaluationKeys.detail(id),
    queryFn:  () => evaluationsApi.getOne(id).then((r) => r.data),
    enabled:  !!id,
  })
}

export function useCreateEvaluation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: EvaluationFormData) => evaluationsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: evaluationKeys.all })
      toast.success('Évaluation créée')
    },
    onError: (err: ApiError) => {
      toast.error(err.message ?? 'Erreur lors de la création')
    },
  })
}

export function useUpdateEvaluation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<EvaluationFormData> }) =>
      evaluationsApi.update(id, data),
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: evaluationKeys.detail(vars.id) })
      qc.invalidateQueries({ queryKey: evaluationKeys.all })
      toast.success('Évaluation mise à jour')
    },
    onError: (err: ApiError) => {
      toast.error(err.message ?? 'Erreur lors de la mise à jour')
    },
  })
}

export function useDeleteEvaluation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => evaluationsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: evaluationKeys.all })
      toast.success('Évaluation supprimée')
    },
    onError: (err: ApiError) => {
      toast.error(err.message ?? 'Erreur lors de la suppression')
    },
  })
}

export function useLockEvaluation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => evaluationsApi.lock(id),
    onSuccess: (_res, id) => {
      qc.invalidateQueries({ queryKey: evaluationKeys.detail(id) })
      toast.success('Évaluation verrouillée')
    },
    onError: (err: ApiError) => {
      toast.error(err.message ?? 'Erreur')
    },
  })
}

export function usePublishEvaluation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => evaluationsApi.publish(id),
    onSuccess: (_res, id) => {
      qc.invalidateQueries({ queryKey: evaluationKeys.detail(id) })
      toast.success('Évaluation publiée')
    },
    onError: (err: ApiError) => {
      toast.error(err.message ?? 'Erreur')
    },
  })
}

// ── Notes ─────────────────────────────────────────────────────────────────────

export function useGradesSheet(
  classeId: number,
  subjectId: number,
  periodId: number,
) {
  return useQuery({
    queryKey: gradeKeys.sheet(classeId, subjectId, periodId),
    queryFn:  () =>
      gradesApi
        .getSheet({ class_id: classeId, subject_id: subjectId, period_id: periodId })
        .then((r) => r.data.data),
    enabled:  !!classeId && !!subjectId && !!periodId,
    staleTime: 30 * 1000,
  })
}

export function useBulkSaveGrades() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { evaluation_id: number; grades: BulkGradeEntry[] }) =>
      gradesApi.bulkSave(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['grades-sheet'] })
      qc.invalidateQueries({ queryKey: ['period-averages'] })
    },
    onError: (err: ApiError) => {
      toast.error(err.message ?? 'Erreur lors de la sauvegarde')
    },
  })
}

export function useSaveOneGrade() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ gradeId, data }: { gradeId: number; data: Partial<BulkGradeEntry> }) =>
      gradesApi.saveOne(gradeId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['grades-sheet'] })
    },
    onError: (err: ApiError) => {
      toast.error(err.message ?? 'Erreur')
    },
  })
}

export function useStudentGradesSummary(studentId: number, yearId: number) {
  return useQuery({
    queryKey: gradeKeys.studentGrades(studentId, yearId),
    queryFn:  () =>
      gradesApi.getStudentSummary(studentId, yearId).then((r) => r.data.data),
    enabled:  !!studentId && !!yearId,
  })
}

export function useClassSummary(classeId: number, periodId: number, yearId: number) {
  return useQuery({
    queryKey: gradeKeys.classGrades(classeId, periodId, yearId),
    queryFn:  () =>
      gradesApi
        .getClassSummary(classeId, { period_id: periodId, academic_year_id: yearId })
        .then((r) => r.data),
    enabled:  !!classeId && !!periodId && !!yearId,
  })
}

export function usePeriodAverages(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: gradeKeys.periodAverages(filters),
    queryFn:  () => gradesApi.getPeriodAverages(filters ?? {}).then((r) => r.data),
    enabled:  !!filters && Object.keys(filters).length > 0,
  })
}

export function useRecalculateAverages() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ classeId, periodId }: { classeId: number; periodId: number }) =>
      gradesApi.recalculate(classeId, periodId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['period-averages'] })
      qc.invalidateQueries({ queryKey: ['grades-sheet'] })
      toast.success('Recalcul lancé en arrière-plan')
    },
    onError: (err: ApiError) => {
      toast.error(err.message ?? 'Erreur lors du recalcul')
    },
  })
}
