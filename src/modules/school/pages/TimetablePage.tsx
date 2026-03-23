import { useState, useEffect } from 'react'
import { Clock, Plus, Pencil, Trash2, Settings2, Download } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner'
import { useAuthStore } from '@/modules/auth/store/authStore'
import { useSchoolStore } from '../store/schoolStore'
import { useAcademicYears } from '../hooks/useAcademicYears'
import { useClasses } from '../hooks/useClasses'
import { useTimeSlots, useTimetableWeekView, useDeleteTimetableEntry, useDownloadTimetablePdf } from '../hooks/useTimetable'
import { AddTimetableEntryModal } from './AddTimetableEntryModal'
import { TimeSlotsManagerModal } from './TimeSlotsManagerModal'
import type { TimetableEntry, DayOfWeek } from '../types/timetable.types'
import { DAY_LABELS, DAY_SHORT } from '../types/timetable.types'
import { formatSlotRange, WORKING_DAYS } from '../lib/timetableHelpers'

export function TimetablePage() {
  const { currentYearId } = useSchoolStore()
  const userRoles = useAuthStore((s) => s.roles)
  const canManageSlots = userRoles.some((r) => ['school_admin', 'director'].includes(r))

  const [selectedYearId,   setSelectedYearId]   = useState<number | null>(null)
  const [selectedClassId,  setSelectedClassId]  = useState<number>(0)
  const [addOpen,          setAddOpen]          = useState(false)
  const [editingEntry,     setEditingEntry]      = useState<TimetableEntry | null>(null)
  const [defaultDay,       setDefaultDay]        = useState<DayOfWeek>(1)
  const [slotsManagerOpen, setSlotsManagerOpen] = useState(false)

  useEffect(() => {
    if (currentYearId && selectedYearId === null) {
      setSelectedYearId(currentYearId)
    }
  }, [currentYearId])

  const { data: yearsData }   = useAcademicYears()
  const years                 = yearsData?.data ?? []
  const yearId                = selectedYearId ?? 0

  const { data: classesData } = useClasses({ academic_year_id: yearId || undefined })
  const classes               = classesData?.data ?? []

  // All time slots (static)
  const { data: allSlots }    = useTimeSlots({ active_only: true })
  const slots                 = allSlots ?? []

  // Week view for selected class
  const { data: weekViewData, isLoading } = useTimetableWeekView({
    year_id:  yearId,
    class_id: selectedClassId || undefined,
  })
  const weekView = weekViewData

  const deleteMutation  = useDeleteTimetableEntry()
  const downloadMutation = useDownloadTimetablePdf()

  // Build unique slot rows (order by order number, ignoring day) — use first day's slots as template
  const mondaySlots = slots.filter((s) => s.day_of_week.value === 1).sort((a, b) => a.order - b.order)

  const getEntry = (day: DayOfWeek, slotId: number): TimetableEntry | undefined => {
    if (!weekView) return undefined
    const dayEntries: TimetableEntry[] = (weekView.entries as Record<string, TimetableEntry[]>)[String(day)] ?? []
    // find by matching time_slot.start_time across slots with same order
    const daySlots = slots.filter((s) => s.day_of_week.value === day)
    const correspondingSlot = daySlots.find((s) => s.order === mondaySlots.find((ms) => ms.id === slotId)?.order)
    if (!correspondingSlot) return undefined
    return dayEntries.find((e) => e.time_slot_id === correspondingSlot.id)
  }

  const handleDelete = (entry: TimetableEntry) => {
    if (confirm('Supprimer ce cours de l\'emploi du temps ?')) {
      deleteMutation.mutate(entry.id)
    }
  }

  const handleCellClick = (day: DayOfWeek, slotId: number) => {
    const existing = getEntry(day, slotId)
    if (existing) {
      setEditingEntry(existing)
      setAddOpen(true)
    } else {
      setEditingEntry(null)
      setDefaultDay(day)
      setAddOpen(true)
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50">
            <Clock className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Emploi du temps</h1>
            <p className="text-sm text-slate-500">Gestion des horaires par classe</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canManageSlots && (
            <Button
              variant="outline"
              onClick={() => setSlotsManagerOpen(true)}
              className="gap-1.5"
            >
              <Settings2 className="h-4 w-4" />
              Créneaux
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => {
              if (!selectedClassId || !yearId) return
              const classe = classes.find((c) => c.id === selectedClassId)
              const filename = `emploi_du_temps_${classe?.display_name ?? selectedClassId}.pdf`
              downloadMutation.mutate({ classId: selectedClassId, yearId, filename })
            }}
            disabled={!selectedClassId || !yearId || downloadMutation.isPending}
            className="gap-1.5"
          >
            <Download className="h-4 w-4" />
            {downloadMutation.isPending ? 'Export…' : 'PDF'}
          </Button>
          <Button
            onClick={() => { setEditingEntry(null); setAddOpen(true) }}
            disabled={!selectedClassId || !yearId}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Ajouter un cours
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500">Année scolaire</label>
          <select
            value={selectedYearId ?? ''}
            onChange={(e) => setSelectedYearId(Number(e.target.value) || null)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm min-w-[180px]"
          >
            <option value="">Sélectionner</option>
            {years.map((y) => (
              <option key={y.id} value={y.id}>{y.name}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500">Classe</label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(Number(e.target.value))}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm min-w-[180px]"
          >
            <option value={0}>Sélectionner une classe</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.display_name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Timetable Grid */}
      {!selectedClassId || !yearId ? (
        <div className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 p-16 text-center">
          <Clock className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">Sélectionnez une année scolaire et une classe pour afficher l'emploi du temps.</p>
        </div>
      ) : isLoading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white overflow-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="border border-slate-200 px-3 py-2 text-left text-xs font-medium text-slate-500 w-28">
                  Créneau
                </th>
                {WORKING_DAYS.map((day) => (
                  <th
                    key={day}
                    className="border border-slate-200 px-3 py-2 text-center text-xs font-medium text-slate-700 min-w-[140px]"
                  >
                    <span className="hidden sm:inline">{DAY_LABELS[day]}</span>
                    <span className="sm:hidden">{DAY_SHORT[day]}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mondaySlots.map((templateSlot) => (
                <tr
                  key={templateSlot.id}
                  className={templateSlot.is_break ? 'bg-amber-50' : 'hover:bg-slate-50/50'}
                >
                  {/* Time label */}
                  <td className="border border-slate-200 px-3 py-2 text-xs text-slate-500 whitespace-nowrap">
                    <div className="font-medium text-slate-700">{templateSlot.name}</div>
                    <div className="text-slate-400">{formatSlotRange(templateSlot)}</div>
                  </td>

                  {/* Day cells */}
                  {WORKING_DAYS.map((day) => {
                    const entry = getEntry(day, templateSlot.id)
                    if (templateSlot.is_break) {
                      return (
                        <td
                          key={day}
                          className="border border-slate-200 px-2 py-1 text-center text-xs text-amber-600 italic"
                        >
                          {day === 1 ? templateSlot.name : ''}
                        </td>
                      )
                    }

                    return (
                      <td
                        key={day}
                        className="border border-slate-200 px-2 py-1 align-top cursor-pointer"
                        onClick={() => handleCellClick(day, templateSlot.id)}
                      >
                        {entry ? (
                          <TimetableCell
                            entry={entry}
                            onEdit={(e) => { setEditingEntry(e); setAddOpen(true) }}
                            onDelete={handleDelete}
                          />
                        ) : (
                          <div className="h-full min-h-[56px] flex items-center justify-center text-slate-200 hover:text-slate-400 transition-colors">
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

      {/* Modals */}
      <AddTimetableEntryModal
        open={addOpen}
        onClose={() => { setAddOpen(false); setEditingEntry(null) }}
        academicYearId={yearId}
        defaultClassId={selectedClassId || undefined}
        defaultDayOfWeek={defaultDay}
        editingEntry={editingEntry}
      />
      <TimeSlotsManagerModal
        open={slotsManagerOpen}
        onClose={() => setSlotsManagerOpen(false)}
      />
    </div>
  )
}

// ── TimetableCell ───────────────────────────────────────────────────────────

function TimetableCell({
  entry,
  onEdit,
  onDelete,
}: {
  entry:    TimetableEntry
  onEdit:   (e: TimetableEntry) => void
  onDelete: (e: TimetableEntry) => void
}) {
  const bg   = entry.color ?? '#6366F1'
  const text = isLight(bg) ? '#1e293b' : '#ffffff'

  return (
    <div
      className="group relative rounded-md px-2 py-1.5 text-xs min-h-[56px]"
      style={{ backgroundColor: bg + '22', borderLeft: `3px solid ${bg}` }}
    >
      <div className="font-semibold truncate" style={{ color: bg }}>
        {entry.subject?.name ?? '—'}
      </div>
      {entry.teacher && (
        <div className="text-slate-500 truncate">{entry.teacher.full_name}</div>
      )}
      {entry.room && (
        <div className="text-slate-400 truncate">{entry.room.name}</div>
      )}

      {/* Action buttons on hover */}
      <div className="absolute top-1 right-1 hidden group-hover:flex gap-0.5">
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(entry) }}
          className="rounded p-0.5 bg-white shadow hover:bg-slate-100"
        >
          <Pencil className="h-3 w-3 text-slate-600" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(entry) }}
          className="rounded p-0.5 bg-white shadow hover:bg-red-50"
        >
          <Trash2 className="h-3 w-3 text-red-500" />
        </button>
      </div>
    </div>
  )
}

/** Returns true if a hex color is "light" enough to use dark text */
function isLight(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 150
}
