const DEFAULT_SECTIONS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'A', 'B', 'C', 'D', 'E', 'F']

interface SectionSelectProps {
  value: string
  onChange: (value: string) => void
  options?: string[]
  disabled?: boolean
}

export function SectionSelect({
  value,
  onChange,
  options = DEFAULT_SECTIONS,
  disabled,
}: SectionSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <option value="">Choisir une section</option>
      {options.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  )
}
