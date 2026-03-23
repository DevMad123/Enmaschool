// ===== src/modules/school/lib/teacherHelpers.ts =====

import { CONTRACT_TYPE_LABELS, CONTRACT_TYPE_COLORS } from '../types/teachers.types'
import type { ContractType } from '../types/teachers.types'

export function getContractTypeLabel(type: ContractType): string {
  return CONTRACT_TYPE_LABELS[type] ?? type
}

export function getContractTypeColor(type: ContractType): string {
  return CONTRACT_TYPE_COLORS[type] ?? 'gray'
}

export function formatWeeklyHours(hours: number): string {
  return `${hours}h/sem`
}

export function getWorkloadPercentage(current: number, max: number): number {
  if (max <= 0) return 0
  return Math.round((current / max) * 100)
}

export function getWorkloadColor(percentage: number): string {
  if (percentage >= 100) return 'red'
  if (percentage >= 80) return 'orange'
  return 'green'
}

export function getWorkloadLabel(current: number, max: number): string {
  return `${current}h / ${max}h par semaine`
}

export function getAssignmentCompletionColor(rate: number): string {
  if (rate === 100) return 'green'
  if (rate >= 75) return 'blue'
  if (rate >= 50) return 'orange'
  return 'red'
}

export function formatEmployeeNumber(employeeNumber: string | null): string {
  return employeeNumber ?? '—'
}

export function getTeacherInitials(fullName: string): string {
  return fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
