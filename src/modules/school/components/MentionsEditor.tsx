import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'

interface MentionRow {
  threshold: string
  label: string
}

interface MentionsEditorProps {
  value: Record<string, string>
  onChange: (value: Record<string, string>) => void
}

function recordToRows(record: Record<string, string>): MentionRow[] {
  return Object.entries(record)
    .map(([threshold, label]) => ({ threshold, label }))
    .sort((a, b) => Number(b.threshold) - Number(a.threshold))
}

function rowsToRecord(rows: MentionRow[]): Record<string, string> {
  const result: Record<string, string> = {}
  rows.forEach(r => { if (r.threshold !== '') result[r.threshold] = r.label })
  return result
}

export function MentionsEditor({ value, onChange }: MentionsEditorProps) {
  const [rows, setRows] = useState<MentionRow[]>(() => recordToRows(value))

  const update = (newRows: MentionRow[]) => {
    setRows(newRows)
    onChange(rowsToRecord(newRows))
  }

  const handleChange = (index: number, field: keyof MentionRow, val: string) => {
    const updated = rows.map((r, i) => i === index ? { ...r, [field]: val } : r)
    update(updated)
  }

  const addRow = () => update([...rows, { threshold: '', label: '' }])

  const removeRow = (index: number) => update(rows.filter((_, i) => i !== index))

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[1fr_2fr_auto] gap-2 text-xs font-medium text-gray-500 px-1">
        <span>Seuil (≥)</span>
        <span>Mention</span>
        <span />
      </div>
      {rows.map((row, i) => (
        <div key={i} className="grid grid-cols-[1fr_2fr_auto] gap-2 items-center">
          <input
            type="number"
            min={0}
            max={100}
            step={0.5}
            value={row.threshold}
            onChange={e => handleChange(i, 'threshold', e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            placeholder="ex: 16"
          />
          <input
            type="text"
            value={row.label}
            onChange={e => handleChange(i, 'label', e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            placeholder="ex: Très Bien"
          />
          <button
            type="button"
            onClick={() => removeRow(i)}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addRow}
        className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 mt-1"
      >
        <Plus className="h-4 w-4" />
        Ajouter une mention
      </button>
    </div>
  )
}
