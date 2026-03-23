export function formatScore(score: number | null, maxScore: number): string {
  if (score === null) return '—'
  return `${score}/${maxScore}`
}

export function formatAverage(avg: number | null): string {
  if (avg === null) return '—'
  return avg.toFixed(2)
}

export function getScoreColor(score: number | null, passingAvg = 10): string {
  if (score === null) return 'gray'
  if (score >= passingAvg) return 'green'
  if (score >= passingAvg * 0.75) return 'orange'
  return 'red'
}

export function getGradeLabel(score: number | null): string {
  if (score === null) return '—'
  if (score >= 16) return 'Très Bien'
  if (score >= 14) return 'Bien'
  if (score >= 12) return 'Assez Bien'
  if (score >= 10) return 'Passable'
  return 'Insuffisant'
}

export function calculateWeightedAverage(
  grades: Array<{ score_on_20: number; coefficient: number }>,
): number | null {
  const valid = grades.filter((g) => g.score_on_20 !== null)
  if (!valid.length) return null
  const totalWeight = valid.reduce((s, g) => s + g.coefficient, 0)
  const totalScore  = valid.reduce((s, g) => s + g.score_on_20 * g.coefficient, 0)
  return totalScore / totalWeight
}

export function normalizeScore(score: number, maxScore: number): number {
  return (score * 20) / maxScore
}

export function getScoreTailwindColor(score: number | null, passingAvg = 10): string {
  const color = getScoreColor(score, passingAvg)
  switch (color) {
    case 'green':  return 'text-green-600'
    case 'orange': return 'text-orange-500'
    case 'red':    return 'text-red-600'
    default:       return 'text-gray-400'
  }
}

export function getAverageBgColor(avg: number | null, passingAvg = 10): string {
  if (avg === null) return 'bg-gray-50 text-gray-400'
  if (avg >= passingAvg) return 'bg-green-50 text-green-700'
  if (avg >= passingAvg * 0.75) return 'bg-orange-50 text-orange-700'
  return 'bg-red-50 text-red-700'
}
