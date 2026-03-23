import { Medal } from 'lucide-react'

interface RankBadgeProps {
  rank: number | null
  total: number
}

export function RankBadge({ rank, total }: RankBadgeProps) {
  if (rank === null) return <span className="text-gray-400 text-sm">—</span>

  const isTop3 = rank <= 3
  const suffix = rank === 1 ? 'er' : 'e'

  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${isTop3 ? 'text-amber-600' : 'text-gray-600'}`}>
      {isTop3 && <Medal className="h-3 w-3 text-amber-400" />}
      {rank}{suffix}/{total}
    </span>
  )
}
