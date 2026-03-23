import { cn } from '@/shared/lib/utils'
import { COUNCIL_DECISION_LABELS, COUNCIL_DECISION_COLORS } from '../types/reportCards.types'
import type { CouncilDecision } from '../types/reportCards.types'

const tailwindColorMap: Record<string, string> = {
  green:  'bg-green-100 text-green-700',
  red:    'bg-red-100 text-red-700',
  orange: 'bg-orange-100 text-orange-700',
  blue:   'bg-blue-100 text-blue-700',
  purple: 'bg-purple-100 text-purple-700',
  gray:   'bg-gray-100 text-gray-600',
}

interface Props {
  decision: CouncilDecision
  className?: string
}

export function CouncilDecisionBadge({ decision, className }: Props) {
  const color = COUNCIL_DECISION_COLORS[decision] ?? 'gray'
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        tailwindColorMap[color] ?? 'bg-gray-100 text-gray-600',
        className,
      )}
    >
      {COUNCIL_DECISION_LABELS[decision] ?? decision}
    </span>
  )
}
