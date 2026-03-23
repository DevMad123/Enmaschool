import { getOverrideTypeLabel, getOverrideTypeColor } from '../lib/timetableHelpers'
import type { OverrideType } from '../types/timetable.types'

const COLOR_MAP: Record<string, string> = {
  red:    'bg-red-100 text-red-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  blue:   'bg-blue-100 text-blue-700',
  purple: 'bg-purple-100 text-purple-700',
  gray:   'bg-gray-100 text-gray-600',
}

export function OverrideTypeBadge({ type }: { type: OverrideType }) {
  const color = getOverrideTypeColor(type)
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${COLOR_MAP[color] ?? COLOR_MAP.gray}`}>
      {getOverrideTypeLabel(type)}
    </span>
  )
}
