interface Props { count: number; max?: number }
export function UnreadBadge({ count, max = 99 }: Props) {
  if (count === 0) return null
  return (
    <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
      {count > max ? `${max}+` : count}
    </span>
  )
}
