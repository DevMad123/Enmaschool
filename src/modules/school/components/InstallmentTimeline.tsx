import { Check, Clock, AlertCircle } from 'lucide-react'
import { type PaymentInstallment } from '../types/payments.types'
import { AmountDisplay } from './AmountDisplay'

interface Props {
  installments: PaymentInstallment[]
}

const STATUS_ICON = {
  paid:    <Check className="h-4 w-4 text-green-600" />,
  pending: <Clock className="h-4 w-4 text-gray-400" />,
  overdue: <AlertCircle className="h-4 w-4 text-red-500" />,
}

const STATUS_LINE_COLOR = {
  paid:    'bg-green-500',
  pending: 'bg-gray-300',
  overdue: 'bg-red-400',
}

export function InstallmentTimeline({ installments }: Props) {
  if (!installments.length) return null

  return (
    <div className="space-y-0">
      {installments.map((inst, idx) => {
        const status     = inst.status.value
        const lineColor  = STATUS_LINE_COLOR[status]
        const isLast     = idx === installments.length - 1

        return (
          <div key={inst.id} className="flex gap-3">
            {/* Ligne verticale + icône */}
            <div className="flex flex-col items-center">
              <div className={`flex h-7 w-7 items-center justify-center rounded-full border-2 ${
                status === 'paid'
                  ? 'border-green-500 bg-green-50'
                  : status === 'overdue'
                  ? 'border-red-400 bg-red-50'
                  : 'border-gray-300 bg-white'
              }`}>
                {STATUS_ICON[status]}
              </div>
              {!isLast && <div className={`w-0.5 flex-1 ${lineColor}`} style={{ minHeight: '24px' }} />}
            </div>

            {/* Contenu */}
            <div className={`pb-4 ${isLast ? '' : ''}`}>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-800">
                  Tranche {inst.installment_number}
                </span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  status === 'paid'
                    ? 'bg-green-100 text-green-700'
                    : status === 'overdue'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {inst.status.label}
                </span>
              </div>
              <div className="mt-0.5 text-sm text-gray-500">
                Échéance : {inst.due_date}
                {inst.paid_at && <> · Payé le {inst.paid_at}</>}
              </div>
              <AmountDisplay amount={inst.amount_due} size="sm" className="mt-0.5" />
            </div>
          </div>
        )
      })}
    </div>
  )
}
