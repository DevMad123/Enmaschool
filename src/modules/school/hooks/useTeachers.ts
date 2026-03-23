// ===== src/modules/school/hooks/useTeachers.ts =====

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ApiError } from '@/shared/types/api.types'
import { toast } from '@/shared/lib/toast'
import type {
  TeacherFormData,
  AssignmentFormData,
  BulkAssignmentFormData,
} from '../types/teachers.types'
import {
  getTeachers,
  getTeacher,
  getTeacherStats,
  createTeacher,
  updateTeacher,
  toggleTeacher,
  getTeacherWorkload,
  getTeacherSubjects,
  syncTeacherSubjects,
  getTeacherAssignments,
  getAssignments,
  assignTeacher,
  updateAssignment,
  bulkAssignTeacher,
  unassignTeacher,
  getClasseAssignments,
  setMainTeacher,
} from '../api/teachers.api'

// ── Query Keys ─────────────────────────────────────────────────────────────

export const teacherKeys = {
  all: ['teachers'] as const,
  lists: () => [...teacherKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...teacherKeys.lists(), filters] as const,
  details: () => [...teacherKeys.all, 'detail'] as const,
  detail: (id: number) => [...teacherKeys.details(), id] as const,
  stats: (yearId: number) => [...teacherKeys.all, 'stats', yearId] as const,
  workload: (id: number, yearId: number) => [...teacherKeys.all, 'workload', id, yearId] as const,
  subjects: (id: number) => [...teacherKeys.all, 'subjects', id] as const,
  assignments: (id: number, yearId: number) =>
    [...teacherKeys.all, 'assignments', id, yearId] as const,
}

export const assignmentKeys = {
  all: ['assignments'] as const,
  lists: () => [...assignmentKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...assignmentKeys.lists(), filters] as const,
  byClasse: (classeId: number, yearId: number) =>
    ['classe-assignments', classeId, yearId] as const,
}

// ── Enseignants ─────────────────────────────────────────────────────────────

export function useCreateTeacher() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Parameters<typeof createTeacher>[0]) => createTeacher(data),
    onSuccess: (response) => {
      void queryClient.invalidateQueries({ queryKey: teacherKeys.lists() })
      toast.success(`${response.data.full_name} créé avec succès`)
    },
    onError: (error: ApiError) => {
      toast.error(error.message ?? 'Erreur lors de la création')
    },
  })
}

export function useTeachers(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: teacherKeys.list(filters),
    queryFn: () => getTeachers(filters),
  })
}

export function useTeacher(id: number) {
  return useQuery({
    queryKey: teacherKeys.detail(id),
    queryFn: () => getTeacher(id),
    enabled: !!id,
  })
}

export function useTeacherStats(yearId: number) {
  return useQuery({
    queryKey: teacherKeys.stats(yearId),
    queryFn: () => getTeacherStats(yearId),
    enabled: !!yearId,
  })
}

export function useUpdateTeacher() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: TeacherFormData }) => updateTeacher(id, data),
    onSuccess: (response, { id }) => {
      void queryClient.invalidateQueries({ queryKey: teacherKeys.detail(id) })
      void queryClient.invalidateQueries({ queryKey: teacherKeys.lists() })
      toast.success(`${response.data.full_name} mis à jour`)
    },
    onError: (error: ApiError) => {
      toast.error(error.message ?? 'Erreur lors de la mise à jour')
    },
  })
}

export function useToggleTeacher() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => toggleTeacher(id),
    onSuccess: (response) => {
      void queryClient.invalidateQueries({ queryKey: teacherKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: teacherKeys.detail(response.data.id) })
      toast.success(response.data.is_active ? 'Enseignant activé' : 'Enseignant désactivé')
    },
    onError: (error: ApiError) => {
      toast.error(error.message ?? 'Erreur')
    },
  })
}

export function useTeacherWorkload(id: number, yearId: number) {
  return useQuery({
    queryKey: teacherKeys.workload(id, yearId),
    queryFn: () => getTeacherWorkload(id, yearId),
    enabled: !!id && !!yearId,
  })
}

export function useTeacherSubjects(id: number) {
  return useQuery({
    queryKey: teacherKeys.subjects(id),
    queryFn: () => getTeacherSubjects(id),
    enabled: !!id,
  })
}

export function useSyncTeacherSubjects() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data: { subject_ids: number[]; primary_subject_id?: number | null }
    }) => syncTeacherSubjects(id, data),
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: teacherKeys.subjects(id) })
      void queryClient.invalidateQueries({ queryKey: teacherKeys.detail(id) })
      toast.success('Matières mises à jour')
    },
    onError: (error: ApiError) => {
      toast.error(error.message ?? 'Erreur lors de la mise à jour des matières')
    },
  })
}

export function useTeacherAssignments(id: number, yearId: number) {
  return useQuery({
    queryKey: teacherKeys.assignments(id, yearId),
    queryFn: () => getTeacherAssignments(id, yearId),
    enabled: !!id && !!yearId,
  })
}

// ── Affectations ────────────────────────────────────────────────────────────

export function useAssignments(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: assignmentKeys.list(filters),
    queryFn: () => getAssignments(filters),
  })
}

export function useClasseAssignments(classeId: number, yearId: number) {
  return useQuery({
    queryKey: assignmentKeys.byClasse(classeId, yearId),
    queryFn: () => getClasseAssignments(classeId, yearId),
    enabled: !!classeId && !!yearId,
  })
}

export function useAssignTeacher() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: AssignmentFormData) => assignTeacher(data),
    onSuccess: (response, variables) => {
      void queryClient.invalidateQueries({ queryKey: assignmentKeys.lists() })
      void queryClient.invalidateQueries({
        queryKey: assignmentKeys.byClasse(response.data.classe?.id ?? 0, response.data.academic_year?.id ?? 0),
      })
      // Invalidate teacher detail so new assignment shows without refresh
      void queryClient.invalidateQueries({ queryKey: teacherKeys.details() })
      void queryClient.invalidateQueries({ queryKey: teacherKeys.detail(variables.teacher_id) })

      if (response.data.warning) {
        toast.warning(response.data.warning)
      } else {
        toast.success('Enseignant affecté avec succès')
      }
    },
    onError: (error: ApiError) => {
      toast.error(error.message ?? "Erreur lors de l'affectation")
    },
  })
}

export function useBulkAssignTeacher() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: BulkAssignmentFormData) => bulkAssignTeacher(data),
    onSuccess: (response) => {
      void queryClient.invalidateQueries({ queryKey: assignmentKeys.lists() })
      void queryClient.invalidateQueries({
        queryKey: teacherKeys.assignments(response.data.assigned, 0),
      })
      toast.success(
        `${response.data.assigned} affectation(s) créée(s)` +
          (response.data.skipped ? `, ${response.data.skipped} ignorée(s)` : ''),
      )
    },
    onError: (error: ApiError) => {
      toast.error(error.message ?? "Erreur lors de l'affectation en masse")
    },
  })
}

export function useUpdateAssignment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data: { hours_per_week?: number | null; notes?: string | null; assigned_at?: string }
    }) => updateAssignment(id, data),
    onSuccess: (response) => {
      void queryClient.invalidateQueries({ queryKey: assignmentKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: teacherKeys.details() })
      if (response.data.classe?.id && response.data.academic_year?.id) {
        void queryClient.invalidateQueries({
          queryKey: assignmentKeys.byClasse(response.data.classe.id, response.data.academic_year.id),
        })
      }
      toast.success('Affectation mise à jour')
    },
    onError: (error: ApiError) => {
      toast.error(error.message ?? "Erreur lors de la mise à jour")
    },
  })
}

export function useUnassignTeacher() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => unassignTeacher(id),
    onSuccess: (response) => {
      void queryClient.invalidateQueries({ queryKey: assignmentKeys.lists() })
      void queryClient.invalidateQueries({
        queryKey: assignmentKeys.byClasse(
          response.data.classe?.id ?? 0,
          response.data.academic_year?.id ?? 0,
        ),
      })
      toast.success('Affectation annulée')
    },
    onError: (error: ApiError) => {
      toast.error(error.message ?? "Erreur lors de l'annulation")
    },
  })
}

export function useSetMainTeacher() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ classeId, teacherId }: { classeId: number; teacherId: number }) =>
      setMainTeacher(classeId, teacherId),
    onSuccess: (_, { classeId }) => {
      void queryClient.invalidateQueries({ queryKey: ['classes', classeId] })
      void queryClient.invalidateQueries({ queryKey: ['classes', 'list'] })
      toast.success('Professeur principal défini')
    },
    onError: (error: ApiError) => {
      toast.error(error.message ?? 'Erreur')
    },
  })
}
