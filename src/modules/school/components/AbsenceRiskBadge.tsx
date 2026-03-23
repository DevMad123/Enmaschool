import { isAtRiskThreshold } from '../lib/attendanceHelpers'

interface Props {
  rate:       number
  threshold?: number
}

export function AbsenceRiskBadge({ rate, threshold = 80 }: Props) {
  if (!isAtRiskThreshold(rate, threshold)) return null

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
      ⚠ À risque
    </span>
  )
}
