// ===== src/modules/school/store/schoolStore.ts =====

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { LevelCategory } from '../types/school.types'
import type { UserRole, UserStatus } from '../types/users.types'

interface UserFiltersState {
  role: UserRole | null
  status: UserStatus | null
  search: string
}

interface SchoolStore {
  currentYearId: number | null
  setCurrentYearId: (id: number | null) => void
  selectedLevelCategory: LevelCategory | null
  setSelectedLevelCategory: (cat: LevelCategory | null) => void

  userFilters: UserFiltersState
  setUserFilters: (filters: Partial<UserFiltersState>) => void
  resetUserFilters: () => void

  reset: () => void
}

const defaultUserFilters: UserFiltersState = {
  role:   null,
  status: null,
  search: '',
}

export const useSchoolStore = create<SchoolStore>()(
  persist(
    (set) => ({
      currentYearId: null,
      setCurrentYearId: (id) => set({ currentYearId: id }),
      selectedLevelCategory: null,
      setSelectedLevelCategory: (cat) => set({ selectedLevelCategory: cat }),

      userFilters: defaultUserFilters,
      setUserFilters: (filters) =>
        set((state) => ({ userFilters: { ...state.userFilters, ...filters } })),
      resetUserFilters: () => set({ userFilters: defaultUserFilters }),

      reset: () =>
        set({
          currentYearId: null,
          selectedLevelCategory: null,
          userFilters: defaultUserFilters,
        }),
    }),
    {
      name: 'school-store',
    },
  ),
)
