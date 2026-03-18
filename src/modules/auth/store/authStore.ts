// ===== src/modules/auth/store/authStore.ts =====

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AuthState, School, User } from '@/shared/types/auth.types';
import { useSchoolStore } from '@/modules/school/store/schoolStore';

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
        school: School | null,
      ) =>
        set({
          user,
          token,
          permissions,
          roles,
          school,
          isAuthenticated: true,
        }),

      clearAuth: () => {
        useSchoolStore.getState().reset();
        set({
          user: null,
          token: null,
          permissions: [],
          roles: [],
          school: null,
          isAuthenticated: false,
        });
      },

      updateUser: (partial: Partial<User>) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...partial } : null,
        })),
    }),
    {
      name: 'enma-auth',
      storage: createJSONStorage(() => localStorage),
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
