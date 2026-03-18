// ===== src/modules/superadmin/types/user.types.ts =====

export type GlobalUserRole =
  | 'school_admin'
  | 'director'
  | 'teacher'
  | 'accountant'
  | 'staff'
  | 'student'
  | 'parent'

export type GlobalUserStatus = 'active' | 'inactive' | 'suspended'

export interface GlobalUser {
  id: number
  tenant_id: string
  tenant_name: string
  first_name: string
  last_name: string
  full_name: string
  email: string
  role: GlobalUserRole
  role_label: string
  status: GlobalUserStatus
  status_label: string
  status_color: string
  avatar_url: string | null
  phone: string | null
  last_login_at: string | null
  created_at: string
  tenant_plan: string | null
}

export interface GlobalUserFilters {
  search?: string
  tenant_id?: string
  role?: GlobalUserRole
  status?: GlobalUserStatus
  page?: number
  per_page?: number
}
