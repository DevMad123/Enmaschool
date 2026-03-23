// ── Literal Types ──────────────────────────────────────────────────────────

export type DayOfWeek = 1 | 2 | 3 | 4 | 5 | 6
export type OverrideType = 'cancellation' | 'substitution' | 'room_change' | 'rescheduled'

// ── Labels & Couleurs ──────────────────────────────────────────────────────

export const DAY_LABELS: Record<DayOfWeek, string> = {
  1: 'Lundi',
  2: 'Mardi',
  3: 'Mercredi',
  4: 'Jeudi',
  5: 'Vendredi',
  6: 'Samedi',
}

export const DAY_SHORT: Record<DayOfWeek, string> = {
  1: 'Lun',
  2: 'Mar',
  3: 'Mer',
  4: 'Jeu',
  5: 'Ven',
  6: 'Sam',
}

export const OVERRIDE_TYPE_LABELS: Record<OverrideType, string> = {
  cancellation: 'Annulation',
  substitution: 'Remplacement',
  room_change:  'Changement de salle',
  rescheduled:  'Reprogrammé',
}

export const OVERRIDE_TYPE_COLORS: Record<OverrideType, string> = {
  cancellation: 'red',
  substitution: 'yellow',
  room_change:  'blue',
  rescheduled:  'purple',
}

// ── Interfaces ─────────────────────────────────────────────────────────────

export interface TimeSlot {
  id:               number
  name:             string
  day_of_week:      { value: DayOfWeek; label: string; short: string }
  start_time:       string // "HH:MM:SS"
  end_time:         string
  duration_minutes: number
  is_break:         boolean
  order:            number
  is_active:        boolean
}

export interface TimetableSubject {
  id:   number
  name: string
  code: string
}

export interface TimetableTeacher {
  id:        number
  full_name: string
}

export interface TimetableRoom {
  id:   number
  name: string
  code: string
}

export interface TimetableClasse {
  id:           number
  display_name: string
}

export interface TimetableOverride {
  id:                  number
  timetable_entry_id:  number
  date:                string // "YYYY-MM-DD"
  type:                { value: OverrideType; label: string; color: string }
  reason:              string | null
  notified_at:         string | null
  substitute_teacher?: TimetableTeacher | null
  new_room?:           TimetableRoom | null
  rescheduled_to_slot?: TimeSlot | null
  created_at:          string
}

export interface TimetableEntry {
  id:               number
  academic_year_id: number
  class_id:         number
  time_slot_id:     number
  subject_id:       number
  teacher_id:       number | null
  room_id:          number | null
  color:            string | null
  notes:            string | null
  is_active:        boolean
  time_slot?:       TimeSlot
  subject?:         TimetableSubject
  teacher?:         TimetableTeacher | null
  room?:            TimetableRoom | null
  classe?:          TimetableClasse
  overrides?:       TimetableOverride[]
  created_at:       string
}

export interface TimetableWeekView {
  entries:    Record<string, TimetableEntry[]> // key = day_of_week as string
  time_slots: Record<string, TimeSlot[]>       // key = day_of_week as string
}

export interface ConflictInfo {
  entry_id: number
  class:    string | null
  subject:  string | null
  message:  string
}

export interface ConflictCheckResult {
  has_conflicts: boolean
  conflicts:     Record<string, ConflictInfo> // "teacher" | "room"
}

// ── Payloads ───────────────────────────────────────────────────────────────

export interface StoreTimetableEntryPayload {
  academic_year_id: number
  class_id:         number
  time_slot_id:     number
  subject_id:       number
  teacher_id?:      number | null
  room_id?:         number | null
  color?:           string | null
  notes?:           string | null
}

export interface UpdateTimetableEntryPayload {
  time_slot_id?: number
  subject_id?:   number
  teacher_id?:   number | null
  room_id?:      number | null
  color?:        string | null
  notes?:        string | null
  is_active?:    boolean
}

export interface BulkStoreTimetablePayload {
  class_id:          number
  academic_year_id:  number
  entries:           Omit<StoreTimetableEntryPayload, 'class_id' | 'academic_year_id'>[]
}

export interface StoreOverridePayload {
  date:                    string
  type:                    OverrideType
  substitute_teacher_id?:  number | null
  new_room_id?:            number | null
  rescheduled_to_slot_id?: number | null
  reason?:                 string | null
}

export interface CheckConflictsPayload {
  academic_year_id: number
  time_slot_id:     number
  teacher_id?:      number | null
  room_id?:         number | null
  exclude_entry_id?: number | null
}

export interface TimetableFilters {
  year_id:     number
  class_id?:   number
  teacher_id?: number
}
