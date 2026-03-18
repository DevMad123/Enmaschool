// ===== src/modules/school/components/users/InvitationStatusBadge.tsx =====

import type { InvitationStatus } from '../../types/users.types'

const config: Record<InvitationStatus, { label: string; cls: string }> = {
  pending:  { label: 'En attente', cls: 'bg-blue-100 text-blue-700' },
  accepted: { label: 'Acceptée',   cls: 'bg-green-100 text-green-700' },
  expired:  { label: 'Expirée',    cls: 'bg-gray-100 text-gray-600' },
  revoked:  { label: 'Révoquée',   cls: 'bg-red-100 text-red-700' },
}

interface InvitationStatusBadgeProps {
  status: InvitationStatus
}

export function InvitationStatusBadge({ status }: InvitationStatusBadgeProps) {
  const { label, cls } = config[status] ?? config.expired

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {label}
    </span>
  )
}
