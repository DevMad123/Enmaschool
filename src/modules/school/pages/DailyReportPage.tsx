import { useState } from 'react'
import { Printer } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner'
import { AmountDisplay } from '../components/AmountDisplay'
import { PaymentReceiptButton } from '../components/PaymentReceiptButton'
import { useDailyReport } from '../hooks/usePayments'

export function DailyReportPage() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  const { data: report, isLoading } = useDailyReport(date)

  const handlePrint = () => window.print()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rapport journalier</h1>
          <p className="mt-1 text-sm text-gray-500">Synthèse des paiements encaissés.</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={date}
            max={new Date().toISOString().split('T')[0]}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimer
          </Button>
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : !report ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center text-gray-400">
          Aucune donnée pour cette date.
        </div>
      ) : (
        <>
          {/* Résumé */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Total encaissé</p>
              <AmountDisplay amount={(report as any).total_amount} size="lg" color="#2563eb" className="mt-1 block" />
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Nombre de paiements</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{(report as any).payments_count}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="mb-2 text-sm text-gray-500">Par mode de paiement</p>
              <div className="space-y-1">
                {((report as any).by_method as Array<{ method_label: string; amount: number; count: number }>).map((m, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-gray-600">{m.method_label} ({m.count})</span>
                    <AmountDisplay amount={m.amount} size="sm" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Liste des paiements */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="font-semibold text-gray-900">Paiements du {(report as any).date}</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['Reçu N°', 'Élève', 'Type de frais', 'Mode', 'Montant', 'Reçu'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {((report as any).payments as any[]).map((p: any) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs">{p.receipt_number}</td>
                      <td className="px-4 py-3">{p.enrollment?.student?.full_name ?? '—'}</td>
                      <td className="px-4 py-3">{p.student_fee?.fee_type?.name ?? '—'}</td>
                      <td className="px-4 py-3">{p.payment_method.label}</td>
                      <td className="px-4 py-3"><AmountDisplay amount={p.amount} size="sm" /></td>
                      <td className="px-4 py-3"><PaymentReceiptButton payment={p} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
