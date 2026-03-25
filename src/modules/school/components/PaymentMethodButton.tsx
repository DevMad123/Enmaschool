import { type PaymentMethod, PAYMENT_METHOD_LABELS, PAYMENT_METHOD_COLORS } from '../types/payments.types'

interface Props {
  method: PaymentMethod
  selected: boolean
  onClick: () => void
}

export function PaymentMethodButton({ method, selected, onClick }: Props) {
  const label = PAYMENT_METHOD_LABELS[method]
  const color = PAYMENT_METHOD_COLORS[method]

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex flex-col items-center gap-1 rounded-lg border-2 px-3 py-2 text-xs font-medium
        transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1
        ${selected
          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'}
      `}
    >
      <span
        className="h-3 w-3 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </button>
  )
}
