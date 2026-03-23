import { cn } from '@/shared/lib/utils'
import { REPORT_CARD_STATUS_LABELS } from '../types/reportCards.types'
import type { ReportCardStatus } from '../types/reportCards.types'

const colorMap: Record<ReportCardStatus, string> = {
  draft:     'bg-gray-100 text-gray-600',
  generated: 'bg-blue-100 text-blue-700',
  published: 'bg-green-100 text-green-700',
  archived:  'bg-orange-100 text-orange-700',
}

interface Props {
  status: ReportCardStatus
  className?: string
}

export function ReportCardStatusBadge({ status, className }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        colorMap[status] ?? 'bg-gray-100 text-gray-600',
        className,
      )}
    >
      {REPORT_CARD_STATUS_LABELS[status] ?? status}
    </span>
  )
}
