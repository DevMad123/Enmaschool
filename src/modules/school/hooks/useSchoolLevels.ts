// ===== src/modules/school/hooks/useSchoolLevels.ts =====

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ApiError } from '@/shared/types/api.types'
import { toast } from '@/shared/lib/toast'
import type { LevelCategory } from '../types/school.types'
import { getSchoolLevels, toggleSchoolLevel } from '../api/schoolLevels.api'

export const schoolLevelKeys = {
  all: ['school-levels'] as const,
  list: (category?: LevelCategory) => [...schoolLevelKeys.all, category] as const,
}

export function useSchoolLevels(category?: LevelCategory) {
  return useQuery({
    queryKey: schoolLevelKeys.list(category),
    queryFn: () => getSchoolLevels(category ? { category } : undefined),
    staleTime: 10 * 60 * 1000, // 10 min — levels rarely change
  })
}

export function useToggleSchoolLevel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => toggleSchoolLevel(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: schoolLevelKeys.all })
      toast.success('Niveau mis à jour')
    },
    onError: (error: ApiError) => {
      toast.error(error.message)
    },
  })
}
