// ===== src/modules/school/hooks/useAcademicYears.ts =====

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ApiError } from '@/shared/types/api.types'
import { toast } from '@/shared/lib/toast'
import type { AcademicYearFormData, AcademicYearFilters } from '../types/school.types'
import {
  getAcademicYears,
  getAcademicYear,
  createAcademicYear,
  updateAcademicYear,
  deleteAcademicYear,
  activateAcademicYear,
  closeAcademicYear,
  getAcademicYearPeriods,
} from '../api/academicYears.api'

export const academicYearKeys = {
  all: ['academic-years'] as const,
  lists: () => [...academicYearKeys.all, 'list'] as const,
  list: (filters?: AcademicYearFilters) => [...academicYearKeys.lists(), filters] as const,
  details: () => [...academicYearKeys.all, 'detail'] as const,
  detail: (id: number) => [...academicYearKeys.details(), id] as const,
  periods: (id: number) => [...academicYearKeys.detail(id), 'periods'] as const,
}

export function useAcademicYears(filters?: AcademicYearFilters) {
  return useQuery({
    queryKey: academicYearKeys.list(filters),
    queryFn: () => getAcademicYears(filters),
  })
}

export function useAcademicYear(id: number) {
  return useQuery({
    queryKey: academicYearKeys.detail(id),
    queryFn: () => getAcademicYear(id),
    enabled: !!id,
  })
}

export function useAcademicYearPeriods(id: number) {
  return useQuery({
    queryKey: academicYearKeys.periods(id),
    queryFn: () => getAcademicYearPeriods(id),
    enabled: !!id,
  })
}

export function useCreateAcademicYear() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: AcademicYearFormData) => createAcademicYear(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: academicYearKeys.lists() })
      toast.success('Année scolaire créée avec succès')
    },
    onError: (error: ApiError) => {
      toast.error(error.message)
    },
  })
}

export function useUpdateAcademicYear() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<AcademicYearFormData> }) =>
      updateAcademicYear(id, data),
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: academicYearKeys.detail(id) })
      void queryClient.invalidateQueries({ queryKey: academicYearKeys.lists() })
      toast.success('Année scolaire mise à jour')
    },
    onError: (error: ApiError) => {
      toast.error(error.message)
    },
  })
}

export function useDeleteAcademicYear() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => deleteAcademicYear(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: academicYearKeys.lists() })
      toast.success('Année scolaire supprimée')
    },
    onError: (error: ApiError) => {
      toast.error(error.message)
    },
  })
}

export function useActivateAcademicYear() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => activateAcademicYear(id),
    onSuccess: (_, id) => {
      void queryClient.invalidateQueries({ queryKey: academicYearKeys.detail(id) })
      void queryClient.invalidateQueries({ queryKey: academicYearKeys.lists() })
      toast.success('Année scolaire activée')
    },
    onError: (error: ApiError) => {
      toast.error(error.message)
    },
  })
}

export function useCloseAcademicYear() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => closeAcademicYear(id),
    onSuccess: (_, id) => {
      void queryClient.invalidateQueries({ queryKey: academicYearKeys.detail(id) })
      void queryClient.invalidateQueries({ queryKey: academicYearKeys.lists() })
      toast.success('Année scolaire clôturée')
    },
    onError: (error: ApiError) => {
      toast.error(error.message)
    },
  })
}
