// ===== src/modules/auth/auth.api.ts =====

import api from '@/shared/lib/axios';
import type { ApiSuccess } from '@/shared/types/api.types';
import type {
  LoginCredentials,
  LoginResponse,
  MeResponse,
  RefreshTokenResponse,
} from '@/shared/types/auth.types';

export async function loginApi(
  email: string,
  password: string,
  device_name?: string,
): Promise<ApiSuccess<LoginResponse>> {
  const payload: LoginCredentials = { email, password };
  if (device_name) {
    payload.device_name = device_name;
  }

  const { data } = await api.post<ApiSuccess<LoginResponse>>(
    '/api/auth/login',
    payload,
  );
  return data;
}

export async function logoutApi(): Promise<ApiSuccess<null>> {
  const { data } = await api.post<ApiSuccess<null>>('/api/auth/logout');
  return data;
}

export async function getMeApi(): Promise<ApiSuccess<MeResponse>> {
  const { data } = await api.get<ApiSuccess<MeResponse>>('/api/auth/me');
  return data;
}

export async function refreshTokenApi(): Promise<
  ApiSuccess<RefreshTokenResponse>
> {
  const { data } = await api.post<ApiSuccess<RefreshTokenResponse>>(
    '/api/auth/refresh',
  );
  return data;
}
