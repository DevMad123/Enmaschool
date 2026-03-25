import {
  type PaymentMethod,
  type StudentFeeStatus,
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHOD_COLORS,
  FEE_STATUS_COLORS,
  FEE_STATUS_LABELS,
  METHODS_REQUIRING_REFERENCE,
} from '../types/payments.types'

/**
 * Formate un montant en FCFA (Franc CFA ivoirien).
 * Exemple : 150000 → "150 000 FCFA"
 */
export function formatXOF(amount: number): string {
  return (
    new Intl.NumberFormat('fr-CI', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      useGrouping: true,
    }).format(Math.round(amount)) + ' FCFA'
  )
}

export function getStatusColor(status: StudentFeeStatus): string {
  return FEE_STATUS_COLORS[status] ?? 'gray'
}

export function getStatusLabel(status: StudentFeeStatus): string {
  return FEE_STATUS_LABELS[status] ?? status
}

export function getMethodLabel(method: PaymentMethod): string {
  return PAYMENT_METHOD_LABELS[method] ?? method
}

export function getMethodColor(method: PaymentMethod): string {
  return PAYMENT_METHOD_COLORS[method] ?? '#6b7280'
}

export function requiresReference(method: PaymentMethod): boolean {
  return METHODS_REQUIRING_REFERENCE.includes(method)
}

/**
 * Retourne la couleur du taux de collecte.
 * Vert >= 80%, Orange >= 50%, Rouge < 50%.
 */
export function getCollectionRateColor(rate: number): string {
  if (rate >= 80) return 'green'
  if (rate >= 50) return 'orange'
  return 'red'
}

/**
 * Télécharge un blob PDF avec le nom du reçu.
 */
export function downloadReceiptBlob(blob: Blob, receiptNumber: string): void {
  const url = URL.createObjectURL(blob)
  const a   = document.createElement('a')
  a.href     = url
  a.download = `recu-${receiptNumber}.pdf`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Retourne le placeholder de référence selon le mode de paiement.
 */
export function getReferencePlaceholder(method: PaymentMethod): string {
  switch (method) {
    case 'wave':         return 'WAVE-2025-XXXXXX'
    case 'orange_money': return 'OM-2025-XXXXXX'
    case 'mtn':          return 'MTN-2025-XXXXXX'
    case 'bank_transfer': return 'Numéro de virement'
    case 'check':        return 'Numéro de chèque'
    default:             return 'Référence'
  }
}
