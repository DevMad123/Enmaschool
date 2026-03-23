import type { AttendanceStatus, JustificationStatus } from '../types/attendance.types'
import { ATTENDANCE_STATUS_BG, ATTENDANCE_STATUS_COLORS, ATTENDANCE_STATUS_LABELS, ATTENDANCE_STATUS_SHORT } from '../types/attendance.types'

export function getStatusColor(status: AttendanceStatus): string {
  return ATTENDANCE_STATUS_COLORS[status]
}

export function getStatusBg(status: AttendanceStatus): string {
  return ATTENDANCE_STATUS_BG[status]
}

export function getStatusShort(status: AttendanceStatus): string {
  return ATTENDANCE_STATUS_SHORT[status]
}

export function getStatusLabel(status: AttendanceStatus): string {
  return ATTENDANCE_STATUS_LABELS[status]
}

export function getAttendanceRateColor(rate: number, threshold = 80): string {
  if (rate >= threshold) return 'green'
  if (rate >= threshold * 0.9) return 'orange'
  return 'red'
}

export function isAtRiskThreshold(rate: number, threshold = 80): boolean {
  return rate < threshold
}

export function formatAbsenceHours(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)} min`
  return `${hours.toFixed(1)}h`
}

export function getJustificationStatusColor(status: JustificationStatus): string {
  const colors: Record<JustificationStatus, string> = {
    pending:  'orange',
    approved: 'green',
    rejected: 'red',
  }
  return colors[status]
}

/** Raccourcis clavier pour la saisie rapide dans la feuille d'appel */
export const STATUS_KEYBOARD_MAP: Record<string, AttendanceStatus> = {
  p: 'present',
  a: 'absent',
  r: 'late',
  j: 'excused',
}
