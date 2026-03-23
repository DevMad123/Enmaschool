// ===== src/modules/school/api/students.api.ts =====

import api from '@/shared/lib/axios'
import type { ApiSuccess, PaginatedResponse } from '@/shared/types/api.types'
import type {
  Student,
  StudentListItem,
  StudentFormData,
  StudentFilters,
  StudentStats,
  ParentContact,
  ParentWithPivot,
  Enrollment,
  EnrollmentFormData,
  BulkEnrollmentFormData,
  TransferFormData,
  ImportResult,
} from '../types/students.types'

// ── Élèves ─────────────────────────────────────────────────────────────────

export async function getStudents(
  params?: StudentFilters,
): Promise<PaginatedResponse<StudentListItem>> {
  const { data } = await api.get<PaginatedResponse<StudentListItem>>('/api/school/students', {
    params,
  })
  return data
}

export async function getStudent(id: number): Promise<ApiSuccess<Student>> {
  const { data } = await api.get<ApiSuccess<Student>>(`/api/school/students/${id}`)
  return data
}

export async function getStudentStats(yearId: number): Promise<ApiSuccess<StudentStats>> {
  const { data } = await api.get<ApiSuccess<StudentStats>>('/api/school/students/stats', {
    params: { year_id: yearId },
  })
  return data
}

export async function createStudent(payload: StudentFormData): Promise<ApiSuccess<Student>> {
  const { data } = await api.post<ApiSuccess<Student>>('/api/school/students', payload)
  return data
}

export async function updateStudent(
  id: number,
  payload: Partial<StudentFormData>,
): Promise<ApiSuccess<Student>> {
  const { data } = await api.put<ApiSuccess<Student>>(`/api/school/students/${id}`, payload)
  return data
}

export async function deleteStudent(id: number): Promise<ApiSuccess<null>> {
  const { data } = await api.delete<ApiSuccess<null>>(`/api/school/students/${id}`)
  return data
}

export async function getStudentParents(
  id: number,
): Promise<ApiSuccess<ParentWithPivot[]>> {
  const { data } = await api.get<ApiSuccess<ParentWithPivot[]>>(
    `/api/school/students/${id}/parents`,
  )
  return data
}

export async function syncStudentParents(
  id: number,
  parents: Array<{ parent_id: number; is_primary_contact: boolean; can_pickup: boolean }>,
): Promise<ApiSuccess<ParentWithPivot[]>> {
  const { data } = await api.put<ApiSuccess<ParentWithPivot[]>>(
    `/api/school/students/${id}/parents`,
    { parents },
  )
  return data
}

export async function importStudents(formData: FormData): Promise<ApiSuccess<ImportResult>> {
  const { data } = await api.post<ApiSuccess<ImportResult>>(
    '/api/school/students/import',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  )
  return data
}

export async function getImportTemplate(): Promise<Blob> {
  const { data } = await api.get('/api/school/students/import/template', {
    responseType: 'blob',
  })
  return data as Blob
}

export async function exportStudents(params?: StudentFilters): Promise<Blob> {
  const { data } = await api.get('/api/school/students/export', {
    params,
    responseType: 'blob',
  })
  return data as Blob
}

// ── Inscriptions ───────────────────────────────────────────────────────────

export async function getEnrollments(
  params?: Record<string, unknown>,
): Promise<PaginatedResponse<Enrollment>> {
  const { data } = await api.get<PaginatedResponse<Enrollment>>('/api/school/enrollments', {
    params,
  })
  return data
}

export async function enrollStudent(payload: EnrollmentFormData): Promise<ApiSuccess<Enrollment>> {
  const { data } = await api.post<ApiSuccess<Enrollment>>('/api/school/enrollments', payload)
  return data
}

export async function bulkEnrollStudents(
  payload: BulkEnrollmentFormData,
): Promise<ApiSuccess<{ enrolled: number; skipped: number; errors: unknown[] }>> {
  const { data } = await api.post('/api/school/enrollments/bulk', payload)
  return data
}

export async function getClasseStudents(
  classeId: number,
  params?: Record<string, unknown>,
): Promise<ApiSuccess<StudentListItem[]>> {
  const { data } = await api.get<ApiSuccess<StudentListItem[]>>(
    `/api/school/classes/${classeId}/students`,
    { params },
  )
  return data
}

export async function transferStudent(
  enrollmentId: number,
  payload: TransferFormData,
): Promise<ApiSuccess<Enrollment>> {
  const { data } = await api.post<ApiSuccess<Enrollment>>(
    `/api/school/enrollments/${enrollmentId}/transfer`,
    payload,
  )
  return data
}

export async function withdrawStudent(
  enrollmentId: number,
  reason: string,
): Promise<ApiSuccess<Enrollment>> {
  const { data } = await api.post<ApiSuccess<Enrollment>>(
    `/api/school/enrollments/${enrollmentId}/withdraw`,
    { reason },
  )
  return data
}

// ── Parents ────────────────────────────────────────────────────────────────

export async function getParents(
  params?: Record<string, unknown>,
): Promise<PaginatedResponse<ParentContact>> {
  const { data } = await api.get<PaginatedResponse<ParentContact>>('/api/school/parents', {
    params,
  })
  return data
}

export async function getParent(id: number): Promise<ApiSuccess<ParentContact>> {
  const { data } = await api.get<ApiSuccess<ParentContact>>(`/api/school/parents/${id}`)
  return data
}

export async function createParent(
  payload: Partial<ParentContact>,
): Promise<ApiSuccess<ParentContact>> {
  const { data } = await api.post<ApiSuccess<ParentContact>>('/api/school/parents', payload)
  return data
}

export async function updateParent(
  id: number,
  payload: Partial<ParentContact>,
): Promise<ApiSuccess<ParentContact>> {
  const { data } = await api.put<ApiSuccess<ParentContact>>(`/api/school/parents/${id}`, payload)
  return data
}

export async function deleteParent(id: number): Promise<ApiSuccess<null>> {
  const { data } = await api.delete<ApiSuccess<null>>(`/api/school/parents/${id}`)
  return data
}
