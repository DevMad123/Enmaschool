import { getContractTypeLabel, getContractTypeColor } from '../lib/teacherHelpers'
import type { ContractType } from '../types/teachers.types'

interface ContractTypeBadgeProps {
  type: ContractType
}

const COLOR_CLASSES: Record<string, string> = {
  green: 'bg-green-50 text-green-700 border-green-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  orange: 'bg-orange-50 text-orange-700 border-orange-200',
  gray: 'bg-gray-50 text-gray-600 border-gray-200',
}

export function ContractTypeBadge({ type }: ContractTypeBadgeProps) {
  const color = getContractTypeColor(type)
  const label = getContractTypeLabel(type)
  const classes = COLOR_CLASSES[color] ?? COLOR_CLASSES.gray

  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${classes}`}>
      {label}
    </span>
  )
}
