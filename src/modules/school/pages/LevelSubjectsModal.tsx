import { useState, useEffect } from 'react'
import { X, BookOpen, Info } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner'
import { useSubjects } from '../hooks/useSubjects'
import { useLevelSubjects, useSyncLevelSubjects } from '../hooks/useSchoolLevels'
import type { SchoolLevel } from '../types/school.types'

interface Props {
  level: SchoolLevel
  onClose: () => void
}

export function LevelSubjectsModal({ level, onClose }: Props) {
  const [selected, setSelected] = useState<Set<number>>(new Set())

  const { data: allSubjectsData, isLoading: loadingAll } = useSubjects()
  const { data: levelSubjects,  isLoading: loadingLevel } = useLevelSubjects(level.id)
  const syncMutation = useSyncLevelSubjects()

  const allSubjects = allSubjectsData?.data ?? []

  // Pré-cocher les matières déjà assignées
  useEffect(() => {
    if (levelSubjects) {
      setSelected(new Set(levelSubjects.map((s) => s.id)))
    }
  }, [levelSubjects])

  const toggle = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleSave = () => {
    syncMutation.mutate(
      { levelId: level.id, subjectIds: Array.from(selected) },
      { onSuccess: onClose },
    )
  }

  const isLoading = loadingAll || loadingLevel

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-indigo-600" />
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Matières — {level.label}
              </h2>
              <p className="text-xs text-gray-500">{level.short_label}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Info propagation */}
        <div className="mx-5 mt-4 flex items-start gap-2 rounded-lg bg-blue-50 px-3 py-2.5 text-xs text-blue-700">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            Les matières sélectionnées seront automatiquement appliquées à toutes les classes de ce niveau.
          </span>
        </div>

        {/* Liste matières */}
        <div className="flex-1 overflow-y-auto px-5 py-3">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : allSubjects.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">
              Aucune matière disponible. Créez des matières dans la section Matières.
            </p>
          ) : (
            <div className="space-y-1">
              {allSubjects.map((subject) => {
                const isChecked = selected.has(subject.id)
                return (
                  <label
                    key={subject.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
                      isChecked ? 'bg-indigo-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggle(subject.id)}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span
                      className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: subject.color ?? '#6366f1' }}
                    />
                    <span className="flex-1 text-sm font-medium text-gray-900">{subject.name}</span>
                    <span className="text-xs text-gray-400">
                      Coeff. {subject.coefficient}
                    </span>
                  </label>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
          <span className="text-xs text-gray-500">
            {selected.size} matière{selected.size !== 1 ? 's' : ''} sélectionnée{selected.size !== 1 ? 's' : ''}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Annuler
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={syncMutation.isPending}
            >
              {syncMutation.isPending ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
