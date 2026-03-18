// ===== src/modules/school/api/settings.api.ts =====

import api from '@/shared/lib/axios'
import type { ApiSuccess } from '@/shared/types/api.types'
import type { SchoolSetting } from '../types/school.types'

export async function getSchoolSettings(): Promise<ApiSuccess<Record<string, SchoolSetting[]>>> {
  const { data } = await api.get<ApiSuccess<Record<string, SchoolSetting[]>>>('/api/school/settings')
  return data
}

export async function updateSchoolSetting(
  key: string,
  value: unknown,
): Promise<ApiSuccess<SchoolSetting>> {
  const { data } = await api.put<ApiSuccess<SchoolSetting>>(`/api/school/settings/${key}`, { value })
  return data
}

export async function bulkUpdateSchoolSettings(
  settings: Record<string, unknown>,
): Promise<ApiSuccess<null>> {
  const { data } = await api.put<ApiSuccess<null>>('/api/school/settings', { settings })
  return data
}
