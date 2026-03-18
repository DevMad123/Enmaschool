// ===== src/modules/superadmin/components/TenantStatusBadge.tsx =====

import type { TenantStatus } from '../types/tenant.types'

const config: Record<TenantStatus, { label: string; dotColor: string; classes: string }> = {
  trial: {
    label: 'Essai',
    dotColor: 'bg-amber-500',
    classes: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  active: {
    label: 'Actif',
    dotColor: 'bg-green-500',
    classes: 'bg-green-50 text-green-800 border-green-200',
  },
  suspended: {
    label: 'Suspendu',
    dotColor: 'bg-red-500',
    classes: 'bg-red-50 text-red-800 border-red-200',
  },
  cancelled: {
    label: 'Annulé',
    dotColor: 'bg-slate-400',
    classes: 'bg-slate-50 text-slate-600 border-slate-200',
  },
}

interface TenantStatusBadgeProps {
  status: TenantStatus
  size?: 'sm' | 'md'
}

export function TenantStatusBadge({ status, size = 'md' }: TenantStatusBadgeProps) {
  const { label, dotColor, classes } = config[status] ?? config.suspended

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${classes} ${
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
      {label}
    </span>
  )
}
