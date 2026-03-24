import api from '@/shared/lib/axios'
import type { ApiSuccess, PaginatedResponse } from '@/shared/types/api.types'
import type {
  ReportCard,
  ReportCardFilters,
  ClassBulletinsStats,
  CouncilFormData,
  AppreciationEntry,
  ReportCardType,
  InitiateClassPayload,
} from '../types/reportCards.types'

export const reportCardsApi = {
  getAll: (params?: ReportCardFilters) =>
    api.get<PaginatedResponse<ReportCard>>('/api/school/report-cards', { params }),

  getOne: (id: number) =>
    api.get<ApiSuccess<{ report_card: ReportCard; period_averages: Record<number, { average: number | null; rank: number | null; class_average: number | null; min_score: number | null; max_score: number | null }>; is_last_period: boolean; fresh_general_average: number | null; fresh_rank: number | null; fresh_class_size: number | null }>>(`/api/school/report-cards/${id}`),

  getClassStats: (classeId: number, periodId?: number) =>
    api.get<ApiSuccess<ClassBulletinsStats>>('/api/school/report-cards/class-stats', {
      params: { class_id: classeId, period_id: periodId },
    }),

  initiate: (data: { enrollment_id: number; period_id?: number; type: ReportCardType }) =>
    api.post<ApiSuccess<ReportCard>>('/api/school/report-cards', data),

  initiateForClass: (data: InitiateClassPayload) =>
    api.post<ApiSuccess<{ created: number; already_exists: number }>>(
      '/api/school/report-cards/class',
      data,
    ),

  preview: (id: number) =>
    api.get<ApiSuccess<{ report_card: ReportCard; bulletin_data: unknown }>>(
      `/api/school/report-cards/${id}/preview`,
    ),

  updateCouncil: (id: number, data: CouncilFormData) =>
    api.put<ApiSuccess<ReportCard>>(`/api/school/report-cards/${id}/council`, data),

  saveAppreciations: (id: number, appreciations: AppreciationEntry[]) =>
    api.put<ApiSuccess<void>>(`/api/school/report-cards/${id}/appreciations`, {
      appreciations,
    }),

  generate: (id: number) =>
    api.post<ApiSuccess<ReportCard>>(`/api/school/report-cards/${id}/generate`),

  generateForClass: (data: InitiateClassPayload) =>
    api.post<ApiSuccess<{ message: string }>>('/api/school/report-cards/generate-class', data),

  download: (id: number) =>
    api.get(`/api/school/report-cards/${id}/download`, { responseType: 'blob' }),

  publish: (id: number) =>
    api.post<ApiSuccess<ReportCard>>(`/api/school/report-cards/${id}/publish`),

  publishForClass: (data: { class_id: number; period_id?: number }) =>
    api.post<ApiSuccess<{ published: number }>>(
      '/api/school/report-cards/publish-class',
      data,
    ),

  delete: (id: number) => api.delete(`/api/school/report-cards/${id}`),
}
