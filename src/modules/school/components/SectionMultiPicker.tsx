import { useCallback } from 'react'
import { Button } from '@/shared/components/ui/button'

const NUMERIC = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
const ALPHA = ['A', 'B', 'C', 'D', 'E', 'F']

interface SectionMultiPickerProps {
  selected: string[]
  onChange: (selected: string[]) => void
}

export function SectionMultiPicker({ selected, onChange }: SectionMultiPickerProps) {
  const toggle = useCallback(
    (section: string) => {
      if (selected.includes(section)) {
        onChange(selected.filter((s) => s !== section))
      } else {
        onChange([...selected, section])
      }
    },
    [selected, onChange],
  )

  const selectRange = useCallback(
    (range: string[]) => {
      const allSelected = range.every((s) => selected.includes(s))
      if (allSelected) {
        onChange(selected.filter((s) => !range.includes(s)))
      } else {
        const merged = [...new Set([...selected, ...range])]
        onChange(merged)
      }
    },
    [selected, onChange],
  )

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="text-xs h-7"
          onClick={() => selectRange(NUMERIC.slice(0, 5))}
        >
          1-5
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="text-xs h-7"
          onClick={() => selectRange(NUMERIC)}
        >
          1-10
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="text-xs h-7"
          onClick={() => selectRange(ALPHA.slice(0, 5))}
        >
          A-E
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="text-xs h-7"
          onClick={() => onChange([])}
        >
          Effacer
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {[...NUMERIC, ...ALPHA].map((section) => {
          const isSelected = selected.includes(section)
          return (
            <button
              key={section}
              type="button"
              onClick={() => toggle(section)}
              className={`flex h-9 w-9 items-center justify-center rounded-md border text-sm font-medium transition-colors ${
                isSelected
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              {section}
            </button>
          )
        })}
      </div>
    </div>
  )
}
