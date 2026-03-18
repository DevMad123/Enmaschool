import { previewDisplayName } from '../lib/classeHelpers'
import type { SchoolLevel, LyceeSerie } from '../types/school.types'

interface ClasseDisplayNamePreviewProps {
  level?: SchoolLevel
  serie?: LyceeSerie | null
  section?: string
}

export function ClasseDisplayNamePreview({
  level,
  serie,
  section,
}: ClasseDisplayNamePreviewProps) {
  if (!level || !section) {
    return (
      <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-4">
        <span className="text-lg text-slate-400">—</span>
      </div>
    )
  }

  const displayName = previewDisplayName(level, section, serie)

  return (
    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-indigo-200 bg-indigo-50 px-6 py-4">
      <span className="text-xs font-medium text-indigo-500 mb-1">Aperçu</span>
      <span className="text-2xl font-bold text-indigo-700">{displayName}</span>
    </div>
  )
}
