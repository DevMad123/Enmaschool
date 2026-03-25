import { Badge } from '@/shared/components/ui/badge'
import { type StudentFeeStatus, FEE_STATUS_LABELS } from '../types/payments.types'

const COLOR_CLASSES: Record<StudentFeeStatus, string> = {
  pending: 'bg-gray-100 text-gray-700',
  partial: 'bg-orange-100 text-orange-700',
  paid:    'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
  waived:  'bg-blue-100 text-blue-700',
}

interface Props {
  status: StudentFeeStatus
}

export function FeeStatusBadge({ status }: Props) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${COLOR_CLASSES[status]}`}>
      {FEE_STATUS_LABELS[status]}
    </span>
  )
}
