// ===== src/modules/school/lib/userHelpers.ts =====

import {
  USER_ROLE_LABELS,
  USER_ROLE_COLORS,
  STAFF_ROLES,
  type UserRole,
  type UserStatus,
  type InvitationStatus,
} from '../types/users.types'

export function getUserRoleLabel(role: UserRole): string {
  return USER_ROLE_LABELS[role] ?? role
}

export function getUserRoleColor(role: UserRole): string {
  return USER_ROLE_COLORS[role] ?? 'gray'
}

export function getUserStatusColor(status: UserStatus): string {
  const map: Record<UserStatus, string> = {
    active:    'green',
    inactive:  'gray',
    suspended: 'red',
    pending:   'orange',
  }
  return map[status] ?? 'gray'
}

export function canManageRole(currentUserRole: UserRole, targetRole: UserRole): boolean {
  const rules: Record<UserRole, UserRole[]> = {
    school_admin: ['director', 'teacher', 'accountant', 'staff'],
    director:     ['teacher', 'accountant', 'staff'],
    teacher:      [],
    accountant:   [],
    staff:        [],
    student:      [],
    parent:       [],
  }
  return rules[currentUserRole]?.includes(targetRole) ?? false
}

export function isStaffRole(role: UserRole): boolean {
  return STAFF_ROLES.includes(role)
}

export function getInvitationStatusColor(status: InvitationStatus): string {
  const map: Record<InvitationStatus, string> = {
    pending:  'blue',
    accepted: 'green',
    expired:  'gray',
    revoked:  'red',
  }
  return map[status] ?? 'gray'
}

export function getUserInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

/** Génère une couleur de fond déterministe à partir d'un nom. */
export function getAvatarBgColor(name: string): string {
  const colors = [
    'bg-indigo-500', 'bg-violet-500', 'bg-pink-500', 'bg-rose-500',
    'bg-orange-500', 'bg-amber-500', 'bg-teal-500', 'bg-cyan-500',
    'bg-sky-500',    'bg-blue-500',  'bg-green-500', 'bg-emerald-500',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}
