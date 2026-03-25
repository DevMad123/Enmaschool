// ===== src/modules/school/api/dashboard.api.ts =====

import api from '@/shared/lib/axios';
import type { ApiSuccess } from '@/shared/types/api.types';
import type {
  AcademicDashboard,
  AttendanceDashboard,
  DirectionDashboard,
  FinancialDashboard,
  TeacherDashboard,
} from '../types/dashboard.types';

export const dashboardApi = {
  getDirection: (yearId: number) =>
    api.get<ApiSuccess<DirectionDashboard>>('/school/dashboard/direction', {
      params: { year_id: yearId },
    }),

  getAcademic: (yearId: number, periodId?: number) =>
    api.get<ApiSuccess<AcademicDashboard>>('/school/dashboard/academic', {
      params: { year_id: yearId, period_id: periodId },
    }),

  getAttendance: (yearId: number, periodId?: number, date?: string) =>
    api.get<ApiSuccess<AttendanceDashboard>>('/school/dashboard/attendance', {
      params: { year_id: yearId, period_id: periodId, date },
    }),

  getFinancial: (yearId: number) =>
    api.get<ApiSuccess<FinancialDashboard>>('/school/dashboard/financial', {
      params: { year_id: yearId },
    }),

  getTeacher: (yearId: number) =>
    api.get<ApiSuccess<TeacherDashboard>>('/school/dashboard/teacher', {
      params: { year_id: yearId },
    }),

  invalidateCache: () => api.post('/school/dashboard/cache/invalidate'),
};

export const reportsApi = {
  exportStudents: (params: Record<string, unknown>) =>
    api.get('/school/reports/students/export', { params, responseType: 'blob' }),

  exportResults: (params: Record<string, unknown>) =>
    api.get('/school/reports/results/export', { params, responseType: 'blob' }),

  exportAttendance: (params: Record<string, unknown>) =>
    api.get('/school/reports/attendance/export', { params, responseType: 'blob' }),

  exportPayments: (params: Record<string, unknown>) =>
    api.get('/school/reports/payments/export', { params, responseType: 'blob' }),

  generateClassResults: (classId: number, periodId: number) =>
    api.post(
      '/school/reports/class-results',
      { class_id: classId, period_id: periodId },
      { responseType: 'blob' },
    ),

  generateYearSummary: (yearId: number) =>
    api.post<ApiSuccess<{ message: string }>>('/school/reports/year-summary', {
      year_id: yearId,
    }),
};
