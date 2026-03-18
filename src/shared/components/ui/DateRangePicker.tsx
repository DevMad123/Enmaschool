// ===== src/shared/components/ui/DateRangePicker.tsx =====

import { useState, useCallback } from 'react'
import { Calendar, ChevronDown } from 'lucide-react'
import { Input } from '@/shared/components/ui/input'
import { Button } from '@/shared/components/ui/button'
import { cn } from '@/shared/lib/utils'

export interface DateRange {
  from: string
  to: string
}

interface DateRangePickerProps {
  value: DateRange
  onChange: (range: DateRange) => void
  className?: string
}

const presets = [
  {
    label: "Aujourd'hui",
    getValue: (): DateRange => {
      const today = new Date().toISOString().slice(0, 10)
      return { from: today, to: today }
    },
  },
  {
    label: '7 derniers jours',
    getValue: (): DateRange => {
      const to = new Date()
      const from = new Date()
      from.setDate(from.getDate() - 7)
      return {
        from: from.toISOString().slice(0, 10),
        to: to.toISOString().slice(0, 10),
      }
    },
  },
  {
    label: '30 derniers jours',
    getValue: (): DateRange => {
      const to = new Date()
      const from = new Date()
      from.setDate(from.getDate() - 30)
      return {
        from: from.toISOString().slice(0, 10),
        to: to.toISOString().slice(0, 10),
      }
    },
  },
  {
    label: 'Ce mois',
    getValue: (): DateRange => {
      const now = new Date()
      const from = new Date(now.getFullYear(), now.getMonth(), 1)
      return {
        from: from.toISOString().slice(0, 10),
        to: now.toISOString().slice(0, 10),
      }
    },
  },
]

export function DateRangePicker({
  value,
  onChange,
  className,
}: DateRangePickerProps) {
  const [showPresets, setShowPresets] = useState(false)

  const handleFromChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const from = e.target.value
      const to = value.to && from > value.to ? from : value.to
      onChange({ from, to })
    },
    [value.to, onChange],
  )

  const handleToChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const to = e.target.value
      const from = value.from && to < value.from ? to : value.from
      onChange({ from, to })
    },
    [value.from, onChange],
  )

  return (
    <div className={cn('relative', className)}>
      <div className="flex items-center gap-2">
        <div className="relative">
          <Calendar className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <Input
            type="date"
            value={value.from}
            onChange={handleFromChange}
            className="pl-9 w-[160px]"
            max={value.to || undefined}
          />
        </div>
        <span className="text-xs text-gray-400">→</span>
        <div className="relative">
          <Input
            type="date"
            value={value.to}
            onChange={handleToChange}
            className="w-[160px]"
            min={value.from || undefined}
          />
        </div>
        <div className="relative">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowPresets(!showPresets)}
            className="gap-1"
          >
            Période
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>

          {showPresets && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowPresets(false)}
              />
              <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                {presets.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => {
                      onChange(preset.getValue())
                      setShowPresets(false)
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
