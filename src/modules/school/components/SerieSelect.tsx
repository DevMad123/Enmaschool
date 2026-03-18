import type { LyceeSerie } from '../types/school.types'

const SERIES: { value: LyceeSerie; label: string }[] = [
  { value: 'A', label: 'Série A' },
  { value: 'B', label: 'Série B' },
  { value: 'C', label: 'Série C' },
  { value: 'D', label: 'Série D' },
  { value: 'F1', label: 'Série F1' },
  { value: 'F2', label: 'Série F2' },
  { value: 'G1', label: 'Série G1' },
  { value: 'G2', label: 'Série G2' },
  { value: 'G3', label: 'Série G3' },
]

interface SerieSelectProps {
  value: LyceeSerie | null
  onChange: (value: LyceeSerie | null) => void
  disabled?: boolean
}

export function SerieSelect({ value, onChange, disabled }: SerieSelectProps) {
  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange((e.target.value || null) as LyceeSerie | null)}
      disabled={disabled}
      className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <option value="">Choisir une série</option>
      {SERIES.map((s) => (
        <option key={s.value} value={s.value}>
          {s.label}
        </option>
      ))}
    </select>
  )
}
