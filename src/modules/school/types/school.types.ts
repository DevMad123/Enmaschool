// ===== src/modules/school/types/school.types.ts =====

// ── Enums / Literal Types ──────────────────────────────────────────

export type LevelCategory = 'maternelle' | 'primaire' | 'college' | 'lycee'
export type AcademicYearStatus = 'draft' | 'active' | 'closed'
export type PeriodType = 'trimestre' | 'semestre'
export type PromotionType = 'automatic' | 'manual' | 'by_average'
export type LyceeSerie = 'A' | 'B' | 'C' | 'D' | 'F1' | 'F2' | 'G1' | 'G2' | 'G3'
export type RoomType = 'classroom' | 'lab' | 'gym' | 'library' | 'amphitheater' | 'other'
export type SubjectCategory = 'litteraire' | 'scientifique' | 'technique' | 'artistique' | 'sportif'
export type SettingGroup = 'general' | 'academic' | 'grading' | 'attendance' | 'fees' | 'notifications'

// ── School Level ───────────────────────────────────────────────────

export interface SchoolLevel {
  id: number
  code: string
  category: { value: LevelCategory; label: string; color: string }
  label: string
  short_label: string
  order: number
  requires_serie: boolean
  is_active: boolean
}

// ── Academic Year ──────────────────────────────────────────────────

export interface AcademicYear {
  id: number
  name: string
  status: { value: AcademicYearStatus; label: string; color: string }
  start_date: string
  end_date: string
  period_type: { value: PeriodType; label: string }
  is_current: boolean
  passing_average: number
  promotion_type: { value: PromotionType; label: string }
  closed_at: string | null
  created_at: string
  periods?: Period[]
}

export interface Period {
  id: number
  academic_year_id: number
  name: string
  type: { value: PeriodType; label: string }
  order: number
  start_date: string
  end_date: string
  is_current: boolean
  is_closed: boolean
}

export interface AcademicYearFormData {
  name: string
  start_date: string
  end_date: string
  period_type: PeriodType
  passing_average?: number
  promotion_type?: PromotionType
}

export interface AcademicYearFilters {
  status?: AcademicYearStatus
  search?: string
  page?: number
  per_page?: number
}

// ── Classe ─────────────────────────────────────────────────────────

export interface Classe {
  id: number
  academic_year_id: number
  display_name: string
  serie: LyceeSerie | null
  section: string
  capacity: number
  is_active: boolean
  level?: SchoolLevel
  main_teacher?: { id: number; full_name: string } | null
  room?: { id: number; name: string; code: string | null } | null
  subjects_count?: number
  students_count?: number
  enrolled_count?: number
  spots_remaining?: number
}

export interface ClasseFormData {
  academic_year_id: number
  school_level_id: number
  serie: LyceeSerie | null
  section: string
  capacity: number
  main_teacher_id?: number | null
  room_id?: number | null
}

export interface BulkClasseFormData {
  academic_year_id: number
  school_level_id: number
  serie: LyceeSerie | null
  sections: string[]
  capacity: number
}

export interface ClasseFilters {
  academic_year_id?: number
  school_level_id?: number
  category?: LevelCategory
  search?: string
  is_active?: boolean
  page?: number
  per_page?: number
}

export interface ClasseOptions {
  sections: string[]
  series: { value: LyceeSerie; label: string }[]
}

// ── Subject ────────────────────────────────────────────────────────

export interface Subject {
  id: number
  name: string
  code: string
  coefficient: number
  color: string
  category: { value: SubjectCategory; label: string; color: string } | null
  is_active: boolean
  created_at: string
  // Pivot fields when loaded from ClassSubject
  coefficient_override?: number | null
  effective_coefficient?: number
  hours_per_week?: number | null
  pivot_is_active?: boolean
}

export interface SubjectFormData {
  name: string
  code: string
  coefficient?: number
  color?: string
  category?: SubjectCategory | null
  is_active?: boolean
}

export interface SubjectFilters {
  search?: string
  category?: SubjectCategory
  is_active?: boolean
  page?: number
  per_page?: number
}

// ── Room ───────────────────────────────────────────────────────────

export interface Room {
  id: number
  name: string
  code: string | null
  type: { value: RoomType; label: string; icon: string }
  capacity: number
  floor: string | null
  building: string | null
  equipment: Record<string, boolean> | null
  is_active: boolean
}

export interface RoomFormData {
  name: string
  code?: string | null
  type: RoomType
  capacity?: number
  floor?: string | null
  building?: string | null
  equipment?: Record<string, boolean> | null
  is_active?: boolean
}

export interface RoomFilters {
  search?: string
  type?: RoomType
  is_active?: boolean
  page?: number
  per_page?: number
}

// ── School Setting ─────────────────────────────────────────────────

export interface SchoolSetting {
  id: number
  key: string
  value: unknown
  type: string
  group: SettingGroup
  label: string
  description: string | null
}
