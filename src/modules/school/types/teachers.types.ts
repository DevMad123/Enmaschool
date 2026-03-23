// ===== src/modules/school/types/teachers.types.ts =====

import type { Classe, Subject } from './school.types'

// ── Enums / Literal Types ──────────────────────────────────────────

export type ContractType = 'permanent' | 'contract' | 'part_time' | 'interim'

export const CONTRACT_TYPE_LABELS: Record<ContractType, string> = {
  permanent: 'Titulaire',
  contract: 'Contractuel',
  part_time: 'Temps partiel',
  interim: 'Intérimaire',
}

export const CONTRACT_TYPE_COLORS: Record<ContractType, string> = {
  permanent: 'green',
  contract: 'blue',
  part_time: 'orange',
  interim: 'gray',
}

// ── Teacher ────────────────────────────────────────────────────────

export interface Teacher {
  id: number
  user_id: number

  // Depuis user
  full_name: string
  email: string
  phone: string | null
  avatar_url: string | null
  status: { value: string; label: string; color: string }

  // Profil pédagogique
  employee_number: string | null
  speciality: string | null
  diploma: string | null
  hire_date: string | null
  contract_type: { value: ContractType; label: string; color: string } | null
  weekly_hours_max: number
  biography: string | null
  is_active: boolean

  // Calculé
  weekly_hours?: number
  weekly_hours_remaining?: number
  is_overloaded?: boolean

  // Relations
  subjects?: Subject[]
  primary_subject?: Subject | null
  assignments?: TeacherAssignment[]
  assignments_count?: number
  classes_count?: number

  created_at?: string
}

export interface TeacherListItem {
  id: number
  user_id: number
  full_name: string
  email: string
  avatar_url: string | null
  employee_number: string | null
  speciality: string | null
  contract_type: { value: ContractType; label: string; color: string } | null
  is_active: boolean
  subjects?: import('./school.types').Subject[]
  subjects_count?: number
  assignments_count?: number
  weekly_hours?: number
  weekly_hours_max?: number
}

// ── Assignment ─────────────────────────────────────────────────────

export interface TeacherAssignment {
  id: number
  teacher?: Pick<Teacher, 'id' | 'full_name' | 'email' | 'avatar_url'>
  classe?: Classe
  subject?: Subject
  academic_year?: { id: number; name: string }
  hours_per_week: number | null
  effective_hours: number
  is_active: boolean
  assigned_at: string | null
  notes: string | null
  warning?: string | null
  created_at?: string
}

// ── Workload ───────────────────────────────────────────────────────

export interface TeacherWorkload {
  teacher_id: number
  total_hours: number
  max_hours: number
  remaining_hours: number
  is_overloaded: boolean
  overload_hours: number
  assignments: Array<{
    classe: string
    subject: string
    hours: number
    level_category: string | null
  }>
}

// ── ClassAssignments ───────────────────────────────────────────────

export interface ClassAssignments {
  classe: Classe
  total_subjects: number
  assigned_subjects: number
  unassigned_subjects: number
  completion_rate: number
  assignments: Array<{
    subject: Subject
    teacher: Pick<Teacher, 'id' | 'full_name' | 'avatar_url'> | null
    assignment: TeacherAssignment | null
    is_assigned: boolean
  }>
}

// ── Form Data ──────────────────────────────────────────────────────

export interface TeacherFormData {
  employee_number?: string
  speciality?: string
  diploma?: string
  hire_date?: string | null
  contract_type?: ContractType
  weekly_hours_max?: number
  biography?: string
  subject_ids?: number[]
  primary_subject_id?: number | null
}

export interface AssignmentFormData {
  teacher_id: number
  class_id: number
  subject_id: number
  academic_year_id: number
  hours_per_week?: number | null
  assigned_at?: string
  notes?: string
}

export interface BulkAssignmentFormData {
  teacher_id: number
  academic_year_id: number
  assignments: Array<{
    class_id: number
    subject_id: number
    hours_per_week?: number | null
  }>
}

// ── Stats ──────────────────────────────────────────────────────────

export interface TeacherStats {
  total_active: number
  contract_breakdown: Record<string, number>
  without_assignment: number
  overloaded: number
}
