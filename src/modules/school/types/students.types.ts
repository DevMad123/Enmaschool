// ===== src/modules/school/types/students.types.ts =====

import type { Classe } from './school.types'

// ── Literal Types ──────────────────────────────────────────────────────────

export type StudentStatus = 'active' | 'inactive' | 'transferred' | 'graduated' | 'expelled'
export type Gender = 'male' | 'female'
export type ParentRelationship = 'father' | 'mother' | 'guardian' | 'other'
export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-'
export type EnrollmentStatus =
  | 'enrolled'
  | 'transferred_in'
  | 'transferred_out'
  | 'withdrawn'
  | 'completed'

// ── Constantes UI ──────────────────────────────────────────────────────────

export const GENDER_LABELS: Record<Gender, string> = {
  male: 'Masculin',
  female: 'Féminin',
}

export const STUDENT_STATUS_COLORS: Record<StudentStatus, string> = {
  active: 'green',
  inactive: 'gray',
  transferred: 'blue',
  graduated: 'purple',
  expelled: 'red',
}

export const PARENT_RELATIONSHIP_LABELS: Record<ParentRelationship, string> = {
  father: 'Père',
  mother: 'Mère',
  guardian: 'Tuteur/Tutrice',
  other: 'Autre',
}

export const ENROLLMENT_STATUS_COLORS: Record<EnrollmentStatus, string> = {
  enrolled: 'green',
  transferred_in: 'blue',
  transferred_out: 'orange',
  withdrawn: 'red',
  completed: 'purple',
}

// ── Interfaces ─────────────────────────────────────────────────────────────

export interface Student {
  id: number
  matricule: string
  first_name: string
  last_name: string
  full_name: string
  birth_date: string // "15/05/2010"
  birth_place: string | null
  age: number
  gender: { value: Gender; label: string; short: string }
  nationality: string
  birth_certificate_number: string | null
  photo_url: string | null
  address: string | null
  city: string | null
  blood_type: { value: BloodType; label: string } | null
  first_enrollment_year: number | null
  previous_school: string | null
  notes?: string | null
  status: { value: StudentStatus; label: string; color: string }
  current_enrollment?: CurrentEnrollment | null
  parents?: ParentWithPivot[]
  enrollments?: Enrollment[]
  enrollments_count?: number
  can?: {
    edit: boolean
    delete: boolean
    enroll: boolean
    view_grades: boolean
  }
}

export interface StudentListItem {
  id: number
  matricule: string
  full_name: string
  first_name: string
  last_name: string
  photo_url: string | null
  gender: { value: Gender; short: string; label: string }
  birth_date: string
  age: number
  status: { value: StudentStatus; label: string; color: string }
  current_classe_name?: string | null
  current_enrollment?: CurrentEnrollment | null
}

export interface CurrentEnrollment {
  id: number
  enrollment_number: string
  enrollment_date: string
  status: { value: EnrollmentStatus; label: string }
  classe?: Classe
}

export interface ParentContact {
  id: number
  first_name: string
  last_name: string
  full_name: string
  gender: { value: Gender; label: string }
  relationship: { value: ParentRelationship; label: string; icon: string }
  phone: string | null
  phone_secondary: string | null
  email: string | null
  profession: string | null
  address: string | null
  national_id: string | null
  is_emergency_contact: boolean
  notes: string | null
  students_count?: number
}

export interface ParentWithPivot extends ParentContact {
  pivot: {
    is_primary_contact: boolean
    can_pickup: boolean
  }
}

export interface Enrollment {
  id: number
  enrollment_number: string
  enrollment_date: string
  is_active: boolean
  status: { value: EnrollmentStatus; label: string; color: string }
  transfer_note: string | null
  student?: StudentListItem
  classe?: Classe
  academic_year?: { id: number; name: string }
  transferred_from?: { id: number; display_name: string } | null
  created_at: string
}

// ── Form Data ──────────────────────────────────────────────────────────────

export interface StudentFormData {
  last_name: string
  first_name: string
  birth_date: string
  gender: Gender
  birth_place?: string
  nationality?: string
  birth_certificate_number?: string
  photo?: File | null
  address?: string
  city?: string
  blood_type?: BloodType | null
  first_enrollment_year?: number | null
  previous_school?: string
  notes?: string
  parents?: ParentFormEntry[]
}

export interface ParentFormEntry {
  parent_id?: number
  first_name?: string
  last_name?: string
  phone?: string
  gender?: Gender
  relationship: ParentRelationship
  is_primary_contact: boolean
  can_pickup: boolean
}

export interface EnrollmentFormData {
  student_id: number
  classe_id: number
  academic_year_id: number
  enrollment_date: string
}

export interface BulkEnrollmentFormData {
  classe_id: number
  academic_year_id: number
  student_ids: number[]
  enrollment_date: string
}

export interface TransferFormData {
  new_classe_id: number
  note?: string
}

export interface StudentStats {
  total: number
  male: number
  female: number
  by_category: Record<string, number>
  by_level: Array<{ level: string; count: number }>
  new_this_month: number
}

export interface ImportResult {
  total_rows: number
  created: number
  skipped: number
  errors: Array<{ row: number; field: string; message: string }>
}

// ── Filtres ────────────────────────────────────────────────────────────────

export interface StudentFilters {
  search?: string
  status?: StudentStatus
  gender?: Gender
  classe_id?: number
  academic_year_id?: number
  level_category?: string
  per_page?: number
  page?: number
}
