import { Star } from 'lucide-react'
import type { Subject } from '../types/school.types'

interface SubjectTagListProps {
  subjects: Subject[]
  primarySubjectId?: number
  max?: number
}

export function SubjectTagList({ subjects, primarySubjectId, max = 4 }: SubjectTagListProps) {
  const visible = subjects.slice(0, max)
  const remaining = subjects.length - visible.length

  return (
    <div className="flex flex-wrap gap-1">
      {visible.map((subject) => {
        const isPrimary = subject.id === primarySubjectId
        return (
          <span
            key={subject.id}
            className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium border ${
              isPrimary
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                : 'bg-gray-50 text-gray-600 border-gray-200'
            }`}
          >
            {isPrimary && <Star className="h-2.5 w-2.5 fill-indigo-400 text-indigo-400" />}
            {subject.name}
          </span>
        )
      })}
      {remaining > 0 && (
        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-500">
          +{remaining} autre{remaining > 1 ? 's' : ''}
        </span>
      )}
      {subjects.length === 0 && (
        <span className="text-xs text-gray-400 italic">Aucune matière</span>
      )}
    </div>
  )
}
