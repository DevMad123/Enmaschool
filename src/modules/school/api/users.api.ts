// ===== src/modules/school/api/users.api.ts =====

import api from '@/shared/lib/axios'
import type { ApiSuccess, PaginatedResponse } from '@/shared/types/api.types'
import type {
  SchoolUser,
  UserFormData,
  UserFilters,
  UserInvitation,
  InviteUserData,
  InvitationFilters,
  AcceptInvitationData,
  RolePermissions,
  AvailablePermissions,
  UserPermissions,
} from '../types/users.types'

// ── Utilisateurs ──────────────────────────────────────────────────────────

export async function getUsers(
  params?: UserFilters,
): Promise<PaginatedResponse<SchoolUser>> {
  const { data } = await api.get<PaginatedResponse<SchoolUser>>('/api/school/users', { params })
  return data
}

export async function getUser(id: number): Promise<ApiSuccess<SchoolUser>> {
  const { data } = await api.get<ApiSuccess<SchoolUser>>(`/api/school/users/${id}`)
  return data
}

export async function createUser(payload: UserFormData): Promise<ApiSuccess<SchoolUser>> {
  const { data } = await api.post<ApiSuccess<SchoolUser>>('/api/school/users', payload)
  return data
}

export async function updateUser(
  id: number,
  payload: Partial<UserFormData>,
): Promise<ApiSuccess<SchoolUser>> {
  const { data } = await api.put<ApiSuccess<SchoolUser>>(`/api/school/users/${id}`, payload)
  return data
}

export async function deleteUser(id: number): Promise<ApiSuccess<null>> {
  const { data } = await api.delete<ApiSuccess<null>>(`/api/school/users/${id}`)
  return data
}

export async function activateUser(id: number): Promise<ApiSuccess<SchoolUser>> {
  const { data } = await api.post<ApiSuccess<SchoolUser>>(`/api/school/users/${id}/activate`)
  return data
}

export async function deactivateUser(id: number): Promise<ApiSuccess<SchoolUser>> {
  const { data } = await api.post<ApiSuccess<SchoolUser>>(`/api/school/users/${id}/deactivate`)
  return data
}

export async function suspendUser(
  id: number,
  reason?: string,
): Promise<ApiSuccess<SchoolUser>> {
  const { data } = await api.post<ApiSuccess<SchoolUser>>(
    `/api/school/users/${id}/suspend`,
    { reason },
  )
  return data
}

export async function resetUserPassword(
  id: number,
): Promise<ApiSuccess<{ temporary_password: string }>> {
  const { data } = await api.post<ApiSuccess<{ temporary_password: string }>>(
    `/api/school/users/${id}/reset-password`,
  )
  return data
}

export async function getUserPermissions(id: number): Promise<ApiSuccess<UserPermissions>> {
  const { data } = await api.get<ApiSuccess<UserPermissions>>(`/api/school/users/${id}/permissions`)
  return data
}

// ── Invitations ───────────────────────────────────────────────────────────

export async function getInvitations(
  params?: InvitationFilters,
): Promise<PaginatedResponse<UserInvitation>> {
  const { data } = await api.get<PaginatedResponse<UserInvitation>>(
    '/api/school/invitations',
    { params },
  )
  return data
}

export async function inviteUser(payload: InviteUserData): Promise<ApiSuccess<UserInvitation>> {
  const { data } = await api.post<ApiSuccess<UserInvitation>>('/api/school/invitations', payload)
  return data
}

export async function resendInvitation(id: number): Promise<ApiSuccess<UserInvitation>> {
  const { data } = await api.post<ApiSuccess<UserInvitation>>(
    `/api/school/invitations/${id}/resend`,
  )
  return data
}

export async function revokeInvitation(id: number): Promise<ApiSuccess<UserInvitation>> {
  const { data } = await api.post<ApiSuccess<UserInvitation>>(
    `/api/school/invitations/${id}/revoke`,
  )
  return data
}

export async function acceptInvitation(
  payload: AcceptInvitationData,
): Promise<ApiSuccess<{ user: SchoolUser; token: string }>> {
  const { data } = await api.post<ApiSuccess<{ user: SchoolUser; token: string }>>(
    '/api/school/invitations/accept',
    payload,
  )
  return data
}

// ── Permissions ───────────────────────────────────────────────────────────

export async function getRolesWithPermissions(): Promise<ApiSuccess<RolePermissions[]>> {
  const { data } = await api.get<ApiSuccess<RolePermissions[]>>('/api/school/permissions/roles')
  return data
}

export async function getAvailablePermissions(): Promise<ApiSuccess<AvailablePermissions>> {
  const { data } = await api.get<ApiSuccess<AvailablePermissions>>(
    '/api/school/permissions/available',
  )
  return data
}

export async function updateRolePermissions(
  roleName: string,
  permissions: string[],
): Promise<ApiSuccess<null>> {
  const { data } = await api.put<ApiSuccess<null>>(
    `/api/school/permissions/roles/${roleName}`,
    { permissions },
  )
  return data
}
