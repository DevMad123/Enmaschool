import { useState } from 'react'
import { ToggleLeft, ToggleRight, BookOpen } from 'lucide-react'
import { useSchoolLevels, useToggleSchoolLevel } from '../hooks/useSchoolLevels'
import { LevelCategoryBadge } from '../components/LevelCategoryBadge'
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner'
import type { LevelCategory, SchoolLevel } from '../types/school.types'
import { getLevelCategoryLabel } from '../lib/classeHelpers'
import { LevelSubjectsModal } from './LevelSubjectsModal'

const CATEGORIES: LevelCategory[] = ['maternelle', 'primaire', 'college', 'lycee']

function LevelCard({
  level,
  onToggle,
  onEditSubjects,
}: {
  level: SchoolLevel
  onToggle: (id: number) => void
  onEditSubjects: (level: SchoolLevel) => void
}) {
  return (
    <div
      className={`relative rounded-lg border p-4 transition-colors ${
        level.is_active
          ? 'border-slate-200 bg-white'
          : 'border-slate-100 bg-slate-50 opacity-60'
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <h4 className="text-sm font-semibold text-slate-900">{level.label}</h4>
          <p className="text-xs text-slate-500 mt-0.5">{level.short_label} — {level.code}</p>
        </div>
        <button
          onClick={() => onToggle(level.id)}
          className="text-slate-400 hover:text-indigo-600 transition-colors"
          title={level.is_active ? 'Désactiver' : 'Activer'}
        >
          {level.is_active ? (
            <ToggleRight className="h-5 w-5 text-indigo-600" />
          ) : (
            <ToggleLeft className="h-5 w-5" />
          )}
        </button>
      </div>
      {level.requires_serie && (
        <span className="mt-2 inline-flex items-center rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700">
          Avec série
        </span>
      )}
      <div className="mt-3 border-t border-slate-100 pt-2.5">
        <button
          onClick={() => onEditSubjects(level)}
          className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
        >
          <BookOpen className="h-3.5 w-3.5" />
          Affecter les matières
        </button>
      </div>
    </div>
  )
}

export function SchoolLevelsPage() {
  const [filterCategory,    setFilterCategory]    = useState<LevelCategory | null>(null)
  const [subjectsForLevel,  setSubjectsForLevel]  = useState<SchoolLevel | null>(null)
  const { data, isLoading } = useSchoolLevels()
  const { mutate: toggle } = useToggleSchoolLevel()

  const levels = data?.data ?? []

  const grouped = CATEGORIES.reduce<Record<LevelCategory, SchoolLevel[]>>((acc, cat) => {
    acc[cat] = levels.filter((l) => l.category.value === cat)
    return acc
  }, {} as Record<LevelCategory, SchoolLevel[]>)

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Niveaux scolaires</h1>
          <p className="text-sm text-slate-500 mt-1">
            Niveaux disponibles pour votre établissement
          </p>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterCategory(null)}
          className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
            filterCategory === null
              ? 'bg-indigo-100 text-indigo-700'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Tous
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              filterCategory === cat
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {getLevelCategoryLabel(cat)}
          </button>
        ))}
      </div>

      {/* Grouped levels */}
      {CATEGORIES.filter((cat) => !filterCategory || filterCategory === cat).map((cat) => {
        const catLevels = grouped[cat]
        if (!catLevels || catLevels.length === 0) return null

        return (
          <div key={cat}>
            <div className="flex items-center gap-2 mb-3">
              <LevelCategoryBadge category={cat} />
              <span className="text-sm text-slate-400">
                {catLevels.length} niveau{catLevels.length > 1 ? 'x' : ''}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {catLevels.map((level) => (
                <LevelCard
                  key={level.id}
                  level={level}
                  onToggle={(id) => toggle(id)}
                  onEditSubjects={setSubjectsForLevel}
                />
              ))}
            </div>
          </div>
        )
      })}

      {subjectsForLevel && (
        <LevelSubjectsModal
          level={subjectsForLevel}
          onClose={() => setSubjectsForLevel(null)}
        />
      )}
    </div>
  )
}
