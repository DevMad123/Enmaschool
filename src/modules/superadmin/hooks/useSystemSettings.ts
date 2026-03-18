// ===== src/modules/superadmin/hooks/useSystemSettings.ts =====

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ApiError } from '@/shared/types/api.types'
import { toast } from '@/shared/lib/toast'
import type { UpdateSettingsDTO } from '../types/settings.types'
import { getSettings, updateSettings } from '../api/settings.api'

// ── Query keys ────────────────────────────────────────────────────────
export const settingKeys = {
  all: ['settings'] as const,
}

// ── Queries ───────────────────────────────────────────────────────────

export function useSystemSettings() {
  return useQuery({
    queryKey: settingKeys.all,
    queryFn: () => getSettings(),
  })
}

// ── Mutations ─────────────────────────────────────────────────────────

export function useUpdateSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateSettingsDTO) => updateSettings(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: settingKeys.all })
      toast.success('Paramètres enregistrés avec succès')
    },
    onError: (error: ApiError) => {
      toast.error(error.message)
    },
  })
}
