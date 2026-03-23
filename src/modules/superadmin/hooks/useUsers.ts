// ===== src/modules/superadmin/hooks/useUsers.ts =====

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ApiError } from '@/shared/types/api.types'
import { toast } from '@/shared/lib/toast'
import type { GlobalUserFilters } from '../types/user.types'
import {
  getGlobalUsers,
  getGlobalUser,
  getUserActivity,
  deactivateUser,
  deactivateUsers,
  resetUserPassword,
  exportUsers,
} from '../api/users.api'

// ── Query keys ────────────────────────────────────────────────────────
export const userKeys = {
  all: ['global-users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters?: GlobalUserFilters) => [...userKeys.lists(), filters] as const,
  detail: (id: number) => [...userKeys.all, 'detail', id] as const,
  activity: (id: number) => [...userKeys.all, 'activity', id] as const,
}

// ── Queries ───────────────────────────────────────────────────────────

export function useGlobalUsers(filters?: GlobalUserFilters) {
  return useQuery({
    queryKey: userKeys.list(filters),
    queryFn: () => getGlobalUsers(filters),
  })
}

export function useGlobalUser(id: number) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => getGlobalUser(id),
    enabled: !!id,
  })
}

export function useUserActivity(id: number) {
  return useQuery({
    queryKey: userKeys.activity(id),
    queryFn: () => getUserActivity(id),
    enabled: !!id,
  })
}

// ── Mutations ─────────────────────────────────────────────────────────

export function useDeactivateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: { id: number; tenant_id: string }) => deactivateUser(params),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      toast.success('Utilisateur désactivé')
    },
    onError: (error: ApiError) => {
      toast.error(error.message)
    },
  })
}

export function useBulkDeactivateUsers() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (ids: number[]) => deactivateUsers(ids),
    onSuccess: (res) => {
      void queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      toast.success(`${res.data.count} utilisateur(s) désactivé(s)`)
    },
    onError: (error: ApiError) => {
      toast.error(error.message)
    },
  })
}

export function useResetUserPassword() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: { id: number; tenant_id: string | null }) => resetUserPassword(params),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: userKeys.lists() })
    },
    onError: (error: ApiError) => {
      toast.error(error.message)
    },
  })
}

export function useExportUsers() {
  return useMutation({
    mutationFn: (filters?: Omit<GlobalUserFilters, 'page' | 'per_page'>) =>
      exportUsers(filters),
    onSuccess: (blob: Blob) => {
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `users-${new Date().toISOString().slice(0, 10)}.csv`
      link.click()
      URL.revokeObjectURL(url)
      toast.success('Export téléchargé')
    },
    onError: () => {
      toast.error("Erreur lors de l'export")
    },
  })
}
