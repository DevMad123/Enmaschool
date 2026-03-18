// ===== src/shared/lib/toast.ts =====
// Toast abstraction using sonner
// Usage: import { toast } from '@/shared/lib/toast'

import { toast as sonnerToast } from 'sonner'

export const toast = {
  success: (message: string) => sonnerToast.success(message),
  error: (message: string) => sonnerToast.error(message),
  warning: (message: string) => sonnerToast.warning(message),
  info: (message: string) => sonnerToast.info(message),
  loading: (message: string) => sonnerToast.loading(message),
  dismiss: (id?: string | number) => sonnerToast.dismiss(id),
}
