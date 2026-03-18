// ===== src/modules/school/types/users.types.ts =====

export type UserRole =
  | 'school_admin'
  | 'director'
  | 'teacher'
  | 'accountant'
  | 'staff'
  | 'student'
  | 'parent'

export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending'

export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'revoked'

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  school_admin: 'Administrateur',
  director:     'Directeur',
  teacher:      'Enseignant',
  accountant:   'Comptable',
  staff:        'Personnel',
  student:      'Élève',
  parent:       'Parent',
}

export const USER_ROLE_COLORS: Record<UserRole, string> = {
  school_admin: 'purple',
  director:     'blue',
  teacher:      'green',
  accountant:   'orange',
  staff:        'gray',
  student:      'cyan',
  parent:       'pink',
}

export const STAFF_ROLES: UserRole[] = [
  'school_admin',
  'director',
  'teacher',
  'accountant',
  'staff',
]

export interface SchoolUser {
  id: number
  first_name: string
  last_name: string
  full_name: string
  email: string
  phone: string | null
  avatar_url: string | null
  role: { value: UserRole; label: string; color: string }
  status: { value: UserStatus; label: string; color: string }
  last_login_at: string | null
  created_at: string
  can?: {
    edit: boolean
    delete: boolean
    manage_role: boolean
  }
}

export interface UserFormData {
  first_name: string
  last_name: string
  email: string
  password?: string
  password_confirmation?: string
  role: UserRole
  phone?: string
}

export interface UserInvitation {
  id: number
  email: string
  role: { value: UserRole; label: string }
  status: { value: InvitationStatus; label: string; color: string }
  invited_by: { id: number; full_name: string }
  is_valid: boolean
  invitation_link: string | null
  expires_at: string
  accepted_at: string | null
  created_at: string
}

export interface InviteUserData {
  email: string
  role: UserRole
}

export interface AcceptInvitationData {
  token: string
  first_name: string
  last_name: string
  password: string
  password_confirmation: string
  phone?: string
}

export interface RolePermissions {
  name: string
  label: string
  permissions_count: number
  permissions_by_module: Record<string, string[]>
}

export interface AvailablePermissionModule {
  key: string
  label: string
  actions: {
    key: string
    label: string
    permission: string
  }[]
}

export type AvailablePermissions = Record<string, AvailablePermissionModule>

export interface UserPermissions {
  user_id: number
  role: { value: UserRole; label: string }
  all_permissions: string[]
  permissions_by_module: Record<string, string[]>
}

export interface UserFilters {
  role?: UserRole | ''
  status?: UserStatus | ''
  search?: string
  page?: number
  per_page?: number
}

export interface InvitationFilters {
  status?: InvitationStatus | ''
  email?: string
  page?: number
  per_page?: number
}
