import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Plus, RotateCcw } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner'
import { BalanceCard } from '../components/BalanceCard'
import { FeeStatusBadge } from '../components/FeeStatusBadge'
import { AmountDisplay } from '../components/AmountDisplay'
import { PaymentReceiptButton } from '../components/PaymentReceiptButton'
import { InstallmentTimeline } from '../components/InstallmentTimeline'
import { RecordPaymentModal } from './RecordPaymentModal'
import { useStudentBalance, useCancelPayment } from '../hooks/usePayments'
import type { StudentFee, Payment } from '../types/payments.types'

export function StudentPaymentPage() {
  const { enrollmentId } = useParams<{ enrollmentId: string }>()
  const id = Number(enrollmentId)

  const { data: balance, isLoading } = useStudentBalance(id)
  const { mutate: cancelPayment }    = useCancelPayment()

  const [payingFee, setPayingFee]           = useState<StudentFee | null>(null)
  const [cancelTarget, setCancelTarget]     = useState<Payment | null>(null)
  const [cancelReason, setCancelReason]     = useState('')

  if (isLoading) return <LoadingSpinner />
  if (!balance)  return <div className="py-16 text-center text-gray-500">Données introuvables.</div>

  const student = balance.student

  const handleCancel = () => {
    if (!cancelTarget || !cancelReason.trim()) return
    cancelPayment(
      { id: cancelTarget.id, reason: cancelReason },
      { onSuccess: () => { setCancelTarget(null); setCancelReason('') } },
    )
  }

  return (
    <div className="space-y-6">
      <Link
        to="/school/payments"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux paiements
      </Link>

      {/* Header élève */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{student.full_name}</h1>
            <p className="mt-0.5 text-sm text-gray-500">
              Matricule : <span className="font-mono font-medium">{student.matricule}</span>
              {' · '}Année : {balance.academic_year.name}
            </p>
          </div>
          {balance.is_fully_paid ? (
            <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">Soldé ✓</span>
          ) : (
            <span className="rounded-full bg-red-50 px-3 py-1 text-sm font-semibold text-red-600">
              <AmountDisplay amount={balance.total_remaining} size="sm" color="#dc2626" /> restant
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Balance Card */}
        <div className="lg:col-span-1">
          <BalanceCard balance={balance} />
        </div>

        {/* Tableau des frais */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="font-semibold text-gray-900">Détail des frais</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {balance.fees.map((fee) => (
                <div key={fee.id} className="px-6 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-800">{fee.fee_type?.name}</span>
                        <FeeStatusBadge status={fee.status.value} />
                      </div>
                      <div className="mt-1 flex flex-wrap gap-4 text-sm text-gray-500">
                        <span>Dû : <AmountDisplay amount={fee.amount_due} size="sm" /></span>
                        <span>Payé : <AmountDisplay amount={fee.amount_paid} size="sm" color="#2563eb" /></span>
                        <span>Reste : <AmountDisplay amount={fee.amount_remaining} size="sm" color="#dc2626" /></span>
                      </div>
                      {/* Barre de progression */}
                      <div className="mt-2 h-1.5 w-full rounded-full bg-gray-200">
                        <div
                          className="h-1.5 rounded-full bg-indigo-500 transition-all"
                          style={{ width: `${Math.min(100, fee.payment_percentage)}%` }}
                        />
                      </div>
                    </div>
                    {!fee.status.value.match(/^(paid|waived)$/) && (
                      <Button
                        size="sm"
                        onClick={() => setPayingFee(fee)}
                        className="shrink-0"
                      >
                        <Plus className="mr-1 h-3.5 w-3.5" />
                        Payer
                      </Button>
                    )}
                  </div>

                  {/* Échéancier */}
                  {fee.installments && fee.installments.length > 0 && (
                    <div className="mt-4 border-t border-gray-100 pt-4">
                      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-400">Échéancier</p>
                      <InstallmentTimeline installments={fee.installments} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Historique des paiements */}
      {balance.fees.some((f) => (f.payments?.length ?? 0) > 0) && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="font-semibold text-gray-900">Historique des paiements</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Date', 'Reçu N°', 'Type de frais', 'Mode', 'Montant', 'Statut', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {balance.fees.flatMap((f) => (f.payments ?? []).map((p) => (
                  <tr key={p.id} className={p.is_cancelled ? 'bg-red-50 text-gray-400' : ''}>
                    <td className="px-4 py-3">{p.payment_date}</td>
                    <td className="px-4 py-3 font-mono text-xs">{p.receipt_number}</td>
                    <td className="px-4 py-3">{f.fee_type?.name}</td>
                    <td className="px-4 py-3">{p.payment_method.label}</td>
                    <td className="px-4 py-3">
                      <AmountDisplay amount={p.amount} size="sm" color={p.is_cancelled ? '#9ca3af' : undefined} />
                    </td>
                    <td className="px-4 py-3">
                      {p.is_cancelled ? (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-600">Annulé</span>
                      ) : (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">Enregistré</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <PaymentReceiptButton payment={p} />
                        {!p.is_cancelled && (
                          <button
                            onClick={() => setCancelTarget(p)}
                            className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-red-500 hover:bg-red-50"
                          >
                            <RotateCcw className="h-3 w-3" />
                            Annuler
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal paiement */}
      {payingFee && (
        <RecordPaymentModal
          studentFee={payingFee}
          studentName={student.full_name}
          onClose={() => setPayingFee(null)}
        />
      )}

      {/* Dialog annulation */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl space-y-4">
            <h3 className="font-semibold text-gray-900">Annuler le paiement</h3>
            <p className="text-sm text-gray-600">Reçu N° {cancelTarget.receipt_number}</p>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Motif (obligatoire)</label>
              <textarea
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="Raison de l'annulation…"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setCancelTarget(null)}>Annuler</Button>
              <Button variant="destructive" className="flex-1" disabled={!cancelReason.trim()} onClick={handleCancel}>
                Confirmer l'annulation
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
