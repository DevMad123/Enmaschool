import type { Gender } from '../types/students.types'
import { cn } from '@/shared/lib/utils'

interface GenderBadgeProps {
  gender: Gender
  className?: string
}

export function GenderBadge({ gender, className }: GenderBadgeProps) {
  const isMale = gender === 'male'

  return (
    <span
      className={cn(
        'inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold',
        isMale ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700',
        className,
      )}
    >
      {isMale ? 'M' : 'F'}
    </span>
  )
}
