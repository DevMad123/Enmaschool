import {
  COUNCIL_DECISION_LABELS,
  COUNCIL_DECISION_COLORS,
  REPORT_CARD_STATUS_LABELS,
  REPORT_CARD_STATUS_COLORS,
} from '../types/reportCards.types'
import type { ReportCardStatus, CouncilDecision, ReportCard } from '../types/reportCards.types'

export function getStatusColor(status: ReportCardStatus): string {
  return REPORT_CARD_STATUS_COLORS[status] ?? 'gray'
}

export function getStatusLabel(status: ReportCardStatus): string {
  return REPORT_CARD_STATUS_LABELS[status] ?? status
}

export function getDecisionColor(decision: CouncilDecision): string {
  return COUNCIL_DECISION_COLORS[decision] ?? 'gray'
}

export function getDecisionLabel(decision: CouncilDecision): string {
  return COUNCIL_DECISION_LABELS[decision] ?? decision
}

export function isDecisionPositive(decision: CouncilDecision): boolean {
  return ['pass', 'conditional', 'honor'].includes(decision)
}

export function formatBulletinTitle(rc: ReportCard): string {
  const period = rc.period ? rc.period.name : 'Annuel'
  return `Bulletin ${period} ${rc.academic_year?.name ?? ''}`
}

export function downloadBlobAsPdf(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a   = document.createElement('a')
  a.href     = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
