// ===== src/modules/school/hooks/useSubjects.ts =====

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ApiError } from '@/shared/types/api.types'
import { toast } from '@/shared/lib/toast'
import type { SubjectFormData, SubjectFilters } from '../types/school.types'
import { getSubjects, getSubject, createSubject, updateSubject, deleteSubject } from '../api/subjects.api'

export const subjectKeys = {
  all: ['subjects'] as const,
  lists: () => [...subjectKeys.all, 'list'] as const,
  list: (filters?: SubjectFilters) => [...subjectKeys.lists(), filters] as const,
  details: () => [...subjectKeys.all, 'detail'] as const,
  detail: (id: number) => [...subjectKeys.details(), id] as const,
}

export function useSubjects(filters?: SubjectFilters) {
  return useQuery({
    queryKey: subjectKeys.list(filters),
    queryFn: () => getSubjects(filters),
  })
}

export function useSubject(id: number) {
  return useQuery({
    queryKey: subjectKeys.detail(id),
    queryFn: () => getSubject(id),
    enabled: !!id,
  })
}

export function useCreateSubject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: SubjectFormData) => createSubject(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: subjectKeys.lists() })
      toast.success('Matière créée avec succès')
    },
    onError: (error: ApiError) => {
      toast.error(error.message)
    },
  })
}

export function useUpdateSubject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<SubjectFormData> }) =>
      updateSubject(id, data),
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: subjectKeys.detail(id) })
      void queryClient.invalidateQueries({ queryKey: subjectKeys.lists() })
      toast.success('Matière mise à jour')
    },
    onError: (error: ApiError) => {
      toast.error(error.message)
    },
  })
}

export function useDeleteSubject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => deleteSubject(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: subjectKeys.lists() })
      toast.success('Matière supprimée')
    },
    onError: (error: ApiError) => {
      toast.error(error.message)
    },
  })
}
