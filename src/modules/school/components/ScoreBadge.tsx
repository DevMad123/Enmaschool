import { getScoreTailwindColor } from '../lib/gradeHelpers'

interface ScoreBadgeProps {
  score: number | null
  maxScore?: number
  passingAvg?: number
  isAbsent?: boolean
}

export function ScoreBadge({ score, maxScore = 20, passingAvg = 10, isAbsent = false }: ScoreBadgeProps) {
  if (isAbsent) {
    return (
      <span className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-500">
        ABS
      </span>
    )
  }

  if (score === null) {
    return <span className="text-gray-300 text-sm">—</span>
  }

  const colorClass = getScoreTailwindColor(score, passingAvg)

  return (
    <span className={`text-sm font-medium ${colorClass}`}>
      {score}/{maxScore}
    </span>
  )
}
