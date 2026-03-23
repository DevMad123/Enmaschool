import { cn } from '@/shared/lib/utils'

interface ClassCapacityBadgeProps {
  enrolled: number
  capacity: number
  className?: string
}

export function ClassCapacityBadge({ enrolled, capacity, className }: ClassCapacityBadgeProps) {
  const ratio = capacity > 0 ? enrolled / capacity : 0
  const colorClass =
    ratio >= 1
      ? 'text-red-600 bg-red-50'
      : ratio >= 0.9
        ? 'text-orange-600 bg-orange-50'
        : 'text-green-700 bg-green-50'

  return (
    <span
      className={cn('inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium', colorClass, className)}
    >
      {enrolled}/{capacity}
    </span>
  )
}
