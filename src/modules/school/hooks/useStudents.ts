// ===== src/modules/school/hooks/useStudents.ts =====

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { classeKeys } from './useClasses'
import type { ApiError } from '@/shared/types/api.types'
import { toast } from '@/shared/lib/toast'
import type {
  StudentFormData,
  StudentFilters,
  EnrollmentFormData,
  BulkEnrollmentFormData,
  TransferFormData,
} from '../types/students.types'
import {
  getStudents,
  getStudent,
  getStudentStats,
  createStudent,
  updateStudent,
  deleteStudent,
  syncStudentParents,
  importStudents,
  exportStudents,
  getImportTemplate,
  getEnrollments,
  enrollStudent,
  bulkEnrollStudents,
  getClasseStudents,
  transferStudent,
  withdrawStudent,
  getParents,
  createParent,
  updateParent,
  deleteParent,
} from '../api/students.api'

// ── Query Keys ─────────────────────────────────────────────────────────────

export const studentKeys = {
  all: ['students'] as const,
  lists: () => [...studentKeys.all, 'list'] as const,
  list: (filters?: StudentFilters) => [...studentKeys.lists(), filters] as const,
  details: () => [...studentKeys.all, 'detail'] as const,
  detail: (id: number) => [...studentKeys.details(), id] as const,
  stats: (yearId: number) => [...studentKeys.all, 'stats', yearId] as const,
}

export const enrollmentKeys = {
  all: ['enrollments'] as const,
  lists: () => [...enrollmentKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...enrollmentKeys.lists(), filters] as const,
  byClasse: (classeId: number, yearId: number) =>
    [...enrollmentKeys.all, 'classe', classeId, yearId] as const,
}

export const parentKeys = {
  all: ['parents'] as const,
  lists: () => [...parentKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...parentKeys.lists(), filters] as const,
}

// ── Élèves ─────────────────────────────────────────────────────────────────

export function useStudents(filters?: StudentFilters) {
  return useQuery({
    queryKey: studentKeys.list(filters),
    queryFn: () => getStudents(filters),
  })
}

export function useStudent(id: number) {
  return useQuery({
    queryKey: studentKeys.detail(id),
    queryFn: () => getStudent(id),
    enabled: !!id,
  })
}

export function useStudentStats(yearId: number) {
  return useQuery({
    queryKey: studentKeys.stats(yearId),
    queryFn: () => getStudentStats(yearId),
    enabled: !!yearId,
  })
}

export function useCreateStudent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: StudentFormData) => createStudent(data),
    onSuccess: (response) => {
      void queryClient.invalidateQueries({ queryKey: studentKeys.lists() })
      toast.success(`${response.data.full_name} créé avec succès`)
    },
    onError: (error: ApiError) => {
      toast.error(error.message ?? 'Erreur lors de la création')
    },
  })
}

export function useUpdateStudent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<StudentFormData> }) =>
      updateStudent(id, data),
    onSuccess: (response, { id }) => {
      void queryClient.invalidateQueries({ queryKey: studentKeys.detail(id) })
      void queryClient.invalidateQueries({ queryKey: studentKeys.lists() })
      toast.success(`${response.data.full_name} mis à jour`)
    },
    onError: (error: ApiError) => {
      toast.error(error.message ?? 'Erreur lors de la mise à jour')
    },
  })
}

export function useDeleteStudent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => deleteStudent(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: studentKeys.lists() })
      toast.success('Élève supprimé')
    },
    onError: (error: ApiError) => {
      toast.error(error.message ?? 'Impossible de supprimer cet élève')
    },
  })
}

export function useSyncParents() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      parents,
    }: {
      id: number
      parents: Array<{ parent_id: number; is_primary_contact: boolean; can_pickup: boolean }>
    }) => syncStudentParents(id, parents),
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: studentKeys.detail(id) })
      toast.success('Parents mis à jour')
    },
    onError: (error: ApiError) => {
      toast.error(error.message ?? 'Erreur')
    },
  })
}

export function useImportStudents() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (formData: FormData) => importStudents(formData),
    onSuccess: (response) => {
      void queryClient.invalidateQueries({ queryKey: studentKeys.lists() })
      toast.success(`${response.data.created} élève(s) importé(s)`)
    },
    onError: (error: ApiError) => {
      toast.error(error.message ?? "Erreur lors de l'import")
    },
  })
}

export function useExportStudents() {
  return useMutation({
    mutationFn: (filters?: StudentFilters) => exportStudents(filters),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `export_eleves_${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    },
    onError: (error: ApiError) => {
      toast.error(error.message ?? "Erreur lors de l'export")
    },
  })
}

export function useDownloadImportTemplate() {
  return useMutation({
    mutationFn: () => getImportTemplate(),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'template_import_eleves.csv'
      a.click()
      URL.revokeObjectURL(url)
    },
  })
}

// ── Inscriptions ───────────────────────────────────────────────────────────

export function useEnrollments(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: enrollmentKeys.list(filters),
    queryFn: () => getEnrollments(filters),
  })
}

export function useClasseStudents(classeId: number, yearId: number) {
  return useQuery({
    queryKey: enrollmentKeys.byClasse(classeId, yearId),
    queryFn: () => getClasseStudents(classeId, { year_id: yearId }),
    enabled: !!classeId && !!yearId,
  })
}

export function useEnrollStudent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: EnrollmentFormData) => enrollStudent(data),
    onSuccess: (response) => {
      void queryClient.invalidateQueries({ queryKey: enrollmentKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: studentKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: classeKeys.lists() })
      toast.success(`Élève inscrit — N° ${response.data.enrollment_number}`)
    },
    onError: (error: ApiError) => {
      toast.error(error.message ?? "Erreur lors de l'inscription")
    },
  })
}

export function useBulkEnroll() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: BulkEnrollmentFormData) => bulkEnrollStudents(data),
    onSuccess: (response) => {
      void queryClient.invalidateQueries({ queryKey: enrollmentKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: studentKeys.lists() })
      toast.success(`${response.data.enrolled} élève(s) inscrit(s)`)
    },
    onError: (error: ApiError) => {
      toast.error(error.message ?? 'Erreur')
    },
  })
}

export function useTransferStudent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      enrollmentId,
      data,
    }: {
      enrollmentId: number
      data: TransferFormData
    }) => transferStudent(enrollmentId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: enrollmentKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: studentKeys.lists() })
      toast.success('Transfert effectué')
    },
    onError: (error: ApiError) => {
      toast.error(error.message ?? 'Erreur lors du transfert')
    },
  })
}

export function useWithdrawStudent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ enrollmentId, reason }: { enrollmentId: number; reason: string }) =>
      withdrawStudent(enrollmentId, reason),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: enrollmentKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: studentKeys.lists() })
      toast.success('Élève retiré')
    },
    onError: (error: ApiError) => {
      toast.error(error.message ?? 'Erreur')
    },
  })
}

// ── Parents ────────────────────────────────────────────────────────────────

export function useParents(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: parentKeys.list(filters),
    queryFn: () => getParents(filters),
  })
}

export function useCreateParent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Parameters<typeof createParent>[0]) => createParent(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: parentKeys.lists() })
      toast.success('Parent créé')
    },
    onError: (error: ApiError) => {
      toast.error(error.message ?? 'Erreur')
    },
  })
}

export function useUpdateParent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data: Parameters<typeof updateParent>[1]
    }) => updateParent(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: parentKeys.lists() })
      toast.success('Parent mis à jour')
    },
    onError: (error: ApiError) => {
      toast.error(error.message ?? 'Erreur')
    },
  })
}

export function useDeleteParent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => deleteParent(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: parentKeys.lists() })
      toast.success('Parent supprimé')
    },
    onError: (error: ApiError) => {
      toast.error(error.message ?? 'Erreur')
    },
  })
}
