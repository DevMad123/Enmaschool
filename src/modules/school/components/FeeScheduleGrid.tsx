import { useState } from 'react'
import type { FeeSchedule, FeeType } from '../types/payments.types'
import { formatXOF } from '../lib/paymentHelpers'

const LEVEL_CATEGORIES = [
  { key: 'maternelle', label: 'Maternelle' },
  { key: 'primaire',   label: 'Primaire' },
  { key: 'college',    label: 'Collège' },
  { key: 'lycee',      label: 'Lycée' },
  { key: null,         label: 'Défaut' },
] as const

interface GridCell {
  feeTypeId: number
  levelCategory: string | null
  amount: number
}

interface Props {
  schedules: FeeSchedule[]
  feeTypes: FeeType[]
  levels: Array<{ id: number; category: string; label: string }>
  onUpdate: (cells: GridCell[]) => void
  readonly?: boolean
}

export function FeeScheduleGrid({ schedules, feeTypes, levels, onUpdate, readonly = false }: Props) {
  // Construire une map { feeTypeId_levelCategory: amount }
  const buildInitialGrid = (): Record<string, number> => {
    const grid: Record<string, number> = {}
    for (const s of schedules) {
      const cat = s.school_level?.category ?? null
      const key = `${s.fee_type?.id ?? ''}_${cat ?? 'default'}`
      grid[key] = s.amount
    }
    return grid
  }

  const [grid, setGrid] = useState<Record<string, number>>(buildInitialGrid)

  const cellKey = (feeTypeId: number, cat: string | null) =>
    `${feeTypeId}_${cat ?? 'default'}`

  const handleChange = (feeTypeId: number, cat: string | null, value: string) => {
    const amount = parseFloat(value) || 0
    const key    = cellKey(feeTypeId, cat)
    setGrid((prev) => ({ ...prev, [key]: amount }))
  }

  const handleSave = () => {
    const cells: GridCell[] = []
    for (const ft of feeTypes) {
      for (const level of LEVEL_CATEGORIES) {
        const key    = cellKey(ft.id, level.key as string | null)
        const amount = grid[key]
        if (amount && amount > 0) {
          cells.push({ feeTypeId: ft.id, levelCategory: level.key, amount })
        }
      }
    }
    onUpdate(cells)
  }

  const usedCategories = LEVEL_CATEGORIES.filter(({ key }) => {
    if (key === null) return true // défaut toujours affiché
    return levels.some((l) => l.category === key)
  })

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type de frais
              </th>
              {usedCategories.map(({ key, label }) => (
                <th key={String(key)} className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {feeTypes.map((ft) => (
              <tr key={ft.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">
                  {ft.name}
                  {ft.is_mandatory && (
                    <span className="ml-1.5 rounded-full bg-red-50 px-1.5 py-0.5 text-xs text-red-600">
                      Obligatoire
                    </span>
                  )}
                </td>
                {usedCategories.map(({ key, label }) => {
                  const k      = cellKey(ft.id, key as string | null)
                  const amount = grid[k] ?? 0
                  return (
                    <td key={String(key)} className="px-4 py-3 text-right">
                      {readonly ? (
                        <span className={amount > 0 ? 'text-gray-800' : 'text-gray-300'}>
                          {amount > 0 ? formatXOF(amount) : '—'}
                        </span>
                      ) : (
                        <input
                          type="number"
                          min={0}
                          step={1000}
                          value={amount || ''}
                          placeholder="—"
                          onChange={(e) => handleChange(ft.id, key as string | null, e.target.value)}
                          className="w-28 rounded border border-gray-300 px-2 py-1 text-right text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!readonly && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Sauvegarder tous
          </button>
        </div>
      )}
    </div>
  )
}
