// ===== src/modules/superadmin/hooks/usePlans.ts =====

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ApiError } from '@/shared/types/api.types'
import { toast } from '@/shared/lib/toast'
import type { CreatePlanDTO, UpdatePlanDTO } from '../types/plan.types'
import {
  getPlans,
  getPlan,
  createPlan,
  updatePlan,
  deletePlan,
} from '../api/plans.api'

// ── Query keys ────────────────────────────────────────────────────────
export const planKeys = {
  all: ['plans'] as const,
  lists: () => [...planKeys.all, 'list'] as const,
  detail: (id: number) => [...planKeys.all, 'detail', id] as const,
}

// ── Queries ───────────────────────────────────────────────────────────

export function usePlans() {
  return useQuery({
    queryKey: planKeys.lists(),
    queryFn: () => getPlans(),
  })
}

export function usePlan(id: number) {
  return useQuery({
    queryKey: planKeys.detail(id),
    queryFn: () => getPlan(id),
    enabled: !!id,
  })
}

// ── Mutations ─────────────────────────────────────────────────────────

export function useCreatePlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreatePlanDTO) => createPlan(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: planKeys.lists() })
      toast.success('Plan créé avec succès')
    },
    onError: (error: ApiError) => {
      toast.error(error.message)
    },
  })
}

export function useUpdatePlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePlanDTO }) =>
      updatePlan(id, data),
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: planKeys.detail(id) })
      void queryClient.invalidateQueries({ queryKey: planKeys.lists() })
      toast.success('Plan mis à jour avec succès')
    },
    onError: (error: ApiError) => {
      toast.error(error.message)
    },
  })
}

export function useDeletePlan() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (id: number) => deletePlan(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: planKeys.lists() })
      toast.success('Plan supprimé avec succès')
    },
    onError: (error: ApiError) => {
      toast.error(error.message)
    },
  })

  const deletePlanWithConfirm = (id: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce plan ?')) {
      mutation.mutate(id)
    }
  }

  return { ...mutation, deletePlanWithConfirm }
}
