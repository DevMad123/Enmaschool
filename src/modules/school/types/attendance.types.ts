import type { StudentListItem } from './students.types'
import type { TimetableEntry } from './timetable.types'

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused'
export type JustificationStatus = 'pending' | 'approved' | 'rejected'

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: 'Présent',
  absent:  'Absent',
  late:    'En retard',
  excused: 'Absent justifié',
}

export const ATTENDANCE_STATUS_SHORT: Record<AttendanceStatus, string> = {
  present: 'P',
  absent:  'A',
  late:    'R',
  excused: 'AJ',
}

export const ATTENDANCE_STATUS_COLORS: Record<AttendanceStatus, string> = {
  present: 'green',
  absent:  'red',
  late:    'orange',
  excused: 'blue',
}

export const ATTENDANCE_STATUS_BG: Record<AttendanceStatus, string> = {
  present: '#dcfce7',
  absent:  '#fee2e2',
  late:    '#ffedd5',
  excused: '#dbeafe',
}

export interface Attendance {
  id:           number
  date:         string
  status: {
    value: AttendanceStatus
    label: string
    short: string
    color: string
  }
  minutes_late: number | null
  note:         string | null
  is_absent:    boolean
  is_present:   boolean
  recorded_at:  string | null
  recorded_by?: { id: number; full_name: string } | null
  enrollment?:  { id: number; student: StudentListItem }
  timetable_entry?: {
    id:       number
    subject:  { name: string; code: string; color: string }
    time_slot: { time_range: string; day_label: string }
  } | null
  period?: { id: number; name: string } | null
}

export interface AttendanceSheetStudent {
  enrollment_id: number
  student:       StudentListItem
  attendance:    Attendance | null
  status:        AttendanceStatus | null
  status_label:  string | null
  status_color:  string | null
}

export interface AttendanceSummary {
  present:         number
  absent:          number
  late:            number
  excused:         number
  total:           number
  attendance_rate: number
}

export interface AttendanceSheet {
  entry?:      TimetableEntry | null
  date:        string
  is_recorded: boolean
  summary:     AttendanceSummary
  students:    AttendanceSheetStudent[]
}

export interface StudentAttendanceStats {
  enrollment_id:      number
  student?:           StudentListItem
  period?:            { id: number; name: string } | null
  total_courses:      number
  present:            number
  absent:             number
  late:               number
  excused:            number
  total_absent_hours: number
  absent_hours:       number
  excused_hours:      number
  attendance_rate:    number
  is_at_risk:         boolean
}

export interface ClassAttendanceStats {
  classe:  { id: number; display_name: string }
  period?: { id: number; name: string } | null
  date?:   string | null
  summary: {
    total_students:      number
    avg_attendance_rate: number
    students_at_risk:    number
  }
  students: StudentAttendanceStats[]
}

export interface CalendarDay {
  date:            string
  attendance_rate: number | null
  recorded:        boolean
}

export interface AbsenceJustification {
  id:           number
  date_from:    string
  date_to:      string
  days_count:   number
  reason:       string
  document_url: string | null
  status: { value: JustificationStatus; label: string; color: string }
  review_note:  string | null
  reviewed_at:  string | null
  reviewed_by?: { id: number; full_name: string } | null
  submitted_by?: { id: number; full_name: string } | null
  enrollment?: { id: number; student: StudentListItem }
  affected_attendances_count: number
  created_at:   string
}

// Pour la saisie du formulaire d'appel
export interface AttendanceRecord {
  enrollment_id: number
  status:        AttendanceStatus
  minutes_late?: number
  note?:         string
}

export interface RecordAttendanceData {
  entry_id?: number | null
  date:      string
  records:   AttendanceRecord[]
}
