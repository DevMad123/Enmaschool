import api from '@/shared/lib/axios'
import type { ApiSuccess, PaginatedResponse } from '@/shared/types/api.types'
import type {
  FeeType,
  FeeSchedule,
  StudentFee,
  StudentBalance,
  Payment,
  PaymentFormData,
  PaymentYearStats,
  ClassPaymentSummary,
  InstallmentFormItem,
} from '../types/payments.types'

const BASE = '/api/school'

export const feeTypesApi = {
  getAll: (params?: Record<string, unknown>) =>
    api.get<ApiSuccess<FeeType[]>>(`${BASE}/fee-types`, { params }),

  create: (data: Partial<FeeType>) =>
    api.post<ApiSuccess<FeeType>>(`${BASE}/fee-types`, data),

  update: (id: number, data: Partial<FeeType>) =>
    api.put<ApiSuccess<FeeType>>(`${BASE}/fee-types/${id}`, data),

  delete: (id: number) =>
    api.delete(`${BASE}/fee-types/${id}`),
}

export const feeSchedulesApi = {
  getAll: (yearId: number) =>
    api.get<ApiSuccess<FeeSchedule[]>>(`${BASE}/fee-schedules`, { params: { year_id: yearId } }),

  set: (data: Partial<FeeSchedule> & { academic_year_id: number; fee_type_id: number }) =>
    api.post<ApiSuccess<FeeSchedule>>(`${BASE}/fee-schedules`, data),

  bulkSet: (data: { academic_year_id: number; schedules: unknown[] }) =>
    api.post(`${BASE}/fee-schedules/bulk`, data),

  copyFromYear: (fromYearId: number, toYearId: number) =>
    api.post(`${BASE}/fee-schedules/copy`, { from_year_id: fromYearId, to_year_id: toYearId }),
}

export const studentFeesApi = {
  getAll: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<StudentFee>>(`${BASE}/student-fees`, { params }),

  getOne: (id: number) =>
    api.get<ApiSuccess<StudentFee>>(`${BASE}/student-fees/${id}`),

  getBalance: (enrollmentId: number) =>
    api.get<ApiSuccess<StudentBalance>>(`${BASE}/student-fees/balance/${enrollmentId}`),

  applyDiscount: (id: number, data: { amount: number; reason: string }) =>
    api.post<ApiSuccess<StudentFee>>(`${BASE}/student-fees/${id}/discount`, data),

  waive: (id: number, data: { reason: string }) =>
    api.post<ApiSuccess<StudentFee>>(`${BASE}/student-fees/${id}/waive`, data),

  getInstallments: (id: number) =>
    api.get(`${BASE}/student-fees/${id}/installments`),

  setInstallments: (id: number, installments: InstallmentFormItem[]) =>
    api.post(`${BASE}/student-fees/${id}/installments`, { installments }),
}

export const paymentsApi = {
  getAll: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<Payment>>(`${BASE}/payments`, { params }),

  getOne: (id: number) =>
    api.get<ApiSuccess<Payment>>(`${BASE}/payments/${id}`),

  record: (data: PaymentFormData) =>
    api.post<ApiSuccess<Payment>>(`${BASE}/payments`, data),

  cancel: (id: number, data: { reason: string }) =>
    api.post<ApiSuccess<Payment>>(`${BASE}/payments/${id}/cancel`, data),

  downloadReceipt: (id: number) =>
    api.get(`${BASE}/payments/${id}/receipt`, { responseType: 'blob' }),

  getDailyReport: (date: string) =>
    api.get(`${BASE}/payments/report/daily`, { params: { date } }),

  getMonthlyReport: (year: number, month: number) =>
    api.get(`${BASE}/payments/report/monthly`, { params: { year, month } }),

  getYearStats: (yearId: number) =>
    api.get<ApiSuccess<PaymentYearStats>>(`${BASE}/payments/stats`, { params: { year_id: yearId } }),

  getClassSummary: (classeId: number, yearId: number) =>
    api.get<ApiSuccess<ClassPaymentSummary>>(`${BASE}/payments/class/${classeId}`, { params: { year_id: yearId } }),
}
