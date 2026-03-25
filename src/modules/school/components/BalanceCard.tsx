import { CheckCircle2 } from 'lucide-react'
import { AmountDisplay } from './AmountDisplay'
import type { StudentBalance } from '../types/payments.types'

interface Props {
  balance: StudentBalance
  onPayClick?: (feeId: number) => void
}

export function BalanceCard({ balance, onPayClick }: Props) {
  const { total_due, total_discount, total_paid, total_remaining, payment_percentage, is_fully_paid } = balance

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <h3 className="text-base font-semibold text-gray-900">Solde global</h3>
        {is_fully_paid && (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Soldé
          </span>
        )}
      </div>

      <div className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Total dû</span>
          <AmountDisplay amount={total_due} size="sm" />
        </div>
        {total_discount > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-500">Remises accordées</span>
            <AmountDisplay amount={total_discount} size="sm" color="#16a34a" />
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-gray-500">Déjà payé</span>
          <AmountDisplay amount={total_paid} size="sm" color="#2563eb" />
        </div>
        <div className="my-1 border-t border-gray-100" />
        <div className="flex justify-between">
          <span className="font-medium text-gray-800">Reste à payer</span>
          <AmountDisplay
            amount={total_remaining}
            size="md"
            color={total_remaining > 0 ? '#dc2626' : '#16a34a'}
          />
        </div>
      </div>

      {/* Barre de progression */}
      <div className="mt-4 space-y-1">
        <div className="flex justify-between text-xs text-gray-500">
          <span>Progression</span>
          <span className="font-medium">{payment_percentage.toFixed(0)}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className={`h-2 rounded-full transition-all ${is_fully_paid ? 'bg-green-500' : 'bg-indigo-500'}`}
            style={{ width: `${Math.min(100, payment_percentage)}%` }}
          />
        </div>
      </div>
    </div>
  )
}
