// ===== src/modules/superadmin/hooks/useActivityLogs.ts =====

import { useQuery, useMutation } from '@tanstack/react-query'
import { toast } from '@/shared/lib/toast'
import type { ActivityLogFilters } from '../types/activity.types'
import { getActivityLogs, exportActivityLogs } from '../api/activity.api'

// ── Query keys ────────────────────────────────────────────────────────
export const activityKeys = {
  all: ['activity-logs'] as const,
  lists: () => [...activityKeys.all, 'list'] as const,
  list: (filters?: ActivityLogFilters) =>
    [...activityKeys.lists(), filters] as const,
}

// ── Queries ───────────────────────────────────────────────────────────

export function useActivityLogs(filters?: ActivityLogFilters) {
  return useQuery({
    queryKey: activityKeys.list(filters),
    queryFn: () => getActivityLogs(filters),
  })
}

// ── Mutations ─────────────────────────────────────────────────────────

export function useExportActivityLogs() {
  return useMutation({
    mutationFn: (
      filters?: Omit<ActivityLogFilters, 'page' | 'per_page'>,
    ) => exportActivityLogs(filters),

    onSuccess: (blob: Blob) => {
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `activity-logs-${new Date().toISOString().slice(0, 10)}.csv`
      link.click()
      URL.revokeObjectURL(url)
      toast.success('Export téléchargé avec succès')
    },

    onError: () => {
      toast.error("Erreur lors de l'export")
    },
  })
}
