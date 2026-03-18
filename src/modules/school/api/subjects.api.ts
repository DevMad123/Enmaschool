// ===== src/modules/school/api/subjects.api.ts =====

import api from '@/shared/lib/axios'
import type { ApiSuccess, PaginatedResponse } from '@/shared/types/api.types'
import type { Subject, SubjectFormData, SubjectFilters } from '../types/school.types'

export async function getSubjects(params?: SubjectFilters): Promise<PaginatedResponse<Subject>> {
  const { data } = await api.get<PaginatedResponse<Subject>>('/api/school/subjects', { params })
  return data
}

export async function getSubject(id: number): Promise<ApiSuccess<Subject>> {
  const { data } = await api.get<ApiSuccess<Subject>>(`/api/school/subjects/${id}`)
  return data
}

export async function createSubject(payload: SubjectFormData): Promise<ApiSuccess<Subject>> {
  const { data } = await api.post<ApiSuccess<Subject>>('/api/school/subjects', payload)
  return data
}

export async function updateSubject(
  id: number,
  payload: Partial<SubjectFormData>,
): Promise<ApiSuccess<Subject>> {
  const { data } = await api.put<ApiSuccess<Subject>>(`/api/school/subjects/${id}`, payload)
  return data
}

export async function deleteSubject(id: number): Promise<ApiSuccess<null>> {
  const { data } = await api.delete<ApiSuccess<null>>(`/api/school/subjects/${id}`)
  return data
}
