// ===== src/modules/superadmin/api/settings.api.ts =====

import api from '@/shared/lib/axios'
import type { ApiSuccess } from '@/shared/types/api.types'
import type { GroupedSettings, UpdateSettingsDTO } from '../types/settings.types'

export async function getSettings(): Promise<ApiSuccess<GroupedSettings>> {
  const { data } = await api.get<ApiSuccess<GroupedSettings>>('/central/settings')
  return data
}

export async function updateSettings(
  payload: UpdateSettingsDTO,
): Promise<ApiSuccess<GroupedSettings>> {
  const { data } = await api.put<ApiSuccess<GroupedSettings>>(
    '/central/settings',
    payload,
  )
  return data
}
