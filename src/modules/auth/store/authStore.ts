// ===== src/modules/auth/store/authStore.ts =====

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthState, School, User } from '@/shared/types/auth.types';

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      permissions: [],
      roles: [],
      school: null,
      isAuthenticated: false,

      setAuth: (
        user: User,
        token: string,
        permissions: string[],
        roles: string[],
        school: School,
      ) =>
        set({
          user,
          token,
          permissions,
          roles,
          school,
          isAuthenticated: true,
        }),

      clearAuth: () =>
        set({
          user: null,
          token: null,
          permissions: [],
          roles: [],
          school: null,
          isAuthenticated: false,
        }),

      updateUser: (partial: Partial<User>) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...partial } : null,
        })),
    }),
    {
      name: 'enma-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        permissions: state.permissions,
        roles: state.roles,
        school: state.school,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
