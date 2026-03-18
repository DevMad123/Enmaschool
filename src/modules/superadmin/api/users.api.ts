// ===== src/modules/superadmin/api/users.api.ts =====

import api from '@/shared/lib/axios'
import type { ApiSuccess, PaginatedResponse } from '@/shared/types/api.types'
import type { GlobalUser, GlobalUserFilters } from '../types/user.types'
import type { ActivityLog } from '../types/activity.types'

export async function getGlobalUsers(
  params?: GlobalUserFilters,
): Promise<PaginatedResponse<GlobalUser>> {
  const { data } = await api.get<PaginatedResponse<GlobalUser>>(
    '/central/users',
    { params },
  )
  return data
}

export async function getGlobalUser(
  id: number,
): Promise<ApiSuccess<GlobalUser>> {
  const { data } = await api.get<ApiSuccess<GlobalUser>>(
    `/central/users/${id}`,
  )
  return data
}

export async function getUserActivity(
  id: number,
): Promise<ApiSuccess<ActivityLog[]>> {
  const { data } = await api.get<ApiSuccess<ActivityLog[]>>(
    `/central/users/${id}/activity`,
  )
  return data
}

export async function deactivateUser(
  id: number,
): Promise<ApiSuccess<GlobalUser>> {
  const { data } = await api.post<ApiSuccess<GlobalUser>>(
    `/central/users/${id}/deactivate`,
  )
  return data
}

export async function deactivateUsers(
  ids: number[],
): Promise<ApiSuccess<{ count: number }>> {
  const { data } = await api.post<ApiSuccess<{ count: number }>>(
    '/central/users/bulk-deactivate',
    { ids },
  )
  return data
}

export async function resetUserPassword(
  id: number,
): Promise<ApiSuccess<null>> {
  const { data } = await api.post<ApiSuccess<null>>(
    `/central/users/${id}/reset-password`,
  )
  return data
}

export async function exportUsers(
  params?: Omit<GlobalUserFilters, 'page' | 'per_page'>,
): Promise<Blob> {
  const response = await api.get('/central/users/export', {
    params,
    responseType: 'blob',
  })
  return response.data as Blob
}
