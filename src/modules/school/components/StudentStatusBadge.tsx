import type { StudentStatus } from '../types/students.types'
import { getStudentStatusColor } from '../lib/studentHelpers'
import { cn } from '@/shared/lib/utils'

const STATUS_LABELS: Record<StudentStatus, string> = {
  active: 'Actif',
  inactive: 'Inactif',
  transferred: 'Transféré',
  graduated: 'Diplômé',
  expelled: 'Exclu',
}

const COLOR_CLASSES: Record<string, string> = {
  green: 'bg-green-100 text-green-700 border-green-200',
  gray: 'bg-gray-100 text-gray-600 border-gray-200',
  blue: 'bg-blue-100 text-blue-700 border-blue-200',
  purple: 'bg-purple-100 text-purple-700 border-purple-200',
  red: 'bg-red-100 text-red-700 border-red-200',
}

interface StudentStatusBadgeProps {
  status: StudentStatus
  className?: string
}

export function StudentStatusBadge({ status, className }: StudentStatusBadgeProps) {
  const color = getStudentStatusColor(status)
  const colorClass = COLOR_CLASSES[color] ?? COLOR_CLASSES.gray

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        colorClass,
        className,
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  )
}
