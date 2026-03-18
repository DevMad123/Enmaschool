// ===== src/modules/superadmin/hooks/useDashboard.ts =====

import { useQuery } from '@tanstack/react-query'
import { useQueryClient } from '@tanstack/react-query'
import { useSuperAdminStore } from '../store/superAdminStore'
import { getDashboardStats } from '../api/dashboard.api'

// ── Query keys ────────────────────────────────────────────────────────
export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: () => [...dashboardKeys.all, 'stats'] as const,
}

// ── Query ─────────────────────────────────────────────────────────────

export function useDashboardStats() {
  const setDashboardStats = useSuperAdminStore((s) => s.setDashboardStats)

  return useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: async () => {
      const result = await getDashboardStats()
      setDashboardStats(result.data)
      return result
    },
    staleTime: 2 * 60 * 1000, // 2 minutes — dashboard refreshes more often
  })
}

export function useRefreshDashboard() {
  const queryClient = useQueryClient()

  return () => {
    void queryClient.invalidateQueries({ queryKey: dashboardKeys.stats() })
  }
}
