// ===== src/modules/superadmin/hooks/useSubscriptions.ts =====

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ApiError } from '@/shared/types/api.types'
import { toast } from '@/shared/lib/toast'
import type { AssignPlanDTO, CancelSubscriptionDTO, SubscriptionFilters } from '../types/subscription.types'
import {
  getSubscriptions,
  getTenantSubscriptions,
  assignPlan,
  cancelSubscription,
} from '../api/subscriptions.api'
import { tenantKeys } from './useTenants'

// ── Query keys ────────────────────────────────────────────────────────
export const subscriptionKeys = {
  all: ['subscriptions'] as const,
  lists: () => [...subscriptionKeys.all, 'list'] as const,
  list: (filters?: SubscriptionFilters) =>
    [...subscriptionKeys.lists(), filters] as const,
  tenantHistory: (tenantId: string) =>
    [...subscriptionKeys.all, 'tenant', tenantId] as const,
}

// ── Queries ───────────────────────────────────────────────────────────

export function useSubscriptions(filters?: SubscriptionFilters) {
  return useQuery({
    queryKey: subscriptionKeys.list(filters),
    queryFn: () => getSubscriptions(filters),
  })
}

export function useTenantSubscriptions(
  tenantId: string,
  filters?: SubscriptionFilters,
) {
  return useQuery({
    queryKey: subscriptionKeys.tenantHistory(tenantId),
    queryFn: () => getTenantSubscriptions(tenantId, filters),
    enabled: !!tenantId,
  })
}

// ── Mutations ─────────────────────────────────────────────────────────

export function useAssignPlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ tenantId, data }: { tenantId: string; data: AssignPlanDTO }) =>
      assignPlan(tenantId, data),
    onSuccess: (_, { tenantId }) => {
      void queryClient.invalidateQueries({
        queryKey: subscriptionKeys.tenantHistory(tenantId),
      })
      void queryClient.invalidateQueries({ queryKey: tenantKeys.detail(tenantId) })
      void queryClient.invalidateQueries({ queryKey: tenantKeys.lists() })
      toast.success('Plan assigné avec succès')
    },
    onError: (error: ApiError) => {
      toast.error(error.message)
    },
  })
}

export function useCancelSubscription() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data?: CancelSubscriptionDTO
    }) => cancelSubscription(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: subscriptionKeys.all })
      void queryClient.invalidateQueries({ queryKey: tenantKeys.lists() })
      toast.success('Abonnement annulé')
    },
    onError: (error: ApiError) => {
      toast.error(error.message)
    },
  })
}
