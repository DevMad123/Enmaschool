// ===== src/modules/superadmin/types/subscription.types.ts =====

export type SubscriptionStatus = 'trial' | 'active' | 'suspended' | 'cancelled' | 'expired'

export type BillingCycle = 'monthly' | 'yearly'

export interface SubscriptionPlan {
  id: number
  name: string
}

export interface Subscription {
  id: number
  status: SubscriptionStatus
  status_label: string
  status_color: string
  plan: SubscriptionPlan | null
  starts_at: string | null
  ends_at: string | null
  trial_ends_at: string | null
  days_left: number | null
  billing_cycle: BillingCycle | null
  price_paid: number | null
  cancelled_at: string | null
  cancellation_reason: string | null
  notes: string | null
}

export interface AssignPlanDTO {
  plan_id: number
  billing_cycle: BillingCycle
  price_paid?: number
  notes?: string
  trial_days?: number
}

export interface CancelSubscriptionDTO {
  reason?: string
}

export interface SubscriptionFilters {
  status?: SubscriptionStatus
  tenant_id?: string
  page?: number
  per_page?: number
}
