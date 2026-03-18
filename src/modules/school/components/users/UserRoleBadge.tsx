// ===== src/modules/school/components/users/UserRoleBadge.tsx =====

import { USER_ROLE_LABELS, type UserRole } from '../../types/users.types'

const colorMap: Record<string, string> = {
  purple: 'bg-purple-100 text-purple-700',
  blue:   'bg-blue-100 text-blue-700',
  green:  'bg-green-100 text-green-700',
  orange: 'bg-orange-100 text-orange-700',
  gray:   'bg-gray-100 text-gray-600',
  cyan:   'bg-cyan-100 text-cyan-700',
  pink:   'bg-pink-100 text-pink-700',
}

const roleColors: Record<UserRole, string> = {
  school_admin: 'purple',
  director:     'blue',
  teacher:      'green',
  accountant:   'orange',
  staff:        'gray',
  student:      'cyan',
  parent:       'pink',
}

interface UserRoleBadgeProps {
  role: UserRole
}

export function UserRoleBadge({ role }: UserRoleBadgeProps) {
  const color  = roleColors[role] ?? 'gray'
  const cls    = colorMap[color] ?? colorMap.gray
  const label  = USER_ROLE_LABELS[role] ?? role

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {label}
    </span>
  )
}
