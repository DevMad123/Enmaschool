import api from '@/shared/lib/axios'
import type { ApiSuccess } from '@/shared/types/api.types'
import type { SchoolSetting, SettingUpdatePayload } from '../types/school.types'

type GroupedSettings = Record<string, SchoolSetting[]>

export async function getSchoolSettings(): Promise<ApiSuccess<GroupedSettings>> {
  const { data } = await api.get<ApiSuccess<GroupedSettings>>('/api/school/settings')
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
  settings: SettingUpdatePayload[],
): Promise<ApiSuccess<null>> {
  const { data } = await api.put<ApiSuccess<null>>('/api/school/settings', { settings })
  return data
}

export async function uploadSchoolLogo(file: File): Promise<ApiSuccess<{ url: string; path: string }>> {
  const formData = new FormData()
  formData.append('logo', file)
  const { data } = await api.post<ApiSuccess<{ url: string; path: string }>>(
    '/api/school/settings/logo',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  )
  return data
}
