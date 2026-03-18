// ===== src/modules/superadmin/types/activity.types.ts =====

export type ActivityType =
  | 'login'
  | 'logout'
  | 'create'
  | 'update'
  | 'delete'
  | 'export'
  | 'import'
  | 'generate'
  | 'payment'

export interface ActivityLog {
  id: number
  log_type: string | null
  actor_type: string | null
  actor_name: string | null
  tenant_name: string | null
  activity_type: ActivityType | null
  activity_label: string | null
  module: string | null
  description: string
  subject_name: string | null
  properties: Record<string, unknown>
  ip_address: string | null
  created_at: string
}

export interface ActivityLogFilters {
  tenant_id?: string
  actor_type?: string
  activity_type?: ActivityType
  module?: string
  from?: string
  to?: string
  page?: number
  per_page?: number
}
