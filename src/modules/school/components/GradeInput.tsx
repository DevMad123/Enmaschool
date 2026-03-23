import { useRef, useState } from 'react'
import { getScoreTailwindColor } from '../lib/gradeHelpers'

interface GradeInputProps {
  value: number | null
  isAbsent: boolean
  maxScore: number
  onChange: (value: number | null) => void
  onAbsent: (absent: boolean) => void
  disabled?: boolean
  passingAvg?: number
}

export function GradeInput({
  value,
  isAbsent,
  maxScore,
  onChange,
  onAbsent,
  disabled = false,
  passingAvg = 10,
}: GradeInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [localValue, setLocalValue] = useState(value !== null ? String(value) : '')
  const [focused, setFocused] = useState(false)

  const colorClass = !isAbsent && value !== null
    ? getScoreTailwindColor(value, passingAvg)
    : ''

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setLocalValue(value !== null ? String(value) : '')
      inputRef.current?.blur()
    }
  }

  const handleBlur = () => {
    setFocused(false)
    const num = parseFloat(localValue)
    if (localValue === '' || isNaN(num)) {
      onChange(null)
      setLocalValue('')
    } else {
      const clamped = Math.min(Math.max(num, 0), maxScore)
      onChange(clamped)
      setLocalValue(String(clamped))
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value)
  }

  if (isAbsent) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() => { if (!disabled) onAbsent(false) }}
        className="w-full rounded px-2 py-1 text-xs font-medium bg-gray-100 text-gray-500 hover:bg-gray-200 disabled:cursor-not-allowed transition-colors"
      >
        ABS
      </button>
    )
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <input
        ref={inputRef}
        type="number"
        step="0.5"
        min={0}
        max={maxScore}
        value={focused ? localValue : (value !== null ? String(value) : '')}
        onChange={handleChange}
        onFocus={() => {
          setFocused(true)
          setLocalValue(value !== null ? String(value) : '')
        }}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="—"
        className={`w-16 rounded border px-2 py-1 text-sm text-center focus:outline-none focus:ring-1 focus:ring-indigo-400 disabled:bg-gray-50 disabled:cursor-not-allowed
          ${value !== null ? `border-transparent ${colorClass} font-medium` : 'border-gray-200 text-gray-400'}
          ${focused ? 'border-indigo-300 bg-white' : 'bg-transparent'}
        `}
      />
      {!disabled && (
        <button
          type="button"
          onClick={() => onAbsent(true)}
          className="text-xs text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded px-2 py-0.5 whitespace-nowrap transition-colors"
          tabIndex={-1}
        >
          Marquer absent
        </button>
      )}
    </div>
  )
}
