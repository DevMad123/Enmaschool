// ===== src/modules/school/components/users/UserStatusBadge.tsx =====

import type { UserStatus } from '../../types/users.types'

const config: Record<UserStatus, { label: string; dot: string; text: string }> = {
  active:    { label: 'Actif',       dot: 'bg-green-500',  text: 'text-green-700' },
  inactive:  { label: 'Inactif',     dot: 'bg-gray-400',   text: 'text-gray-600' },
  suspended: { label: 'Suspendu',    dot: 'bg-red-500',    text: 'text-red-700' },
  pending:   { label: 'En attente',  dot: 'bg-orange-400', text: 'text-orange-700' },
}

interface UserStatusBadgeProps {
  status: UserStatus
}

export function UserStatusBadge({ status }: UserStatusBadgeProps) {
  const { label, dot, text } = config[status] ?? config.inactive

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  )
}
