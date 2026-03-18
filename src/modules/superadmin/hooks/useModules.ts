// ===== src/modules/superadmin/hooks/useModules.ts =====

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ApiError } from '@/shared/types/api.types'
import { toast } from '@/shared/lib/toast'
import { getSystemModules, toggleSystemModule, updateModule } from '../api/modules.api'

// ── Query keys ────────────────────────────────────────────────────────
export const moduleKeys = {
  all: ['system-modules'] as const,
}

// ── Queries ───────────────────────────────────────────────────────────

export function useSystemModules() {
  return useQuery({
    queryKey: moduleKeys.all,
    queryFn: () => getSystemModules(),
  })
}

// ── Mutations ─────────────────────────────────────────────────────────

export function useToggleSystemModule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ key, is_active }: { key: string; is_active: boolean }) =>
      toggleSystemModule(key, is_active),
    onSuccess: (_, { is_active }) => {
      void queryClient.invalidateQueries({ queryKey: moduleKeys.all })
      toast.success(
        is_active ? 'Module activé sur la plateforme' : 'Module désactivé sur la plateforme',
      )
    },
    onError: (error: ApiError) => {
      toast.error(error.message)
    },
  })
}

export function useUpdateModule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ key, available_for }: { key: string; available_for: string[] }) =>
      updateModule(key, { available_for }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: moduleKeys.all })
      toast.success('Types d\'école mis à jour')
    },
    onError: (error: ApiError) => {
      toast.error(error.message)
    },
  })
}
