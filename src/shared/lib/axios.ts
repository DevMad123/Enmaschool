// ===== src/shared/lib/axios.ts =====

import axios from 'axios';
import type { ApiError } from '@/shared/types/api.types';
import { useAuthStore } from '@/modules/auth/store/authStore';

// En multi-tenant, le baseURL doit pointer sur le domaine courant :
// - Sur enmaschool.com:8000  → routes central (/central/...)
// - Sur demo.enmaschool.test:8000 → routes tenant (/api/...)
const api = axios.create({
  baseURL: window.location.origin,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ── Request interceptor ──────────────────────────────────────────────
api.interceptors.request.use((config) => {
  const { token } = useAuthStore.getState();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  config.headers['X-Tenant'] = window.location.hostname;

  return config;
});

// ── Response interceptor ─────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!axios.isAxiosError(error) || !error.response) {
      const apiError: ApiError = {
        success: false,
        message: 'Erreur réseau. Vérifiez votre connexion.',
      };
      return Promise.reject(apiError);
    }

    const { status, data } = error.response;
    const code: string | undefined = data?.code;

    if (status === 401) {
      useAuthStore.getState().clearAuth();
      const isAdminRoute = window.location.pathname.startsWith('/admin');
      window.location.href = isAdminRoute ? '/admin/login' : '/login';
    }

    if (status === 402 && code === 'TRIAL_EXPIRED') {
      window.location.href = '/trial-expired';
    }

    if (status === 403 && code === 'TENANT_SUSPENDED') {
      window.location.href = '/suspended';
    }

    if (status === 403 && code === 'TENANT_CANCELLED') {
      window.location.href = '/cancelled';
    }

    const apiError: ApiError = {
      success: false,
      message: data?.message ?? 'Une erreur est survenue.',
      errors: data?.errors,
      code,
    };

    return Promise.reject(apiError);
  },
);

export default api;
