import { FileDown } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { useDownloadReceipt } from '../hooks/usePayments'
import type { Payment } from '../types/payments.types'

interface Props {
  payment: Payment
}

export function PaymentReceiptButton({ payment }: Props) {
  const { mutate: download, isPending } = useDownloadReceipt()

  if (!payment.has_receipt) {
    return (
      <span
        title="Reçu en cours de génération"
        className="inline-flex items-center gap-1 text-xs text-gray-400 cursor-default"
      >
        <FileDown className="h-3.5 w-3.5" />
        En cours…
      </span>
    )
  }

  return (
    <Button
      size="sm"
      variant="ghost"
      disabled={isPending}
      onClick={() => download({ id: payment.id, receiptNumber: payment.receipt_number })}
      className="h-7 gap-1 text-xs"
    >
      <FileDown className="h-3.5 w-3.5" />
      {isPending ? 'Chargement…' : 'Reçu'}
    </Button>
  )
}
