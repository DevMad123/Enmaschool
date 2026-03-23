import type { EvaluationType } from '../types/grades.types'
import { EVALUATION_TYPE_SHORT } from '../types/grades.types'

const COLOR_MAP: Record<string, string> = {
  blue:   'bg-blue-100 text-blue-700',
  purple: 'bg-purple-100 text-purple-700',
  orange: 'bg-orange-100 text-orange-700',
  red:    'bg-red-100 text-red-700',
  green:  'bg-green-100 text-green-700',
  cyan:   'bg-cyan-100 text-cyan-700',
  gray:   'bg-gray-100 text-gray-600',
}

interface EvaluationTypeBadgeProps {
  type: EvaluationType
  color?: string
}

export function EvaluationTypeBadge({ type, color = 'gray' }: EvaluationTypeBadgeProps) {
  const classes = COLOR_MAP[color] ?? COLOR_MAP.gray

  return (
    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-semibold ${classes}`}>
      {EVALUATION_TYPE_SHORT[type]}
    </span>
  )
}
