import api from '@/shared/lib/axios'
import type { ApiSuccess, PaginatedResponse } from '@/shared/types/api.types'
import type {
  Evaluation,
  EvaluationFormData,
  Grade,
  GradesSheet,
  PeriodAverage,
  StudentGradesSummary,
  BulkGradeEntry,
} from '../types/grades.types'

export const evaluationsApi = {
  getAll: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<Evaluation>>('/api/school/evaluations', { params }),

  getOne: (id: number) =>
    api.get<ApiSuccess<Evaluation>>(`/api/school/evaluations/${id}`),

  create: (data: EvaluationFormData) =>
    api.post<ApiSuccess<Evaluation>>('/api/school/evaluations', data),

  update: (id: number, data: Partial<EvaluationFormData>) =>
    api.put<ApiSuccess<Evaluation>>(`/api/school/evaluations/${id}`, data),

  delete: (id: number) =>
    api.delete(`/api/school/evaluations/${id}`),

  lock: (id: number) =>
    api.post<ApiSuccess<Evaluation>>(`/api/school/evaluations/${id}/lock`),

  publish: (id: number) =>
    api.post<ApiSuccess<Evaluation>>(`/api/school/evaluations/${id}/publish`),
}

export const gradesApi = {
  getSheet: (params: { class_id: number; subject_id: number; period_id: number }) =>
    api.get<ApiSuccess<GradesSheet>>('/api/school/grades/sheet', { params }),

  bulkSave: (data: { evaluation_id: number; grades: BulkGradeEntry[] }) =>
    api.post<ApiSuccess<{ saved: number; errors: unknown[] }>>('/api/school/grades/bulk', data),

  saveOne: (gradeId: number, data: Partial<BulkGradeEntry>) =>
    api.put<ApiSuccess<Grade>>(`/api/school/grades/${gradeId}`, data),

  getStudentSummary: (studentId: number, yearId: number) =>
    api.get<ApiSuccess<StudentGradesSummary>>(`/api/school/grades/student/${studentId}`, {
      params: { academic_year_id: yearId },
    }),

  getClassSummary: (classeId: number, params: { period_id: number; academic_year_id: number }) =>
    api.get(`/api/school/grades/class/${classeId}`, { params }),

  getPeriodAverages: (params: Record<string, unknown>) =>
    api.get<PaginatedResponse<PeriodAverage>>('/api/school/period-averages', { params }),

  recalculate: (classeId: number, periodId: number) =>
    api.post('/api/school/grades/recalculate', { class_id: classeId, period_id: periodId }),
}
