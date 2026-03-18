// ===== src/modules/school/hooks/useClasses.ts =====

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ApiError } from '@/shared/types/api.types'
import { toast } from '@/shared/lib/toast'
import type { ClasseFormData, BulkClasseFormData, ClasseFilters } from '../types/school.types'
import {
  getClasses,
  getClasse,
  getClasseOptions,
  createClasse,
  bulkCreateClasses,
  updateClasse,
  deleteClasse,
  getClasseSubjects,
  syncClasseSubjects,
} from '../api/classes.api'

export const classeKeys = {
  all: ['classes'] as const,
  lists: () => [...classeKeys.all, 'list'] as const,
  list: (filters?: ClasseFilters) => [...classeKeys.lists(), filters] as const,
  details: () => [...classeKeys.all, 'detail'] as const,
  detail: (id: number) => [...classeKeys.details(), id] as const,
  options: () => [...classeKeys.all, 'options'] as const,
  subjects: (id: number) => [...classeKeys.detail(id), 'subjects'] as const,
}

export function useClasses(filters?: ClasseFilters) {
  return useQuery({
    queryKey: classeKeys.list(filters),
    queryFn: () => getClasses(filters),
  })
}

export function useClasse(id: number) {
  return useQuery({
    queryKey: classeKeys.detail(id),
    queryFn: () => getClasse(id),
    enabled: !!id,
  })
}

export function useClasseOptions() {
  return useQuery({
    queryKey: classeKeys.options(),
    queryFn: () => getClasseOptions(),
    staleTime: Infinity,
  })
}

export function useClasseSubjects(id: number) {
  return useQuery({
    queryKey: classeKeys.subjects(id),
    queryFn: () => getClasseSubjects(id),
    enabled: !!id,
  })
}

export function useCreateClasse() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ClasseFormData) => createClasse(data),
    onSuccess: (response) => {
      void queryClient.invalidateQueries({ queryKey: classeKeys.lists() })
      toast.success(`${response.data.display_name} créée avec succès`)
    },
    onError: (error: ApiError) => {
      toast.error(error.message)
    },
  })
}

export function useBulkCreateClasses() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: BulkClasseFormData) => bulkCreateClasses(data),
    onSuccess: (response) => {
      void queryClient.invalidateQueries({ queryKey: classeKeys.lists() })
      toast.success(`${response.data.length} classe(s) créée(s) avec succès`)
    },
    onError: (error: ApiError) => {
      toast.error(error.message)
    },
  })
}

export function useUpdateClasse() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ClasseFormData> }) =>
      updateClasse(id, data),
    onSuccess: (response, { id }) => {
      void queryClient.invalidateQueries({ queryKey: classeKeys.detail(id) })
      void queryClient.invalidateQueries({ queryKey: classeKeys.lists() })
      toast.success(`${response.data.display_name} mise à jour`)
    },
    onError: (error: ApiError) => {
      toast.error(error.message)
    },
  })
}

export function useDeleteClasse() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => deleteClasse(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: classeKeys.lists() })
      toast.success('Classe supprimée')
    },
    onError: (error: ApiError) => {
      toast.error(error.message)
    },
  })
}

export function useSyncClasseSubjects() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, subjectIds }: { id: number; subjectIds: number[] }) =>
      syncClasseSubjects(id, subjectIds),
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: classeKeys.subjects(id) })
      toast.success('Matières synchronisées')
    },
    onError: (error: ApiError) => {
      toast.error(error.message)
    },
  })
}
