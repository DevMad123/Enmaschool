// ===== src/modules/superadmin/api/activity.api.ts =====

import api from '@/shared/lib/axios'
import type { PaginatedResponse } from '@/shared/types/api.types'
import type { ActivityLog, ActivityLogFilters } from '../types/activity.types'

export async function getActivityLogs(
  params?: ActivityLogFilters,
): Promise<PaginatedResponse<ActivityLog>> {
  const { data } = await api.get<PaginatedResponse<ActivityLog>>(
    '/central/activity-logs',
    { params },
  )
  return data
}

export async function exportActivityLogs(
  params?: Omit<ActivityLogFilters, 'page' | 'per_page'>,
): Promise<Blob> {
  const response = await api.get('/central/activity-logs/export', {
    params,
    responseType: 'blob',
  })
  return response.data as Blob
}
