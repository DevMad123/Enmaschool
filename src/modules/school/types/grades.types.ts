import type { Subject } from './school.types'
import type { StudentListItem } from './students.types'

export type EvaluationType =
  'dc' | 'dm' | 'composition' | 'exam' | 'interrogation' | 'tp' | 'other'

export const EVALUATION_TYPE_LABELS: Record<EvaluationType, string> = {
  dc: 'Devoir de Classe',
  dm: 'Devoir Maison',
  composition: 'Composition',
  exam: 'Examen',
  interrogation: 'Interrogation',
  tp: 'Travaux Pratiques',
  other: 'Autre',
}

export const EVALUATION_TYPE_SHORT: Record<EvaluationType, string> = {
  dc: 'DC',
  dm: 'DM',
  composition: 'COMP',
  exam: 'EXAM',
  interrogation: 'INTERRO',
  tp: 'TP',
  other: 'AUTRE',
}

export const EVALUATION_TYPE_COLORS: Record<EvaluationType, string> = {
  dc: 'blue',
  dm: 'purple',
  composition: 'orange',
  exam: 'red',
  interrogation: 'green',
  tp: 'cyan',
  other: 'gray',
}

export interface Evaluation {
  id: number
  title: string
  type: { value: EvaluationType; label: string; short: string; color: string }
  date: string
  max_score: number
  coefficient: number
  is_published: boolean
  is_locked: boolean
  is_editable: boolean
  description: string | null
  grades_count?: number
  average_score?: number | null
  classe?: { id: number; display_name: string }
  subject?: Subject
  period?: { id: number; name: string; type: string }
  teacher?: { id: number; full_name: string }
  created_at: string
}

export interface Grade {
  id: number
  score: number | null
  score_on_20: number | null
  is_absent: boolean
  absence_justified: boolean
  comment: string | null
  is_passing: boolean | null
  entered_at: string | null
  entered_by?: { id: number; full_name: string }
  student?: StudentListItem
  evaluation?: Pick<Evaluation, 'id' | 'title' | 'max_score' | 'coefficient'>
}

export interface GradeSheetRow {
  student: StudentListItem
  enrollment_id: number
  grades: Record<string, {
    score: number | null
    score_on_20: number | null
    is_absent: boolean
    absence_justified: boolean
    comment: string | null
  }>
  period_average: number | null
  absences_count: number
}

export interface GradesSheet {
  classe: { id: number; display_name: string }
  subject: Subject
  period: { id: number; name: string; order: number }
  evaluations: Evaluation[]
  students: GradeSheetRow[]
  class_stats: {
    average: number | null
    min: number | null
    max: number | null
    passing_count: number
    total_count: number
    passing_rate: number
  }
}

export interface PeriodAverage {
  id: number
  average: number | null
  weighted_average: number | null
  coefficient: number
  evaluations_count: number
  absences_count: number
  rank: number | null
  class_average: number | null
  min_score: number | null
  max_score: number | null
  is_passing: boolean | null
  is_final: boolean
  calculated_at: string
  subject?: Subject
  period?: { id: number; name: string }
  student?: StudentListItem
}

export interface StudentGradesSummary {
  student: StudentListItem
  enrollment_id: number
  period_averages: Array<{
    period: { id: number; name: string; order: number }
    averages: Array<{
      subject: Subject
      average: number | null
      rank: number | null
      is_passing: boolean | null
    }>
    general_average: number | null
    general_rank: number | null
  }>
  annual_averages: Array<{
    subject: Subject
    annual_average: number | null
    is_passing: boolean | null
  }>
  general_annual_average: number | null
}

export interface BulkGradeEntry {
  student_id: number
  score: number | null
  is_absent: boolean
  absence_justified: boolean
  comment?: string
}

export interface EvaluationFormData {
  class_id: number
  subject_id: number
  period_id: number
  academic_year_id: number
  title: string
  type: EvaluationType
  date: string
  max_score: number
  coefficient: number
  description?: string
}
