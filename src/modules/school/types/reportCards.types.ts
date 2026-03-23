// ===== src/modules/school/types/reportCards.types.ts =====

import type { StudentListItem } from './students.types'
import type { Subject } from './school.types'

// ── Literal Types ──────────────────────────────────────────────────────────

export type ReportCardType = 'period' | 'annual'
export type ReportCardStatus = 'draft' | 'generated' | 'published' | 'archived'
export type CouncilDecision =
  | 'pass'
  | 'repeat'
  | 'conditional'
  | 'transfer'
  | 'excluded'
  | 'honor'
export type HonorMention = 'encouragements' | 'compliments' | 'felicitations'

// ── Labels & Couleurs ──────────────────────────────────────────────────────

export const COUNCIL_DECISION_LABELS: Record<CouncilDecision, string> = {
  pass:        'Admis(e) en classe supérieure',
  repeat:      'Redouble',
  conditional: 'Passage conditionnel',
  transfer:    'Orienté(e)',
  excluded:    'Exclu(e)',
  honor:       'Admis(e) avec mention',
}

export const COUNCIL_DECISION_COLORS: Record<CouncilDecision, string> = {
  pass:        'green',
  repeat:      'red',
  conditional: 'orange',
  transfer:    'blue',
  excluded:    'red',
  honor:       'purple',
}

export const HONOR_MENTION_LABELS: Record<HonorMention, string> = {
  encouragements: 'Encouragements',
  compliments:    'Compliments',
  felicitations:  'Félicitations',
}

export const REPORT_CARD_STATUS_LABELS: Record<ReportCardStatus, string> = {
  draft:     'Brouillon',
  generated: 'Généré',
  published: 'Publié',
  archived:  'Archivé',
}

export const REPORT_CARD_STATUS_COLORS: Record<ReportCardStatus, string> = {
  draft:     'gray',
  generated: 'blue',
  published: 'green',
  archived:  'orange',
}

// ── Interfaces ─────────────────────────────────────────────────────────────

export interface ReportCardAppreciation {
  id:           number
  appreciation: string
  subject?:     Subject
  teacher?:     { id: number; full_name: string } | null
  entered_by?:  { id: number; full_name: string }
  created_at:   string
}

export interface ReportCard {
  id:                    number
  type:                  { value: ReportCardType; label: string }
  status:                { value: ReportCardStatus; label: string; color: string }
  general_average:       number | null
  general_rank:          number | null
  class_size:            number | null
  class_average:         number | null
  absences_justified:    number
  absences_unjustified:  number
  general_appreciation:  string | null
  council_decision:      { value: CouncilDecision; label: string; color: string } | null
  honor_mention:         { value: HonorMention; label: string; color: string } | null
  has_pdf:               boolean
  pdf_url:               string | null
  pdf_generated_at:      string | null
  published_at:          string | null
  is_editable:           boolean
  student?:              StudentListItem
  classe?:               { id: number; display_name: string; level_label: string }
  period?:               { id: number; name: string; order: number } | null
  academic_year?:        { id: number; name: string }
  appreciations?:        ReportCardAppreciation[]
  generated_by?:         { id: number; full_name: string } | null
  published_by?:         { id: number; full_name: string } | null
  created_at:            string
  updated_at:            string
}

export interface ClassBulletinsStats {
  classe:          { id: number; display_name: string }
  period:          { id: number; name: string } | null
  total_students:  number
  draft:           number
  generated:       number
  published:       number
  archived:        number
  missing:         number
  completion_rate: number
}

export interface CouncilFormData {
  general_appreciation?:  string
  council_decision?:      CouncilDecision | null
  honor_mention?:         HonorMention | null
  absences_justified?:    number
  absences_unjustified?:  number
}

export interface AppreciationEntry {
  subject_id:   number
  appreciation: string
}

export interface ReportCardFilters {
  student_id?:  number
  class_id?:    number
  period_id?:   number
  year_id?:     number
  type?:        ReportCardType
  status?:      ReportCardStatus
  per_page?:    number
  page?:        number
}

export interface InitiateClassPayload {
  class_id:  number
  period_id?: number
  type:      ReportCardType
}
