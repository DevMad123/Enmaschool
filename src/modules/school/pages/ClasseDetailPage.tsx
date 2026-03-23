import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, BookOpen, Users, Clock, UserCheck, Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner'
import { useClasse, useClasseSubjects } from '../hooks/useClasses'
import { LevelCategoryBadge } from '../components/LevelCategoryBadge'
import { ClassAssignmentsTab } from './ClassAssignmentsTab'
import { useSchoolStore } from '../store/schoolStore'
import { useTimeSlots, useTimetableWeekView, useDeleteTimetableEntry } from '../hooks/useTimetable'
import { AddTimetableEntryModal } from './AddTimetableEntryModal'
import type { TimetableEntry, DayOfWeek } from '../types/timetable.types'
import { DAY_LABELS } from '../types/timetable.types'
import { formatSlotRange, WORKING_DAYS } from '../lib/timetableHelpers'
import type { Subject } from '../types/school.types'

type Tab = 'info' | 'subjects' | 'assignments' | 'students' | 'timetable'

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'info', label: 'Informations', icon: BookOpen },
  { id: 'subjects', label: 'Matières', icon: BookOpen },
  { id: 'assignments', label: 'Affectations', icon: UserCheck },
  { id: 'students', label: 'Élèves', icon: Users },
  { id: 'timetable', label: 'Emploi du temps', icon: Clock },
]

function TabInfo({ classe }: { classe: NonNullable<ReturnType<typeof useClasse>['data']>['data'] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="rounded-lg border border-slate-200 bg-white p-5 space-y-4">
        <h3 className="font-semibold text-slate-900">Informations générales</h3>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500">Nom</dt>
            <dd className="font-medium text-slate-900">{classe.display_name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Niveau</dt>
            <dd>{classe.level && <LevelCategoryBadge category={classe.level.category.value} />}</dd>
          </div>
          {classe.serie && (
            <div className="flex justify-between">
              <dt className="text-slate-500">Série</dt>
              <dd className="font-medium text-slate-900">{classe.serie}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-slate-500">Section</dt>
            <dd className="font-medium text-slate-900">{classe.section}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Capacité</dt>
            <dd className="font-medium text-slate-900">{classe.capacity} places</dd>
          </div>
        </dl>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5 space-y-4">
        <h3 className="font-semibold text-slate-900">Affectations</h3>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500">Professeur principal</dt>
            <dd className="font-medium text-slate-900">
              {classe.main_teacher?.full_name ?? '—'}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Salle</dt>
            <dd className="font-medium text-slate-900">
              {classe.room?.name ?? '—'}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Matières</dt>
            <dd className="font-medium text-slate-900">{classe.subjects_count ?? 0}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Élèves</dt>
            <dd className="font-medium text-slate-900">{classe.students_count ?? 0}</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}

function TabSubjects({ classeId }: { classeId: number }) {
  const { data, isLoading } = useClasseSubjects(classeId)
  const subjects: Subject[] = data?.data ?? []

  if (isLoading) return <LoadingSpinner />

  if (subjects.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        Aucune matière assignée à cette classe.
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-slate-600">Matière</th>
            <th className="px-4 py-3 text-left font-medium text-slate-600">Code</th>
            <th className="px-4 py-3 text-right font-medium text-slate-600">Coefficient</th>
            <th className="px-4 py-3 text-right font-medium text-slate-600">H/sem</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {subjects.map((s) => (
            <tr key={s.id}>
              <td className="px-4 py-3 font-medium text-slate-900">
                <span className="inline-block h-2.5 w-2.5 rounded-full mr-2" style={{ backgroundColor: s.color }} />
                {s.name}
              </td>
              <td className="px-4 py-3 text-slate-500">{s.code}</td>
              <td className="px-4 py-3 text-right text-slate-900">
                {s.effective_coefficient ?? s.coefficient}
              </td>
              <td className="px-4 py-3 text-right text-slate-500">
                {s.hours_per_week ?? '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TabPlaceholder({ label }: { label: string }) {
  return (
    <div className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 p-12 text-center">
      <p className="text-sm text-slate-500">Disponible en {label}</p>
    </div>
  )
}

function ClassTimetableTab({ classeId }: { classeId: number }) {
  const { currentYearId } = useSchoolStore()
  const yearId = currentYearId ?? 0

  const [addOpen,      setAddOpen]      = useState(false)
  const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null)
  const [defaultDay,   setDefaultDay]   = useState<DayOfWeek>(1)

  const { data: allSlots }   = useTimeSlots({ active_only: true })
  const slots                = allSlots ?? []
  const mondaySlots          = slots.filter((s) => s.day_of_week.value === 1).sort((a, b) => a.order - b.order)

  const { data: weekViewData, isLoading } = useTimetableWeekView({
    year_id:  yearId,
    class_id: classeId,
  })

  const deleteMutation = useDeleteTimetableEntry()

  const getEntry = (day: DayOfWeek, templateSlotId: number): TimetableEntry | undefined => {
    if (!weekViewData) return undefined
    const dayEntries: TimetableEntry[] = (weekViewData.entries as Record<string, TimetableEntry[]>)[String(day)] ?? []
    const templateOrder = mondaySlots.find((ms) => ms.id === templateSlotId)?.order
    const daySlots = slots.filter((s) => s.day_of_week.value === day)
    const correspondingSlot = daySlots.find((s) => s.order === templateOrder)
    if (!correspondingSlot) return undefined
    return dayEntries.find((e) => e.time_slot_id === correspondingSlot.id)
  }

  if (!yearId) {
    return (
      <div className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 p-12 text-center">
        <p className="text-sm text-slate-500">Aucune année scolaire active.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => { setEditingEntry(null); setAddOpen(true) }} className="gap-1.5">
          <Plus className="h-4 w-4" /> Ajouter un cours
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10"><LoadingSpinner /></div>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white overflow-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="border border-slate-200 px-3 py-2 text-left text-xs font-medium text-slate-500 w-28">Créneau</th>
                {WORKING_DAYS.map((day) => (
                  <th key={day} className="border border-slate-200 px-3 py-2 text-center text-xs font-medium text-slate-700 min-w-[130px]">
                    {DAY_LABELS[day]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mondaySlots.map((tslot) => (
                <tr key={tslot.id} className={tslot.is_break ? 'bg-amber-50' : ''}>
                  <td className="border border-slate-200 px-3 py-2 text-xs text-slate-500 whitespace-nowrap">
                    <div className="font-medium text-slate-700">{tslot.name}</div>
                    <div className="text-slate-400">{formatSlotRange(tslot)}</div>
                  </td>
                  {WORKING_DAYS.map((day) => {
                    if (tslot.is_break) {
                      return (
                        <td key={day} className="border border-slate-200 px-2 py-1 text-center text-xs text-amber-600 italic">
                          {day === 1 ? tslot.name : ''}
                        </td>
                      )
                    }
                    const entry = getEntry(day, tslot.id)
                    return (
                      <td
                        key={day}
                        className="border border-slate-200 px-2 py-1 align-top cursor-pointer"
                        onClick={() => {
                          if (entry) { setEditingEntry(entry); setAddOpen(true) }
                          else { setEditingEntry(null); setDefaultDay(day); setAddOpen(true) }
                        }}
                      >
                        {entry ? (
                          <div
                            className="group relative rounded px-2 py-1 text-xs min-h-[48px]"
                            style={{ backgroundColor: (entry.color ?? '#6366F1') + '22', borderLeft: `3px solid ${entry.color ?? '#6366F1'}` }}
                          >
                            <div className="font-semibold truncate" style={{ color: entry.color ?? '#6366F1' }}>
                              {entry.subject?.name ?? '—'}
                            </div>
                            {entry.teacher && <div className="text-slate-500 truncate">{entry.teacher.full_name}</div>}
                            <div className="absolute top-1 right-1 hidden group-hover:flex gap-0.5">
                              <button onClick={(e) => { e.stopPropagation(); setEditingEntry(entry); setAddOpen(true) }}
                                className="rounded p-0.5 bg-white shadow hover:bg-slate-100">
                                <Pencil className="h-3 w-3 text-slate-600" />
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); if (confirm('Supprimer ?')) deleteMutation.mutate(entry.id) }}
                                className="rounded p-0.5 bg-white shadow hover:bg-red-50">
                                <Trash2 className="h-3 w-3 text-red-500" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="h-full min-h-[48px] flex items-center justify-center text-slate-200 hover:text-slate-400 transition-colors">
                            <Plus className="h-4 w-4" />
                          </div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AddTimetableEntryModal
        open={addOpen}
        onClose={() => { setAddOpen(false); setEditingEntry(null) }}
        academicYearId={yearId}
        defaultClassId={classeId}
        defaultDayOfWeek={defaultDay}
        editingEntry={editingEntry}
      />
    </div>
  )
}

export function ClasseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [activeTab, setActiveTab] = useState<Tab>('info')
  const { data, isLoading } = useClasse(Number(id))

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const classe = data?.data
  if (!classe) {
    return <p className="text-sm text-slate-500 py-10 text-center">Classe introuvable.</p>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/school/classes">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" /> Retour
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{classe.display_name}</h1>
          <div className="flex items-center gap-2 mt-1">
            {classe.level && <LevelCategoryBadge category={classe.level.category.value} />}
            {classe.serie && (
              <span className="text-xs font-medium text-violet-700 bg-violet-50 rounded-full px-2 py-0.5">
                Série {classe.serie}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-6">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === 'info' && <TabInfo classe={classe} />}
      {activeTab === 'subjects' && <TabSubjects classeId={classe.id} />}
      {activeTab === 'assignments' && <ClassAssignmentsTab classeId={classe.id} />}
      {activeTab === 'students' && <TabPlaceholder label="Phase 4" />}
      {activeTab === 'timetable' && <ClassTimetableTab classeId={classe.id} />}
    </div>
  )
}
