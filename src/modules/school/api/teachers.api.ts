// ===== src/modules/school/api/teachers.api.ts =====

import api from '@/shared/lib/axios'
import type { ApiSuccess, PaginatedResponse } from '@/shared/types/api.types'
import type {
  Teacher,
  TeacherListItem,
  TeacherFormData,
  TeacherWorkload,
  TeacherAssignment,
  TeacherStats,
  AssignmentFormData,
  BulkAssignmentFormData,
  ClassAssignments,
} from '../types/teachers.types'
import type { Subject } from '../types/school.types'

// ── Enseignants ─────────────────────────────────────────────────────────────

export async function getTeachers(
  params?: Record<string, unknown>,
): Promise<PaginatedResponse<TeacherListItem>> {
  const { data } = await api.get<PaginatedResponse<TeacherListItem>>('/api/school/teachers', {
    params,
  })
  return data
}

export async function getTeacher(id: number): Promise<ApiSuccess<Teacher>> {
  const { data } = await api.get<ApiSuccess<Teacher>>(`/api/school/teachers/${id}`)
  return data
}

export async function getTeacherStats(yearId: number): Promise<ApiSuccess<TeacherStats>> {
  const { data } = await api.get<ApiSuccess<TeacherStats>>('/api/school/teachers/stats', {
    params: { year_id: yearId },
  })
  return data
}

export async function createTeacher(payload: TeacherFormData & { user_id: number }): Promise<ApiSuccess<Teacher>> {
  const { data } = await api.post<ApiSuccess<Teacher>>('/api/school/teachers', payload)
  return data
}

export async function updateTeacher(
  id: number,
  payload: TeacherFormData,
): Promise<ApiSuccess<Teacher>> {
  const { data } = await api.put<ApiSuccess<Teacher>>(`/api/school/teachers/${id}`, payload)
  return data
}

export async function toggleTeacher(id: number): Promise<ApiSuccess<Teacher>> {
  const { data } = await api.post<ApiSuccess<Teacher>>(`/api/school/teachers/${id}/toggle`)
  return data
}

export async function getTeacherWorkload(
  id: number,
  yearId: number,
): Promise<ApiSuccess<TeacherWorkload>> {
  const { data } = await api.get<ApiSuccess<TeacherWorkload>>(
    `/api/school/teachers/${id}/workload`,
    { params: { year_id: yearId } },
  )
  return data
}

export async function getTeacherSubjects(id: number): Promise<ApiSuccess<Subject[]>> {
  const { data } = await api.get<ApiSuccess<Subject[]>>(`/api/school/teachers/${id}/subjects`)
  return data
}

export async function syncTeacherSubjects(
  id: number,
  payload: { subject_ids: number[]; primary_subject_id?: number | null },
): Promise<ApiSuccess<Subject[]>> {
  const { data } = await api.put<ApiSuccess<Subject[]>>(
    `/api/school/teachers/${id}/subjects`,
    payload,
  )
  return data
}

export async function getTeacherAssignments(
  id: number,
  yearId: number,
): Promise<ApiSuccess<{ assignments: TeacherAssignment[]; total_hours: number }>> {
  const { data } = await api.get<ApiSuccess<{ assignments: TeacherAssignment[]; total_hours: number }>>(
    `/api/school/teachers/${id}/assignments`,
    { params: { year_id: yearId } },
  )
  return data
}

// ── Affectations ────────────────────────────────────────────────────────────

export async function getAssignments(
  params?: Record<string, unknown>,
): Promise<PaginatedResponse<TeacherAssignment>> {
  const { data } = await api.get<PaginatedResponse<TeacherAssignment>>('/api/school/assignments', {
    params,
  })
  return data
}

export async function assignTeacher(
  payload: AssignmentFormData,
): Promise<ApiSuccess<TeacherAssignment>> {
  const { data } = await api.post<ApiSuccess<TeacherAssignment>>(
    '/api/school/assignments',
    payload,
  )
  return data
}

export async function bulkAssignTeacher(
  payload: BulkAssignmentFormData,
): Promise<ApiSuccess<{ assigned: number; skipped: number; warnings: string[] }>> {
  const { data } = await api.post('/api/school/assignments/bulk', payload)
  return data
}

export async function updateAssignment(
  id: number,
  payload: { hours_per_week?: number | null; notes?: string | null; assigned_at?: string },
): Promise<ApiSuccess<TeacherAssignment>> {
  const { data } = await api.put<ApiSuccess<TeacherAssignment>>(
    `/api/school/assignments/${id}`,
    payload,
  )
  return data
}

export async function deleteAssignment(id: number): Promise<ApiSuccess<null>> {
  const { data } = await api.delete<ApiSuccess<null>>(`/api/school/assignments/${id}`)
  return data
}

export async function unassignTeacher(id: number): Promise<ApiSuccess<TeacherAssignment>> {
  const { data } = await api.post<ApiSuccess<TeacherAssignment>>(
    `/api/school/assignments/${id}/unassign`,
  )
  return data
}

export async function getClasseAssignments(
  classeId: number,
  yearId: number,
): Promise<ApiSuccess<ClassAssignments>> {
  const { data } = await api.get<ApiSuccess<ClassAssignments>>(
    `/api/school/classes/${classeId}/assignments`,
    { params: { year_id: yearId } },
  )
  return data
}

export async function setMainTeacher(
  classeId: number,
  teacherId: number,
): Promise<ApiSuccess<unknown>> {
  const { data } = await api.put<ApiSuccess<unknown>>(
    `/api/school/classes/${classeId}/main-teacher`,
    { teacher_id: teacherId },
  )
  return data
}
