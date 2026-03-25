import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ApiError } from '@/shared/types/api.types'
import { toast } from '@/shared/lib/toast'
import { feeTypesApi, feeSchedulesApi, studentFeesApi, paymentsApi } from '../api/payments.api'
import type { PaymentFormData, InstallmentFormItem } from '../types/payments.types'
import { downloadReceiptBlob } from '../lib/paymentHelpers'

// ── Query Keys ──────────────────────────────────────────────────────────────

export const paymentKeys = {
  feeTypes:       (params?: Record<string, unknown>) => ['fee-types', params] as const,
  feeSchedules:   (yearId: number)                  => ['fee-schedules', yearId] as const,
  studentFees:    (filters?: Record<string, unknown>) => ['student-fees', filters] as const,
  studentBalance: (enrollmentId: number)             => ['student-balance', enrollmentId] as const,
  payments:       (filters?: Record<string, unknown>) => ['payments', filters] as const,
  paymentStats:   (yearId: number)                  => ['payment-stats', yearId] as const,
  classPayment:   (classeId: number, yearId: number) => ['class-payment', classeId, yearId] as const,
  dailyReport:    (date: string)                    => ['daily-report', date] as const,
}

// ── Types de frais ───────────────────────────────────────────────────────────

export function useFeeTypes(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: paymentKeys.feeTypes(params),
    queryFn:  () => feeTypesApi.getAll(params).then((r) => r.data.data),
    staleTime: 10 * 60_000, // 10 minutes
  })
}

export function useCreateFeeType() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => feeTypesApi.create(data).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fee-types'] })
      toast.success('Type de frais créé.')
    },
    onError: (err: ApiError) => toast.error(err.response?.data?.message ?? 'Erreur'),
  })
}

export function useUpdateFeeType() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      feeTypesApi.update(id, data).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fee-types'] })
      toast.success('Type de frais mis à jour.')
    },
    onError: (err: ApiError) => toast.error(err.response?.data?.message ?? 'Erreur'),
  })
}

export function useDeleteFeeType() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => feeTypesApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fee-types'] })
      toast.success('Type de frais supprimé.')
    },
    onError: (err: ApiError) => toast.error(err.response?.data?.message ?? 'Erreur'),
  })
}

// ── Grilles tarifaires ───────────────────────────────────────────────────────

export function useFeeSchedules(yearId: number) {
  return useQuery({
    queryKey: paymentKeys.feeSchedules(yearId),
    queryFn:  () => feeSchedulesApi.getAll(yearId).then((r) => r.data.data),
    enabled:  !!yearId,
    staleTime: 5 * 60_000,
  })
}

export function useBulkSetFeeSchedules() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { academic_year_id: number; schedules: unknown[] }) =>
      feeSchedulesApi.bulkSet(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fee-schedules'] })
      toast.success('Grille tarifaire enregistrée.')
    },
    onError: (err: ApiError) => toast.error(err.response?.data?.message ?? 'Erreur'),
  })
}

export function useCopyFeeSchedules() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ fromYearId, toYearId }: { fromYearId: number; toYearId: number }) =>
      feeSchedulesApi.copyFromYear(fromYearId, toYearId),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['fee-schedules'] })
      const count = (res.data as { data: { copied: number } }).data?.copied ?? 0
      toast.success(`${count} tarif(s) copié(s).`)
    },
    onError: (err: ApiError) => toast.error(err.response?.data?.message ?? 'Erreur'),
  })
}

// ── Frais élèves ─────────────────────────────────────────────────────────────

export function useStudentFees(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: paymentKeys.studentFees(filters),
    queryFn:  () => studentFeesApi.getAll(filters).then((r) => r.data),
    staleTime: 60_000,
  })
}

export function useStudentBalance(enrollmentId: number) {
  return useQuery({
    queryKey: paymentKeys.studentBalance(enrollmentId),
    queryFn:  () => studentFeesApi.getBalance(enrollmentId).then((r) => r.data.data),
    enabled:  !!enrollmentId,
    staleTime: 30_000,
  })
}

export function useApplyDiscount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { amount: number; reason: string } }) =>
      studentFeesApi.applyDiscount(id, data).then((r) => r.data.data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['student-balance'] })
      qc.invalidateQueries({ queryKey: ['student-fees'] })
      toast.success('Remise appliquée.')
    },
    onError: (err: ApiError) => toast.error(err.response?.data?.message ?? 'Erreur'),
  })
}

export function useWaiveFee() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      studentFeesApi.waive(id, { reason }).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['student-balance'] })
      qc.invalidateQueries({ queryKey: ['student-fees'] })
      toast.success('Frais exonéré.')
    },
    onError: (err: ApiError) => toast.error(err.response?.data?.message ?? 'Erreur'),
  })
}

export function useSetInstallments() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, installments }: { id: number; installments: InstallmentFormItem[] }) =>
      studentFeesApi.setInstallments(id, installments),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['student-balance'] })
      toast.success('Échéancier configuré.')
    },
    onError: (err: ApiError) => toast.error(err.response?.data?.message ?? 'Erreur'),
  })
}

// ── Paiements ────────────────────────────────────────────────────────────────

export function usePayments(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: paymentKeys.payments(filters),
    queryFn:  () => paymentsApi.getAll(filters).then((r) => r.data),
    staleTime: 30_000,
  })
}

export function useRecordPayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: PaymentFormData) =>
      paymentsApi.record(data).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['student-balance'] })
      qc.invalidateQueries({ queryKey: ['payments'] })
      toast.success('Paiement enregistré. Le reçu est en cours de génération.')
    },
    onError: (err: ApiError) => toast.error(err.response?.data?.message ?? 'Erreur'),
  })
}

export function useCancelPayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      paymentsApi.cancel(id, { reason }).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['student-balance'] })
      qc.invalidateQueries({ queryKey: ['payments'] })
      toast.success('Paiement annulé.')
    },
    onError: (err: ApiError) => toast.error(err.response?.data?.message ?? 'Erreur'),
  })
}

export function useDownloadReceipt() {
  return useMutation({
    mutationFn: ({ id, receiptNumber }: { id: number; receiptNumber: string }) =>
      paymentsApi.downloadReceipt(id).then((r) => {
        downloadReceiptBlob(r.data as Blob, receiptNumber)
      }),
    onError: (err: ApiError) => toast.error(err.response?.data?.message ?? 'Erreur lors du téléchargement'),
  })
}

export function usePaymentYearStats(yearId: number) {
  return useQuery({
    queryKey: paymentKeys.paymentStats(yearId),
    queryFn:  () => paymentsApi.getYearStats(yearId).then((r) => r.data.data),
    enabled:  !!yearId,
    staleTime: 5 * 60_000,
  })
}

export function useClassPaymentSummary(classeId: number, yearId: number) {
  return useQuery({
    queryKey: paymentKeys.classPayment(classeId, yearId),
    queryFn:  () => paymentsApi.getClassSummary(classeId, yearId).then((r) => r.data.data),
    enabled:  !!classeId && !!yearId,
    staleTime: 2 * 60_000,
  })
}

export function useDailyReport(date: string) {
  return useQuery({
    queryKey: paymentKeys.dailyReport(date),
    queryFn:  () => paymentsApi.getDailyReport(date).then((r) => r.data.data),
    enabled:  !!date,
    staleTime: 60_000,
  })
}
