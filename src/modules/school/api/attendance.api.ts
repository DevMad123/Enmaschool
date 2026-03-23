import api from '@/shared/lib/axios'
import type { ApiSuccess, PaginatedResponse } from '@/shared/types/api.types'
import type {
  AttendanceSheet,
  CalendarDay,
  ClassAttendanceStats,
  StudentAttendanceStats,
  Attendance,
  AbsenceJustification,
  RecordAttendanceData,
} from '../types/attendance.types'

const BASE = '/api/school'

export const attendanceApi = {
  getSheet: (params: { entry_id?: number; class_id: number; date: string }) =>
    api.get<ApiSuccess<AttendanceSheet>>(`${BASE}/attendance/sheet`, { params }),

  record: (data: RecordAttendanceData) =>
    api.post<ApiSuccess<{ recorded: number; errors: unknown[]; sheet?: AttendanceSheet }>>(
      `${BASE}/attendance/record`,
      data,
    ),

  getStudentStats: (
    enrollmentId: number,
    params?: { period_id?: number; academic_year_id?: number },
  ) =>
    api.get<ApiSuccess<StudentAttendanceStats>>(
      `${BASE}/attendance/student/${enrollmentId}`,
      { params },
    ),

  getStudentHistory: (enrollmentId: number, params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<Attendance>>(
      `${BASE}/attendance/student/${enrollmentId}/history`,
      { params },
    ),

  getClassStats: (
    classeId: number,
    params?: { period_id?: number; date?: string; academic_year_id?: number },
  ) =>
    api.get<ApiSuccess<ClassAttendanceStats>>(
      `${BASE}/attendance/class/${classeId}`,
      { params },
    ),

  getClassCalendar: (classeId: number, params: { year_id: number; month: string }) =>
    api.get<ApiSuccess<CalendarDay[]>>(
      `${BASE}/attendance/class/${classeId}/calendar`,
      { params },
    ),
}

export const justificationsApi = {
  getAll: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<AbsenceJustification>>(`${BASE}/justifications`, { params }),

  getOne: (id: number) =>
    api.get<ApiSuccess<AbsenceJustification>>(`${BASE}/justifications/${id}`),

  submit: (formData: FormData) =>
    api.post<ApiSuccess<AbsenceJustification>>(`${BASE}/justifications`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  review: (id: number, data: { action: 'approve' | 'reject'; review_note?: string }) =>
    api.post<ApiSuccess<AbsenceJustification>>(`${BASE}/justifications/${id}/review`, data),

  delete: (id: number) => api.delete(`${BASE}/justifications/${id}`),
}
