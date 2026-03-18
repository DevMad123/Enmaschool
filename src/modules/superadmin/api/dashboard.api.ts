// ===== src/modules/superadmin/api/dashboard.api.ts =====

import api from '@/shared/lib/axios'
import type { ApiSuccess } from '@/shared/types/api.types'
import type { DashboardStats } from '../types/dashboard.types'

export async function getDashboardStats(): Promise<ApiSuccess<DashboardStats>> {
  const { data } = await api.get<ApiSuccess<DashboardStats>>(
    '/central/dashboard/stats',
  )
  return data
}
