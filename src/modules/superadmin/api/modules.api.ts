// ===== src/modules/superadmin/api/modules.api.ts =====

import api from '@/shared/lib/axios'
import type { ApiSuccess } from '@/shared/types/api.types'
import type { SystemModule } from '../types/module.types'

export async function getSystemModules(): Promise<ApiSuccess<SystemModule[]>> {
  const { data } = await api.get<ApiSuccess<SystemModule[]>>(
    '/central/modules',
  )
  return data
}

export async function toggleSystemModule(
  key: string,
  is_active: boolean,
): Promise<ApiSuccess<SystemModule>> {
  const { data } = await api.put<ApiSuccess<SystemModule>>(
    `/central/modules/${key}`,
    { is_active },
  )
  return data
}

export async function updateModule(
  key: string,
  payload: { available_for: string[] },
): Promise<ApiSuccess<SystemModule>> {
  const { data } = await api.put<ApiSuccess<SystemModule>>(
    `/central/modules/${key}`,
    payload,
  )
  return data
}
