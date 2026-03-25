import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Plus } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner'
import { BalanceCard } from '../components/BalanceCard'
import { FeeStatusBadge } from '../components/FeeStatusBadge'
import { AmountDisplay } from '../components/AmountDisplay'
import { RecordPaymentModal } from './RecordPaymentModal'
import { useStudentBalance } from '../hooks/usePayments'
import type { StudentFee } from '../types/payments.types'

interface Props {
  enrollmentId: number
}

export function StudentPaymentTab({ enrollmentId }: Props) {
  const { data: balance, isLoading } = useStudentBalance(enrollmentId)
  const [payingFee, setPayingFee]   = useState<StudentFee | null>(null)

  if (!enrollmentId) {
    return <p className="py-8 text-center text-sm text-gray-400">Aucune inscription active.</p>
  }

  if (isLoading) return <LoadingSpinner />

  if (!balance) {
    return <p className="py-8 text-center text-sm text-gray-400">Aucune donnée de paiement.</p>
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <BalanceCard balance={balance} />

        {/* Frais en résumé */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 font-semibold text-gray-900">Frais de l'année</h3>
          <div className="divide-y divide-gray-100">
            {balance.fees.map((fee) => (
              <div key={fee.id} className="flex items-center justify-between py-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-800">{fee.fee_type?.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <FeeStatusBadge status={fee.status.value} />
                    <span className="text-xs text-gray-500">
                      <AmountDisplay amount={fee.amount_remaining} size="sm" color="#dc2626" /> restant
                    </span>
                  </div>
                </div>
                {!fee.status.value.match(/^(paid|waived)$/) && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPayingFee(fee)}
                    className="ml-3 shrink-0"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Link
          to={`/school/payments/student/${enrollmentId}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:underline"
        >
          Voir le dossier complet <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {payingFee && (
        <RecordPaymentModal
          studentFee={payingFee}
          studentName={balance.student.full_name}
          onClose={() => setPayingFee(null)}
        />
      )}
    </div>
  )
}
