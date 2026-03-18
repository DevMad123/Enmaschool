// ===== src/modules/superadmin/types/plan.types.ts =====

export interface PlanModule {
  key: string
  name: string
  is_enabled: boolean
}

export interface Plan {
  id: number
  name: string
  slug: string
  price_monthly: number
  price_yearly: number
  trial_days: number
  max_students: number | null
  max_teachers: number | null
  max_storage_gb: number
  is_active: boolean
  features: string[]
  modules: PlanModule[]
  tenants_count: number
}

export interface CreatePlanDTO {
  name: string
  slug: string
  price_monthly: number
  price_yearly: number
  trial_days: number
  max_students?: number | null
  max_teachers?: number | null
  max_storage_gb: number
  is_active?: boolean
  modules?: string[]
}

export type UpdatePlanDTO = Partial<CreatePlanDTO>
