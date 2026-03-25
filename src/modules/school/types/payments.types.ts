// ===== src/modules/school/types/payments.types.ts =====

import type { StudentListItem } from './students.types'

// ── Literal Types ──────────────────────────────────────────────────────────

export type PaymentMethod =
  | 'cash'
  | 'wave'
  | 'orange_money'
  | 'mtn'
  | 'bank_transfer'
  | 'check'
  | 'other'

export type StudentFeeStatus = 'pending' | 'partial' | 'paid' | 'overdue' | 'waived'
export type InstallmentStatus = 'pending' | 'paid' | 'overdue'

// ── Constantes UI ──────────────────────────────────────────────────────────

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Espèces',
  wave: 'Wave',
  orange_money: 'Orange Money',
  mtn: 'MTN Money',
  bank_transfer: 'Virement bancaire',
  check: 'Chèque',
  other: 'Autre',
}

export const PAYMENT_METHOD_COLORS: Record<PaymentMethod, string> = {
  cash: '#16a34a',
  wave: '#1d4ed8',
  orange_money: '#ea580c',
  mtn: '#ca8a04',
  bank_transfer: '#6b7280',
  check: '#7c3aed',
  other: '#6b7280',
}

export const METHODS_REQUIRING_REFERENCE: PaymentMethod[] = [
  'wave',
  'orange_money',
  'mtn',
  'bank_transfer',
  'check',
]

export const FEE_STATUS_COLORS: Record<StudentFeeStatus, string> = {
  pending: 'gray',
  partial: 'orange',
  paid: 'green',
  overdue: 'red',
  waived: 'blue',
}

export const FEE_STATUS_LABELS: Record<StudentFeeStatus, string> = {
  pending: 'En attente',
  partial: 'Partiel',
  paid: 'Soldé',
  overdue: 'En retard',
  waived: 'Exonéré',
}

// ── Interfaces ──────────────────────────────────────────────────────────────

export interface FeeType {
  id: number
  name: string
  code: string
  description: string | null
  is_mandatory: boolean
  is_recurring: boolean
  applies_to: { value: string; label: string }
  order: number
  is_active: boolean
  schedules_count?: number
}

export interface FeeSchedule {
  id: number
  amount: number
  amount_formatted: string
  installments_allowed: boolean
  max_installments: number
  due_date: string | null
  notes: string | null
  fee_type?: FeeType
  school_level?: { id: number; label: string; short_label: string; category: string } | null
  academic_year?: { id: number; name: string }
}

export interface PaymentInstallment {
  id: number
  installment_number: number
  amount_due: number
  amount_paid: number
  amount_due_formatted: string
  due_date: string
  status: { value: InstallmentStatus; label: string; color: string }
  paid_at: string | null
  is_overdue: boolean
}

export interface Payment {
  id: number
  receipt_number: string
  amount: number
  amount_formatted: string
  payment_method: { value: PaymentMethod; label: string; icon: string }
  payment_date: string
  reference: string | null
  notes: string | null
  is_cancelled: boolean
  cancelled_at: string | null
  cancel_reason: string | null
  has_receipt: boolean
  pdf_url: string | null
  recorded_by?: { id: number; full_name: string } | null
  student_fee?: StudentFee
  enrollment?: { id: number; student: StudentListItem }
  created_at: string
}

export interface StudentFee {
  id: number
  amount_due: number
  amount_paid: number
  amount_remaining: number
  discount_amount: number
  amount_due_formatted: string
  amount_paid_formatted: string
  amount_remaining_formatted: string
  payment_percentage: number
  discount_reason: string | null
  status: { value: StudentFeeStatus; label: string; color: string }
  due_date: string | null
  is_fully_paid: boolean
  notes: string | null
  fee_type?: FeeType
  payments?: Payment[]
  installments?: PaymentInstallment[]
  enrollment?: { id: number; student: StudentListItem }
}

export interface StudentBalance {
  enrollment_id: number
  student: StudentListItem
  academic_year: { id: number; name: string }
  total_due: number
  total_discount: number
  total_paid: number
  total_remaining: number
  total_due_formatted: string
  total_remaining_formatted: string
  is_fully_paid: boolean
  payment_percentage: number
  fees: StudentFee[]
}

// ── Form Data ──────────────────────────────────────────────────────────────

export interface PaymentFormData {
  student_fee_id: number
  amount: number
  payment_method: PaymentMethod
  payment_date: string
  reference?: string
  notes?: string
}

export interface InstallmentFormItem {
  installment_number: number
  amount_due: number
  due_date: string
}

// ── Stats ──────────────────────────────────────────────────────────────────

export interface PaymentYearStats {
  total_expected: number
  total_collected: number
  total_remaining: number
  collection_rate: number
  total_expected_formatted: string
  total_collected_formatted: string
  by_status: Record<StudentFeeStatus, number>
  by_fee_type: Array<{ fee_type_name: string; expected: number; collected: number; rate: number }>
  by_level: Array<{ level: string; expected: number; collected: number; rate: number }>
}

export interface ClassPaymentSummary {
  classe: { id: number; display_name: string }
  academic_year: { id: number; name: string }
  total_students: number
  fully_paid: number
  partial: number
  pending: number
  overdue: number
  total_expected: number
  total_collected: number
  collection_rate: number
  total_expected_formatted: string
  total_collected_formatted: string
}
