// ===== src/modules/superadmin/hooks/useTenants.ts =====

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ApiError } from '@/shared/types/api.types'
import { toast } from '@/shared/lib/toast'
import type { ApiSuccess } from '@/shared/types/api.types'
import type {
  Tenant,
  TenantFilters,
  CreateTenantDTO,
  UpdateTenantDTO,
  SuspendTenantDTO,
} from '../types/tenant.types'
import type { EnableModuleDTO, DisableModuleDTO } from '../types/module.types'
import {
  getTenants,
  getTenant,
  createTenant,
  updateTenant,
  deleteTenant,
  activateTenant,
  suspendTenant,
  getTenantStats,
  getTenantModules,
  enableModule,
  disableModule,
  getTenantActivity,
} from '../api/tenants.api'
import type { ActivityLogFilters } from '../types/activity.types'

// ── Query keys ────────────────────────────────────────────────────────
export const tenantKeys = {
  all: ['tenants'] as const,
  lists: () => [...tenantKeys.all, 'list'] as const,
  list: (filters?: TenantFilters) => [...tenantKeys.lists(), filters] as const,
  details: () => [...tenantKeys.all, 'detail'] as const,
  detail: (id: string) => [...tenantKeys.details(), id] as const,
  stats: (id: string) => [...tenantKeys.detail(id), 'stats'] as const,
  modules: (id: string) => [...tenantKeys.detail(id), 'modules'] as const,
  activity: (id: string, filters?: ActivityLogFilters) =>
    [...tenantKeys.detail(id), 'activity', filters] as const,
}

// ── Queries ───────────────────────────────────────────────────────────

export function useTenants(filters?: TenantFilters) {
  return useQuery({
    queryKey: tenantKeys.list(filters),
    queryFn: () => getTenants(filters),
  })
}

export function useTenant(id: string) {
  return useQuery({
    queryKey: tenantKeys.detail(id),
    queryFn: () => getTenant(id),
    enabled: !!id,
  })
}

export function useTenantStats(id: string) {
  return useQuery({
    queryKey: tenantKeys.stats(id),
    queryFn: () => getTenantStats(id),
    enabled: !!id,
  })
}

export function useTenantModules(id: string) {
  return useQuery({
    queryKey: tenantKeys.modules(id),
    queryFn: () => getTenantModules(id),
    enabled: !!id,
  })
}

export function useTenantActivity(id: string, filters?: ActivityLogFilters) {
  return useQuery({
    queryKey: tenantKeys.activity(id, filters),
    queryFn: () => getTenantActivity(id, filters),
    enabled: !!id,
  })
}

// ── Mutations ─────────────────────────────────────────────────────────

export function useCreateTenant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateTenantDTO) => createTenant(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tenantKeys.lists() })
      toast.success('École créée avec succès')
    },
    onError: (error: ApiError) => {
      toast.error(error.message)
    },
  })
}

export function useUpdateTenant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTenantDTO }) =>
      updateTenant(id, data),

    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: tenantKeys.detail(id) })
      const previous = queryClient.getQueryData<ApiSuccess<Tenant>>(tenantKeys.detail(id))
      if (previous) {
        queryClient.setQueryData(tenantKeys.detail(id), {
          ...previous,
          data: { ...previous.data, ...data },
        })
      }
      return { previous, id }
    },

    onError: (_err: ApiError, { id }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(tenantKeys.detail(id), context.previous)
      }
      toast.error('Erreur lors de la mise à jour')
    },

    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: tenantKeys.detail(id) })
      void queryClient.invalidateQueries({ queryKey: tenantKeys.lists() })
      toast.success('École mise à jour avec succès')
    },
  })
}

export function useDeleteTenant() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (id: string) => deleteTenant(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tenantKeys.lists() })
      toast.success('École supprimée avec succès')
    },
    onError: (error: ApiError) => {
      toast.error(error.message)
    },
  })

  const deleteTenantWithConfirm = (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette école ? Cette action est irréversible.')) {
      mutation.mutate(id)
    }
  }

  return { ...mutation, deleteTenantWithConfirm }
}

export function useActivateTenant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => activateTenant(id),
    onSuccess: (_, id) => {
      void queryClient.invalidateQueries({ queryKey: tenantKeys.detail(id) })
      void queryClient.invalidateQueries({ queryKey: tenantKeys.lists() })
      toast.success('École activée avec succès')
    },
    onError: (error: ApiError) => {
      toast.error(error.message)
    },
  })
}

export function useSuspendTenant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SuspendTenantDTO }) =>
      suspendTenant(id, data),
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: tenantKeys.detail(id) })
      void queryClient.invalidateQueries({ queryKey: tenantKeys.lists() })
      toast.success('École suspendue')
    },
    onError: (error: ApiError) => {
      toast.error(error.message)
    },
  })
}

export function useEnableModule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ tenantId, data }: { tenantId: string; data: EnableModuleDTO }) =>
      enableModule(tenantId, data),
    onSuccess: (_, { tenantId }) => {
      void queryClient.invalidateQueries({ queryKey: tenantKeys.modules(tenantId) })
      toast.success('Module activé avec succès')
    },
    onError: (error: ApiError) => {
      toast.error(error.message)
    },
  })
}

export function useDisableModule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ tenantId, data }: { tenantId: string; data: DisableModuleDTO }) =>
      disableModule(tenantId, data),
    onSuccess: (_, { tenantId }) => {
      void queryClient.invalidateQueries({ queryKey: tenantKeys.modules(tenantId) })
      toast.success('Module désactivé')
    },
    onError: (error: ApiError) => {
      toast.error(error.message)
    },
  })
}
