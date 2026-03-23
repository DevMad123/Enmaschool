import { generateAvatarInitials, getGenderColor } from '../lib/studentHelpers'
import type { StudentListItem } from '../types/students.types'
import { cn } from '@/shared/lib/utils'

const SIZE_CLASSES = {
  xs: 'h-6 w-6 text-xs',
  sm: 'h-8 w-8 text-sm',
  md: 'h-10 w-10 text-base',
  lg: 'h-14 w-14 text-lg',
}

const BG_BY_GENDER: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-700',
  pink: 'bg-pink-100 text-pink-700',
}

interface StudentAvatarProps {
  student: Pick<StudentListItem, 'full_name' | 'photo_url' | 'gender'>
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
}

export function StudentAvatar({ student, size = 'md', className }: StudentAvatarProps) {
  const initials = generateAvatarInitials(student.full_name)
  const genderColor = getGenderColor(student.gender.value)
  const bgClass = BG_BY_GENDER[genderColor] ?? 'bg-gray-100 text-gray-700'

  if (student.photo_url) {
    return (
      <img
        src={student.photo_url}
        alt={student.full_name}
        className={cn('rounded-full object-cover', SIZE_CLASSES[size], className)}
      />
    )
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full font-semibold',
        SIZE_CLASSES[size],
        bgClass,
        className,
      )}
    >
      {initials}
    </div>
  )
}
