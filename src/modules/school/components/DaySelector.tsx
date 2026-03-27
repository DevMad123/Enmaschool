const DAYS = [
  { value: 1, label: 'Lun' },
  { value: 2, label: 'Mar' },
  { value: 3, label: 'Mer' },
  { value: 4, label: 'Jeu' },
  { value: 5, label: 'Ven' },
  { value: 6, label: 'Sam' },
]

interface DaySelectorProps {
  value: number[]
  onChange: (days: number[]) => void
}

export function DaySelector({ value, onChange }: DaySelectorProps) {
  const toggle = (day: number) => {
    onChange(
      value.includes(day) ? value.filter(d => d !== day) : [...value, day].sort()
    )
  }

  return (
    <div className="flex gap-2 flex-wrap">
      {DAYS.map(day => (
        <button
          key={day.value}
          type="button"
          onClick={() => toggle(day.value)}
          className={`h-9 w-12 rounded-lg text-sm font-medium transition-colors ${
            value.includes(day.value)
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {day.label}
        </button>
      ))}
    </div>
  )
}
