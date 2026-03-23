import { getGradeLabel, getAverageBgColor, formatAverage } from '../lib/gradeHelpers'

interface AverageBadgeProps {
  average: number | null
  passingAvg?: number
  showMention?: boolean
}

export function AverageBadge({ average, passingAvg = 10, showMention = false }: AverageBadgeProps) {
  if (average === null) {
    return <span className="text-gray-400 text-sm">—</span>
  }

  const bgColor = getAverageBgColor(average, passingAvg)
  const mention = getGradeLabel(average)

  return (
    <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-semibold ${bgColor}`}>
      {formatAverage(average)}
      {showMention && <span className="opacity-70">— {mention}</span>}
    </span>
  )
}
