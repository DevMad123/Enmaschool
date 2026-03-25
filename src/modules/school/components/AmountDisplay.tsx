import { formatXOF } from '../lib/paymentHelpers'

interface Props {
  amount: number
  size?: 'sm' | 'md' | 'lg'
  color?: string
  className?: string
}

const SIZE_CLASSES = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-xl font-bold',
}

export function AmountDisplay({ amount, size = 'md', color, className = '' }: Props) {
  const sizeClass  = SIZE_CLASSES[size]
  const colorStyle = color ? { color } : undefined

  return (
    <span className={`font-medium tabular-nums ${sizeClass} ${className}`} style={colorStyle}>
      {formatXOF(amount)}
    </span>
  )
}
