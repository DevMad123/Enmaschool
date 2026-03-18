// ===== src/modules/school/hooks/useUsers.ts =====

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ApiError } from '@/shared/types/api.types'
import { toast } from '@/shared/lib/toast'
import type { UserFormData, UserFilters, InviteUserData, InvitationFilters } from '../types/users.types'
import {
  getUsers, getUser, createUser, updateUser, deleteUser,
  activateUser, deactivateUser, suspendUser, resetUserPassword, getUserPermissions,
  getInvitations, inviteUser, resendInvitation, revokeInvitation,
  getRolesWithPermissions, getAvailablePermissions, updateRolePermissions,
} from '../api/users.api'

// ── Query keys ────────────────────────────────────────────────────────────

export const userKeys = {
  all:         ['users'] as const,
  lists:       () => [...userKeys.all, 'list'] as const,
  list:        (filters?: UserFilters) => [...userKeys.lists(), filters] as const,
  details:     () => [...userKeys.all, 'detail'] as const,
  detail:      (id: number) => [...userKeys.details(), id] as const,
  permissions: (id: number) => [...userKeys.detail(id), 'permissions'] as const,
}

export const invitationKeys = {
  all:   ['invitations'] as const,
  lists: () => [...invitationKeys.all, 'list'] as const,
  list:  (filters?: InvitationFilters) => [...invitationKeys.lists(), filters] as const,
}

export const permissionKeys = {
  roles:     ['roles-permissions'] as const,
  available: ['available-permissions'] as const,
}

// ── Utilisateurs ──────────────────────────────────────────────────────────

export function useUsers(filters?: UserFilters) {
  return useQuery({
    queryKey: userKeys.list(filters),
    queryFn:  () => getUsers(filters),
  })
}

export function useUser(id: number) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn:  () => getUser(id),
    enabled:  !!id,
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UserFormData) => createUser(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      toast.success('Utilisateur créé avec succès')
    },
    onError: (error: ApiError) => {
      toast.error(error.message)
    },
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<UserFormData> }) =>
      updateUser(id, data),
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: userKeys.detail(id) })
      void queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      toast.success('Utilisateur mis à jour')
    },
    onError: (error: ApiError) => {
      toast.error(error.message)
    },
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => deleteUser(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      toast.success('Utilisateur supprimé')
    },
    onError: (error: ApiError) => {
      toast.error(error.message)
    },
  })
}

export function useActivateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => activateUser(id),
    onSuccess: (_, id) => {
      void queryClient.invalidateQueries({ queryKey: userKeys.detail(id) })
      void queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      toast.success('Utilisateur activé')
    },
    onError: (error: ApiError) => { toast.error(error.message) },
  })
}

export function useDeactivateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => deactivateUser(id),
    onSuccess: (_, id) => {
      void queryClient.invalidateQueries({ queryKey: userKeys.detail(id) })
      void queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      toast.success('Utilisateur désactivé')
    },
    onError: (error: ApiError) => { toast.error(error.message) },
  })
}

export function useSuspendUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) => suspendUser(id, reason),
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: userKeys.detail(id) })
      void queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      toast.success('Utilisateur suspendu')
    },
    onError: (error: ApiError) => { toast.error(error.message) },
  })
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (id: number) => resetUserPassword(id),
    onError: (error: ApiError) => {
      toast.error(error.message)
    },
  })
}

export function useUserPermissions(id: number) {
  return useQuery({
    queryKey: userKeys.permissions(id),
    queryFn:  () => getUserPermissions(id),
    enabled:  !!id,
  })
}

// ── Invitations ───────────────────────────────────────────────────────────

export function useInvitations(filters?: InvitationFilters) {
  return useQuery({
    queryKey: invitationKeys.list(filters),
    queryFn:  () => getInvitations(filters),
  })
}

export function useInviteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: InviteUserData) => inviteUser(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: invitationKeys.lists() })
      toast.success('Invitation envoyée')
    },
    onError: (error: ApiError) => { toast.error(error.message) },
  })
}

export function useResendInvitation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => resendInvitation(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: invitationKeys.lists() })
      toast.success('Invitation renvoyée')
    },
    onError: (error: ApiError) => { toast.error(error.message) },
  })
}

export function useRevokeInvitation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => revokeInvitation(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: invitationKeys.lists() })
      toast.success('Invitation révoquée')
    },
    onError: (error: ApiError) => { toast.error(error.message) },
  })
}

// ── Permissions ───────────────────────────────────────────────────────────

export function useRolesPermissions() {
  return useQuery({
    queryKey: permissionKeys.roles,
    queryFn:  getRolesWithPermissions,
    staleTime: 5 * 60 * 1000, // 5 min
  })
}

export function useAvailablePermissions() {
  return useQuery({
    queryKey: permissionKeys.available,
    queryFn:  getAvailablePermissions,
    staleTime: Infinity,
  })
}

export function useUpdateRolePermissions() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ roleName, permissions }: { roleName: string; permissions: string[] }) =>
      updateRolePermissions(roleName, permissions),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: permissionKeys.roles })
      toast.success('Permissions mises à jour')
    },
    onError: (error: ApiError) => { toast.error(error.message) },
  })
}
