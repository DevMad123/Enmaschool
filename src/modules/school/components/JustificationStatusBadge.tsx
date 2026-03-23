import type { JustificationStatus } from '../types/attendance.types'

const CONFIG: Record<JustificationStatus, { label: string; bg: string; color: string }> = {
  pending:  { label: 'En attente', bg: '#ffedd5', color: '#c2410c' },
  approved: { label: 'Approuvée',  bg: '#dcfce7', color: '#15803d' },
  rejected: { label: 'Rejetée',    bg: '#fee2e2', color: '#b91c1c' },
}

interface Props {
  status: JustificationStatus
}

export function JustificationStatusBadge({ status }: Props) {
  const { label, bg, color } = CONFIG[status]
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: bg, color }}
    >
      {label}
    </span>
  )
}
