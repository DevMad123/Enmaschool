// ===== src/modules/superadmin/api/auth.api.ts =====

import api from '@/shared/lib/axios'
import type { ApiSuccess } from '@/shared/types/api.types'

export interface SuperAdminLoginResponse {
  user: {
    id: number
    name: string
    email: string
  }
  token: string
  roles: string[]
}

export async function superAdminLoginApi(
  email: string,
  password: string,
): Promise<ApiSuccess<SuperAdminLoginResponse>> {
  const { data } = await api.post<ApiSuccess<SuperAdminLoginResponse>>(
    '/central/auth/login',
    { email, password, device_name: 'web' },
  )
  return data
}

export async function superAdminMeApi(): Promise<ApiSuccess<{ user: { id: number; name: string; email: string }; roles: string[] }>> {
  const { data } = await api.get<ApiSuccess<{ user: { id: number; name: string; email: string }; roles: string[] }>>(
    '/central/auth/me',
  )
  return data
}
