// ===== src/modules/school/hooks/useSchoolSettings.ts =====

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ApiError } from '@/shared/types/api.types'
import { toast } from '@/shared/lib/toast'
import {
  getSchoolSettings,
  updateSchoolSetting,
  bulkUpdateSchoolSettings,
} from '../api/settings.api'

export const schoolSettingKeys = {
  all: ['school-settings'] as const,
}

export function useSchoolSettings() {
  return useQuery({
    queryKey: schoolSettingKeys.all,
    queryFn: () => getSchoolSettings(),
  })
}

export function useUpdateSchoolSetting() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: unknown }) =>
      updateSchoolSetting(key, value),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: schoolSettingKeys.all })
      toast.success('Paramètre mis à jour')
    },
    onError: (error: ApiError) => {
      toast.error(error.message)
    },
  })
}

export function useBulkUpdateSchoolSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (settings: Record<string, unknown>) => bulkUpdateSchoolSettings(settings),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: schoolSettingKeys.all })
      toast.success('Paramètres mis à jour')
    },
    onError: (error: ApiError) => {
      toast.error(error.message)
    },
  })
}
