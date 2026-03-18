import { getLevelCategoryLabel, getLevelCategoryColor } from '../lib/classeHelpers'
import type { LevelCategory } from '../types/school.types'

interface LevelCategoryBadgeProps {
  category: LevelCategory
}

export function LevelCategoryBadge({ category }: LevelCategoryBadgeProps) {
  const color = getLevelCategoryColor(category)
  const label = getLevelCategoryLabel(category)

  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ backgroundColor: `${color}15`, color }}
    >
      {label}
    </span>
  )
}
