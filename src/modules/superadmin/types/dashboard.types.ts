// ===== src/modules/superadmin/types/dashboard.types.ts =====

import type { ActivityLog } from './activity.types'
import type { Tenant } from './tenant.types'

export interface DashboardTenantCounts {
  total: number
  active: number
  trial: number
  suspended: number
  new_this_month: number
}

export interface TrialExpiringSoon {
  tenant: {
    id: string
    name: string
    slug: string
  }
  days_left: number | null
}

export interface RevenueStats {
  monthly_arr: number
  trials_expiring_soon: TrialExpiringSoon[]
}

export interface ModuleUsage {
  module: string
  tenants_count: number
}

export interface MonthlyRegistration {
  month: string
  count: number
}

export interface DashboardStats {
  tenants: DashboardTenantCounts
  users: {
    total: number | null
    new_this_month: number
  }
  revenue: RevenueStats
  modules: {
    most_used: ModuleUsage[]
  }
  recent_activity: ActivityLog[]
  recent_tenants: Tenant[]
  monthly_registrations?: MonthlyRegistration[]
}
