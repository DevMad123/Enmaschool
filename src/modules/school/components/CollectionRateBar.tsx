import { formatXOF, getCollectionRateColor } from '../lib/paymentHelpers'

interface Props {
  rate: number
  collected: number
  expected: number
}

const BAR_COLORS: Record<string, string> = {
  green:  'bg-green-500',
  orange: 'bg-orange-400',
  red:    'bg-red-500',
}

export function CollectionRateBar({ rate, collected, expected }: Props) {
  const color     = getCollectionRateColor(rate)
  const barClass  = BAR_COLORS[color] ?? 'bg-gray-400'
  const textColor = color === 'green' ? 'text-green-700' : color === 'orange' ? 'text-orange-700' : 'text-red-700'

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">{formatXOF(collected)} / {formatXOF(expected)}</span>
        <span className={`font-semibold ${textColor}`}>{rate.toFixed(1)}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-gray-200">
        <div
          className={`h-2 rounded-full transition-all ${barClass}`}
          style={{ width: `${Math.min(100, rate)}%` }}
        />
      </div>
    </div>
  )
}
