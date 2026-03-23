import { useState } from 'react'
import { Search, Loader2 } from 'lucide-react'
import { useTeachers } from '../hooks/useTeachers'

interface TeacherSearchSelectProps {
  value: number | null
  onChange: (id: number | null) => void
  filterBySubjectId?: number
  yearId: number
  placeholder?: string
}

export function TeacherSearchSelect({
  value,
  onChange,
  filterBySubjectId,
  yearId,
  placeholder = 'Sélectionner un enseignant...',
}: TeacherSearchSelectProps) {
  const [search, setSearch] = useState('')
  const [focused, setFocused] = useState(false)

  const { data, isLoading } = useTeachers({
    search: search || undefined,
    subject_id: filterBySubjectId || undefined,
    is_active: true,
    academic_year_id: yearId || undefined,
    per_page: 20,
  })

  const teachers = data?.data ?? []
  const selected = teachers.find((t) => t.id === value)

  return (
    <div className="relative">
      {selected && !focused ? (
        <div
          onClick={() => setFocused(true)}
          className="flex items-center justify-between w-full cursor-pointer rounded-md border border-gray-300 bg-white px-3 py-2 text-sm hover:border-indigo-400"
        >
          <span className="font-medium text-gray-800">{selected.full_name}</span>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange(null) }}
            className="text-gray-400 hover:text-gray-600 ml-2"
          >
            ×
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            autoFocus={focused}
            placeholder={placeholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 200)}
            className="w-full rounded-md border border-gray-300 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
          )}
        </div>
      )}

      {/* Dropdown */}
      {focused && (
        <div className="absolute z-50 mt-1 w-full max-h-56 overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
          {teachers.length === 0 ? (
            <p className="px-4 py-3 text-sm text-gray-400">
              {isLoading ? 'Chargement...' : 'Aucun enseignant trouvé'}
            </p>
          ) : (
            teachers.map((teacher) => (
              <button
                key={teacher.id}
                type="button"
                onClick={() => { onChange(teacher.id); setSearch(''); setFocused(false) }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-indigo-50 transition-colors ${
                  value === teacher.id ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-700'
                } ${!teacher.is_active ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={!teacher.is_active}
              >
                <img
                  src={teacher.avatar_url ?? undefined}
                  alt=""
                  className="h-6 w-6 rounded-full bg-indigo-100 object-cover"
                />
                <div>
                  <span className="block">{teacher.full_name}</span>
                  {teacher.weekly_hours !== undefined && (
                    <span className="text-xs text-gray-400">
                      {teacher.weekly_hours}h en cours
                    </span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
