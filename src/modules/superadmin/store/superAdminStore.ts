// ===== src/modules/superadmin/store/superAdminStore.ts =====
// NON persisté — données de session uniquement (reset à chaque reload)

import { create } from 'zustand'
import type { Tenant } from '../types/tenant.types'
import type { DashboardStats } from '../types/dashboard.types'
import type { NavItem } from '@/shared/config/navigation'
import { superAdminNavigation } from '@/shared/config/navigation'

interface SuperAdminState {
  // ── Selected tenant ─────────────────────────────────────────────────
  selectedTenant: Tenant | null
  setSelectedTenant: (tenant: Tenant) => void
  clearSelectedTenant: () => void

  // ── Dashboard stats cache ────────────────────────────────────────────
  dashboardStats: DashboardStats | null
  setDashboardStats: (stats: DashboardStats) => void

  // ── Sidebar navigation ───────────────────────────────────────────────
  sidebarItems: NavItem[]
}

export const useSuperAdminStore = create<SuperAdminState>()((set) => ({
  selectedTenant: null,
  setSelectedTenant: (tenant) => set({ selectedTenant: tenant }),
  clearSelectedTenant: () => set({ selectedTenant: null }),

  dashboardStats: null,
  setDashboardStats: (stats) => set({ dashboardStats: stats }),

  sidebarItems: superAdminNavigation,
}))
