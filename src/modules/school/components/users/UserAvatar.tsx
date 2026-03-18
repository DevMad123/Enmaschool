// ===== src/modules/school/components/users/UserAvatar.tsx =====

import { getAvatarBgColor, getUserInitials } from '../../lib/userHelpers'
import type { SchoolUser } from '../../types/users.types'

const sizeMap = {
  sm: 'h-7 w-7 text-[10px]',
  md: 'h-9 w-9 text-xs',
  lg: 'h-12 w-12 text-sm',
}

interface UserAvatarProps {
  user: Pick<SchoolUser, 'first_name' | 'last_name' | 'full_name' | 'avatar_url'>
  size?: 'sm' | 'md' | 'lg'
}

export function UserAvatar({ user, size = 'md' }: UserAvatarProps) {
  const initials = getUserInitials(user.first_name, user.last_name)
  const bg       = getAvatarBgColor(user.full_name)
  const cls      = sizeMap[size]

  if (user.avatar_url) {
    return (
      <img
        src={user.avatar_url}
        alt={user.full_name}
        className={`${cls} rounded-full object-cover`}
      />
    )
  }

  return (
    <span
      className={`${cls} ${bg} inline-flex items-center justify-center rounded-full font-semibold text-white`}
    >
      {initials}
    </span>
  )
}
