import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ApiError } from '@/shared/types/api.types'
import { toast } from '@/shared/lib/toast'
import {
  getSchoolSettings,
  updateSchoolSetting,
  bulkUpdateSchoolSettings,
  uploadSchoolLogo,
} from '../api/settings.api'
import type { SettingUpdatePayload } from '../types/school.types'

export const schoolSettingKeys = {
  all: ['school-settings'] as const,
}

export function useSchoolSettings() {
  return useQuery({
    queryKey: schoolSettingKeys.all,
    queryFn: () => getSchoolSettings(),
    staleTime: 5 * 60_000,
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
    onError: (error: ApiError) => toast.error(error.message),
  })
}

export function useBulkUpdateSchoolSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (settings: SettingUpdatePayload[]) => bulkUpdateSchoolSettings(settings),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: schoolSettingKeys.all })
      toast.success('Paramètres sauvegardés')
    },
    onError: (error: ApiError) => toast.error(error.message ?? 'Erreur lors de la sauvegarde'),
  })
}

export function useUploadLogo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => uploadSchoolLogo(file),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: schoolSettingKeys.all })
      toast.success('Logo mis à jour')
    },
    onError: () => toast.error('Erreur lors du chargement du logo'),
  })
}
