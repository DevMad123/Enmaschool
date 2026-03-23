import { useState } from 'react'
import { X, Plus, Pencil, Trash2, Power, GripVertical } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import {
  useTimeSlots,
  useCreateTimeSlot,
  useUpdateTimeSlot,
  useDeleteTimeSlot,
  useToggleTimeSlot,
} from '../hooks/useTimetable'
import type { TimeSlot, DayOfWeek } from '../types/timetable.types'
import { DAY_LABELS } from '../types/timetable.types'
import { formatSlotRange, WORKING_DAYS } from '../lib/timetableHelpers'

// ── Formulaire inline pour un créneau ─────────────────────────────────────

interface SlotFormProps {
  initial?: Partial<TimeSlot>
  onSave:   (data: SlotFormData) => void
  onCancel: () => void
  saving:   boolean
}

interface SlotFormData {
  name:             string
  day_of_week:      number
  start_time:       string
  end_time:         string
  duration_minutes: number
  is_break:         boolean
  order:            number
  is_active:        boolean
}

function SlotForm({ initial, onSave, onCancel, saving }: SlotFormProps) {
  const [name,     setName]     = useState(initial?.name ?? '')
  const [day,      setDay]      = useState<number>(initial?.day_of_week?.value ?? 1)
  const [start,    setStart]    = useState(initial?.start_time?.slice(0, 5) ?? '')
  const [end,      setEnd]      = useState(initial?.end_time?.slice(0, 5) ?? '')
  const [duration, setDuration] = useState(initial?.duration_minutes ?? 60)
  const [isBreak,  setIsBreak]  = useState(initial?.is_break ?? false)
  const [order,    setOrder]    = useState(initial?.order ?? 1)
  const [isActive, setIsActive] = useState(initial?.is_active ?? true)

  // Auto-calc duration when times change
  const handleStartChange = (v: string) => {
    setStart(v)
    if (v && end) {
      const [sh, sm] = v.split(':').map(Number)
      const [eh, em] = end.split(':').map(Number)
      const mins = (eh! * 60 + em!) - (sh! * 60 + sm!)
      if (mins > 0) setDuration(mins)
    }
  }
  const handleEndChange = (v: string) => {
    setEnd(v)
    if (start && v) {
      const [sh, sm] = start.split(':').map(Number)
      const [eh, em] = v.split(':').map(Number)
      const mins = (eh! * 60 + em!) - (sh! * 60 + sm!)
      if (mins > 0) setDuration(mins)
    }
  }

  const valid = name.trim() && start && end && order > 0

  return (
    <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {/* Nom */}
        <div className="col-span-2">
          <label className="block text-xs font-medium text-slate-600 mb-1">Nom *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ex: 1er cours, Récréation…"
            className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
          />
        </div>

        {/* Jour */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Jour *</label>
          <select
            value={day}
            onChange={(e) => setDay(Number(e.target.value))}
            className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
          >
            {WORKING_DAYS.map((d) => (
              <option key={d} value={d}>{DAY_LABELS[d]}</option>
            ))}
          </select>
        </div>

        {/* Ordre */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Ordre *</label>
          <input
            type="number"
            min={1}
            value={order}
            onChange={(e) => setOrder(Number(e.target.value))}
            className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
          />
        </div>

        {/* Heure début */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Début *</label>
          <input
            type="time"
            value={start}
            onChange={(e) => handleStartChange(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
          />
        </div>

        {/* Heure fin */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Fin *</label>
          <input
            type="time"
            value={end}
            onChange={(e) => handleEndChange(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
          />
        </div>

        {/* Durée (calculée) */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Durée (min)</label>
          <input
            type="number"
            min={1}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm bg-slate-50"
          />
        </div>

        {/* Options */}
        <div className="flex items-end gap-4 pb-1">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={isBreak}
              onChange={(e) => setIsBreak(e.target.checked)}
              className="rounded"
            />
            <span className="text-slate-700">Pause / récréation</span>
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button variant="outline" size="sm" onClick={onCancel} disabled={saving}>Annuler</Button>
        <Button
          size="sm"
          disabled={!valid || saving}
          onClick={() => onSave({ name: name.trim(), day_of_week: day, start_time: start, end_time: end, duration_minutes: duration, is_break: isBreak, order, is_active: isActive })}
        >
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </Button>
      </div>
    </div>
  )
}

// ── Modal principal ────────────────────────────────────────────────────────

interface Props {
  open:    boolean
  onClose: () => void
}

export function TimeSlotsManagerModal({ open, onClose }: Props) {
  const [selectedDay,  setSelectedDay]  = useState<DayOfWeek>(1)
  const [addingNew,    setAddingNew]    = useState(false)
  const [editingSlot,  setEditingSlot]  = useState<TimeSlot | null>(null)

  const { data: allSlots, isLoading } = useTimeSlots()
  const slots = (allSlots ?? [])
    .filter((s) => s.day_of_week.value === selectedDay)
    .sort((a, b) => a.order - b.order)

  const createMutation = useCreateTimeSlot()
  const updateMutation = useUpdateTimeSlot()
  const deleteMutation = useDeleteTimeSlot()
  const toggleMutation = useToggleTimeSlot()

  const handleCreate = (data: SlotFormData) => {
    createMutation.mutate(data as any, {
      onSuccess: () => setAddingNew(false),
    })
  }

  const handleUpdate = (data: SlotFormData) => {
    if (!editingSlot) return
    updateMutation.mutate({ id: editingSlot.id, data: data as any }, {
      onSuccess: () => setEditingSlot(null),
    })
  }

  const handleDelete = (slot: TimeSlot) => {
    if (confirm(`Supprimer le créneau "${slot.name}" ?`)) {
      deleteMutation.mutate(slot.id)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 flex-shrink-0">
          <div>
            <h2 className="font-semibold text-slate-900">Gestion des créneaux</h2>
            <p className="text-xs text-slate-500 mt-0.5">Configurez les horaires de la semaine</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Day tabs */}
        <div className="flex border-b border-slate-200 flex-shrink-0">
          {WORKING_DAYS.map((d) => {
            const count = (allSlots ?? []).filter((s) => s.day_of_week.value === d).length
            return (
              <button
                key={d}
                onClick={() => { setSelectedDay(d); setAddingNew(false); setEditingSlot(null) }}
                className={`flex-1 py-2.5 text-xs font-medium transition-colors border-b-2 ${
                  selectedDay === d
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {DAY_LABELS[d]}
                <span className="ml-1 text-slate-400">({count})</span>
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-2">
          {isLoading ? (
            <p className="text-sm text-slate-500 text-center py-8">Chargement…</p>
          ) : slots.length === 0 && !addingNew ? (
            <div className="rounded-lg border-2 border-dashed border-slate-200 p-8 text-center">
              <p className="text-sm text-slate-400">Aucun créneau pour {DAY_LABELS[selectedDay]}.</p>
            </div>
          ) : null}

          {/* Existing slots */}
          {slots.map((slot) => (
            <div key={slot.id}>
              {editingSlot?.id === slot.id ? (
                <SlotForm
                  initial={slot}
                  onSave={handleUpdate}
                  onCancel={() => setEditingSlot(null)}
                  saving={updateMutation.isPending}
                />
              ) : (
                <SlotRow
                  slot={slot}
                  onEdit={() => { setEditingSlot(slot); setAddingNew(false) }}
                  onDelete={() => handleDelete(slot)}
                  onToggle={() => toggleMutation.mutate(slot.id)}
                  toggling={toggleMutation.isPending}
                  deleting={deleteMutation.isPending}
                />
              )}
            </div>
          ))}

          {/* New slot form */}
          {addingNew && (
            <SlotForm
              initial={{ day_of_week: { value: selectedDay, label: DAY_LABELS[selectedDay], short: '' }, order: slots.length + 1 }}
              onSave={handleCreate}
              onCancel={() => setAddingNew(false)}
              saving={createMutation.isPending}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center px-5 py-3 border-t border-slate-200 flex-shrink-0 bg-slate-50">
          <p className="text-xs text-slate-500">
            {(allSlots ?? []).length} créneaux au total
          </p>
          <Button
            size="sm"
            onClick={() => { setAddingNew(true); setEditingSlot(null) }}
            disabled={addingNew}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Ajouter un créneau
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Ligne d'un créneau ─────────────────────────────────────────────────────

function SlotRow({
  slot, onEdit, onDelete, onToggle, toggling, deleting,
}: {
  slot:     TimeSlot
  onEdit:   () => void
  onDelete: () => void
  onToggle: () => void
  toggling: boolean
  deleting: boolean
}) {
  return (
    <div className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors ${
      slot.is_active
        ? slot.is_break
          ? 'border-amber-200 bg-amber-50'
          : 'border-slate-200 bg-white'
        : 'border-slate-100 bg-slate-50 opacity-60'
    }`}>
      <GripVertical className="h-4 w-4 text-slate-300 flex-shrink-0" />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${slot.is_active ? 'text-slate-900' : 'text-slate-400'}`}>
            {slot.name}
          </span>
          {slot.is_break && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">pause</span>
          )}
          {!slot.is_active && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">désactivé</span>
          )}
        </div>
        <div className="text-xs text-slate-400">
          {formatSlotRange(slot)} · {slot.duration_minutes} min · ordre {slot.order}
        </div>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={onToggle}
          disabled={toggling}
          title={slot.is_active ? 'Désactiver' : 'Activer'}
          className={`rounded p-1.5 transition-colors ${
            slot.is_active
              ? 'text-green-600 hover:bg-green-50'
              : 'text-slate-400 hover:bg-slate-100'
          }`}
        >
          <Power className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={onEdit}
          className="rounded p-1.5 text-slate-500 hover:bg-slate-100 transition-colors"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={onDelete}
          disabled={deleting}
          className="rounded p-1.5 text-red-400 hover:bg-red-50 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
