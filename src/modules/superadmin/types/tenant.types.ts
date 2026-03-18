// ===== src/modules/superadmin/types/tenant.types.ts =====

import type { Plan } from './plan.types'
import type { SubscriptionStatus } from './subscription.types'

export type TenantStatus = 'trial' | 'active' | 'suspended' | 'cancelled'

export interface TenantProfile {
  logo: string | null
  address: string | null
  phone: string | null
  email: string | null
  city: string | null
  country: string
  timezone: string
  language: string
  currency: string
}

export interface TenantSubscription {
  status: SubscriptionStatus
  trial_ends_at: string | null
  ends_at: string | null
  days_left: number | null
}

export interface Tenant {
  id: string
  name: string
  slug: string
  status: TenantStatus
  status_label: string
  status_color: string
  has_maternelle: boolean
  has_primary: boolean
  has_college: boolean
  has_lycee: boolean
  school_types_label: string
  profile: TenantProfile
  plan: Pick<Plan, 'id' | 'name' | 'slug'> | null
  current_subscription: TenantSubscription | null
  active_modules: string[]
  trial_days_left: number | null
  is_on_trial: boolean
  created_at: string
}

export interface TenantStats {
  students_count: number
  teachers_count: number
  users_count: number
  classes_count: number
  storage_used_mb: number
}

export interface CreateTenantDTO {
  name: string
  slug: string
  has_primary: boolean
  has_college: boolean
  has_lycee: boolean
  has_maternelle: boolean
  plan_id?: number
  profile: Partial<TenantProfile>
  admin_first_name: string
  admin_last_name: string
  admin_email: string
  admin_password: string
  admin_password_confirmation: string
}

export interface UpdateTenantDTO {
  name?: string
  has_primary?: boolean
  has_college?: boolean
  has_lycee?: boolean
  has_maternelle?: boolean
  profile?: Partial<TenantProfile>
}

export interface SuspendTenantDTO {
  reason: string
}

export interface TenantFilters {
  search?: string
  status?: TenantStatus
  plan_id?: number
  has_maternelle?: boolean
  has_primary?: boolean
  has_college?: boolean
  has_lycee?: boolean
  page?: number
  per_page?: number
}
