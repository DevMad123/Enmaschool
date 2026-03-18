// ===== src/modules/superadmin/types/module.types.ts =====

export interface SystemModule {
  key: string
  name: string
  description: string | null
  icon: string | null
  is_core: boolean
  is_active: boolean
  available_for: string[]
  order: number
}

export interface TenantModule {
  module_key: string
  module_name: string
  module_icon: string | null
  is_enabled: boolean
  is_core: boolean
  in_plan: boolean
  has_override: boolean
  enabled_at: string | null
  disabled_at: string | null
  override_reason: string | null
}

export interface EnableModuleDTO {
  module_key: string
  reason?: string
}

export interface DisableModuleDTO {
  module_key: string
  reason?: string
}
