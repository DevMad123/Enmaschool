import { useState, useEffect, useCallback } from 'react'
import { X, AlertTriangle } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { useClasses } from '../hooks/useClasses'
import { useSubjects } from '../hooks/useSubjects'
import { useTeachers } from '../hooks/useTeachers'
import { useRooms } from '../hooks/useRooms'
import { useTimeSlots, useCreateTimetableEntry, useUpdateTimetableEntry, useCheckConflicts } from '../hooks/useTimetable'
import type { TimetableEntry, StoreTimetableEntryPayload, DayOfWeek } from '../types/timetable.types'
import { DAY_LABELS } from '../types/timetable.types'
import { formatSlotRange, WORKING_DAYS } from '../lib/timetableHelpers'

interface Props {
  open:              boolean
  onClose:           () => void
  academicYearId:    number
  defaultClassId?:   number
  defaultDayOfWeek?: DayOfWeek
  editingEntry?:     TimetableEntry | null
}

export function AddTimetableEntryModal({
  open, onClose, academicYearId, defaultClassId, defaultDayOfWeek, editingEntry,
}: Props) {
  const [classId,    setClassId]    = useState<number>(defaultClassId ?? 0)
  const [dayOfWeek,  setDayOfWeek]  = useState<DayOfWeek>(defaultDayOfWeek ?? 1)
  const [slotId,     setSlotId]     = useState<number>(0)
  const [subjectId,  setSubjectId]  = useState<number>(0)
  const [teacherId,  setTeacherId]  = useState<number | null>(null)
  const [roomId,     setRoomId]     = useState<number | null>(null)
  const [color,      setColor]      = useState<string>('#6366F1')
  const [notes,      setNotes]      = useState<string>('')

  const [conflicts, setConflicts] = useState<Record<string, { message: string }>>({})
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null)

  const { data: classesData } = useClasses({ academic_year_id: academicYearId })
  const classes = classesData?.data ?? []

  const { data: subjectsData } = useSubjects()
  const subjects = subjectsData?.data ?? []

  const { data: teachersData } = useTeachers({ active_only: true })
  const teachers = teachersData?.data ?? []

  const { data: roomsData } = useRooms()
  const rooms = roomsData?.data ?? []

  const { data: allSlots } = useTimeSlots({ active_only: true })
  const daySlots = (allSlots ?? []).filter((s) => s.day_of_week.value === dayOfWeek && !s.is_break)

  const createMutation = useCreateTimetableEntry()
  const updateMutation = useUpdateTimetableEntry()
  const conflictMutation = useCheckConflicts()

  // Pre-fill form when editing
  useEffect(() => {
    if (editingEntry) {
      setClassId(editingEntry.class_id)
      setSlotId(editingEntry.time_slot_id)
      setSubjectId(editingEntry.subject_id)
      setTeacherId(editingEntry.teacher_id)
      setRoomId(editingEntry.room_id)
      setColor(editingEntry.color ?? '#6366F1')
      setNotes(editingEntry.notes ?? '')
      if (editingEntry.time_slot) {
        setDayOfWeek(editingEntry.time_slot.day_of_week.value)
      }
    } else {
      setClassId(defaultClassId ?? 0)
      setDayOfWeek(defaultDayOfWeek ?? 1)
      setSlotId(0)
      setSubjectId(0)
      setTeacherId(null)
      setRoomId(null)
      setColor('#6366F1')
      setNotes('')
    }
    setConflicts({})
  }, [editingEntry, open, defaultClassId, defaultDayOfWeek])

  // Debounced conflict check
  const triggerConflictCheck = useCallback(() => {
    if (!slotId || !academicYearId) return
    if (debounceTimer) clearTimeout(debounceTimer)

    const timer = setTimeout(async () => {
      const result = await conflictMutation.mutateAsync({
        academic_year_id:  academicYearId,
        time_slot_id:      slotId,
        teacher_id:        teacherId,
        room_id:           roomId,
        exclude_entry_id:  editingEntry?.id ?? null,
      })
      setConflicts(result?.conflicts ?? {})
    }, 500)

    setDebounceTimer(timer)
  }, [slotId, academicYearId, teacherId, roomId, editingEntry?.id])

  useEffect(() => {
    triggerConflictCheck()
    return () => { if (debounceTimer) clearTimeout(debounceTimer) }
  }, [slotId, teacherId, roomId])

  const handleSubmit = () => {
    if (!classId || !slotId || !subjectId) return

    const payload: StoreTimetableEntryPayload = {
      academic_year_id: academicYearId,
      class_id:         classId,
      time_slot_id:     slotId,
      subject_id:       subjectId,
      teacher_id:       teacherId,
      room_id:          roomId,
      color:            color || null,
      notes:            notes || null,
    }

    if (editingEntry) {
      updateMutation.mutate(
        { id: editingEntry.id, data: payload },
        { onSuccess: onClose },
      )
    } else {
      createMutation.mutate(payload, { onSuccess: onClose })
    }
  }

  if (!open) return null

  const isPending = createMutation.isPending || updateMutation.isPending
  const hasConflicts = Object.keys(conflicts).length > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-900">
            {editingEntry ? 'Modifier le cours' : 'Ajouter un cours'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Class */}
          {!defaultClassId && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Classe *</label>
              <select
                value={classId}
                onChange={(e) => setClassId(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value={0}>Sélectionner une classe</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.display_name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Day + Slot */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Jour *</label>
              <select
                value={dayOfWeek}
                onChange={(e) => { setDayOfWeek(Number(e.target.value) as DayOfWeek); setSlotId(0) }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                {WORKING_DAYS.map((d) => (
                  <option key={d} value={d}>{DAY_LABELS[d]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Créneau *</label>
              <select
                value={slotId}
                onChange={(e) => setSlotId(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value={0}>—</option>
                {daySlots.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({formatSlotRange(s)})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Matière *</label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value={0}>Sélectionner une matière</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Teacher + Room */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Enseignant</label>
              <select
                value={teacherId ?? ''}
                onChange={(e) => setTeacherId(e.target.value ? Number(e.target.value) : null)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">Aucun</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>{t.full_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Salle</label>
              <select
                value={roomId ?? ''}
                onChange={(e) => setRoomId(e.target.value ? Number(e.target.value) : null)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">Aucune</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Color + Notes */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Couleur</label>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-9 w-full rounded-lg border border-slate-300 px-1 py-1 cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optionnel"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          {/* Conflict warnings */}
          {hasConflicts && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium text-amber-800">
                <AlertTriangle className="h-4 w-4" />
                Conflits détectés
              </div>
              {Object.values(conflicts).map((c, i) => (
                <p key={i} className="text-xs text-amber-700">{c.message}</p>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-200">
          <Button variant="outline" onClick={onClose} disabled={isPending}>Annuler</Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !classId || !slotId || !subjectId}
          >
            {isPending ? 'Enregistrement…' : editingEntry ? 'Modifier' : 'Ajouter'}
          </Button>
        </div>
      </div>
    </div>
  )
}
