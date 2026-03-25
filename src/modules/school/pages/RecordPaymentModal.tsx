import { useState } from 'react'
import { X, CheckCircle2 } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { PaymentMethodButton } from '../components/PaymentMethodButton'
import { AmountDisplay } from '../components/AmountDisplay'
import { useRecordPayment } from '../hooks/usePayments'
import { requiresReference, formatXOF, getReferencePlaceholder } from '../lib/paymentHelpers'
import type { StudentFee, PaymentMethod } from '../types/payments.types'

const PAYMENT_METHODS: PaymentMethod[] = [
  'cash', 'wave', 'orange_money', 'mtn', 'bank_transfer', 'check',
]

interface Props {
  studentFee: StudentFee
  studentName: string
  onClose: () => void
  onSuccess?: (receiptNumber: string) => void
}

export function RecordPaymentModal({ studentFee, studentName, onClose, onSuccess }: Props) {
  const [amount,     setAmount]    = useState<string>(String(Math.round(studentFee.amount_remaining)))
  const [method,     setMethod]    = useState<PaymentMethod>('cash')
  const [reference,  setReference] = useState('')
  const [date,       setDate]      = useState(new Date().toISOString().split('T')[0])
  const [notes,      setNotes]     = useState('')
  const [confirmed,  setConfirmed] = useState(false)
  const [receipt,    setReceipt]   = useState<string | null>(null)

  const { mutate: record, isPending } = useRecordPayment()

  const amountNum  = parseFloat(amount) || 0
  const remaining  = studentFee.amount_remaining
  const amountErr  = amountNum <= 0 ? 'Montant requis' : amountNum > remaining ? `Max : ${formatXOF(remaining)}` : null
  const needsRef   = requiresReference(method)
  const refErr     = needsRef && !reference.trim() ? 'Référence requise' : null
  const canSubmit  = !amountErr && !refErr && !isPending

  const handleSubmit = () => {
    record(
      {
        student_fee_id: studentFee.id,
        amount: amountNum,
        payment_method: method,
        payment_date: date,
        reference: reference || undefined,
        notes: notes || undefined,
      },
      {
        onSuccess: (payment) => {
          setConfirmed(true)
          setReceipt(payment.receipt_number)
          onSuccess?.(payment.receipt_number)
        },
      },
    )
  }

  if (confirmed && receipt) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl text-center space-y-4">
          <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
          <h3 className="text-lg font-semibold text-gray-900">Paiement enregistré</h3>
          <p className="text-sm text-gray-600">
            Reçu N° <span className="font-mono font-bold text-gray-900">{receipt}</span> en cours de génération.
          </p>
          <Button className="w-full" onClick={onClose}>Fermer</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">Enregistrer un paiement</h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-5 px-6 py-5">
          {/* Info frais */}
          <div className="rounded-lg bg-gray-50 px-4 py-3">
            <p className="text-sm font-medium text-gray-800">{studentFee.fee_type?.name}</p>
            <p className="mt-0.5 text-xs text-gray-500">{studentName}</p>
            <p className="mt-1 text-sm">
              Reste dû : <AmountDisplay amount={remaining} size="sm" color="#dc2626" />
            </p>
          </div>

          {/* Montant */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Montant (FCFA)</label>
            <div className="flex gap-2">
              <input
                type="number"
                min={1}
                step={1000}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Montant"
              />
              <button
                type="button"
                onClick={() => setAmount(String(Math.round(remaining)))}
                className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-100"
              >
                Tout payer
              </button>
            </div>
            {amountErr && <p className="mt-1 text-xs text-red-500">{amountErr}</p>}
          </div>

          {/* Mode de paiement */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Mode de paiement</label>
            <div className="flex flex-wrap gap-2">
              {PAYMENT_METHODS.map((m) => (
                <PaymentMethodButton
                  key={m}
                  method={m}
                  selected={method === m}
                  onClick={() => { setMethod(m); setReference('') }}
                />
              ))}
            </div>
          </div>

          {/* Référence */}
          {needsRef && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Référence de transaction</label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder={getReferencePlaceholder(method)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              {refErr && <p className="mt-1 text-xs text-red-500">{refErr}</p>}
            </div>
          )}

          {/* Date */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Date de paiement</label>
            <input
              type="date"
              value={date}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Notes (optionnel)</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Récapitulatif */}
          {amountNum > 0 && (
            <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-3 text-sm space-y-1">
              <p className="font-medium text-indigo-800">Récapitulatif</p>
              <p className="text-indigo-700">Élève : <span className="font-medium">{studentName}</span></p>
              <p className="text-indigo-700">Frais : {studentFee.fee_type?.name}</p>
              <p className="text-indigo-700">
                Montant : <AmountDisplay amount={amountNum} size="sm" />
                {' '}via {method === 'cash' ? 'Espèces' : method}
              </p>
              {reference && <p className="text-indigo-700">Réf. : {reference}</p>}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-gray-200 px-6 py-4">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={isPending}>
            Annuler
          </Button>
          <Button className="flex-1" onClick={handleSubmit} disabled={!canSubmit}>
            {isPending ? 'Enregistrement…' : 'Valider le paiement'}
          </Button>
        </div>
      </div>
    </div>
  )
}
