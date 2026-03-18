// ===== src/modules/school/api/classes.api.ts =====

import api from '@/shared/lib/axios'
import type { ApiSuccess, PaginatedResponse } from '@/shared/types/api.types'
import type {
  Classe,
  ClasseFormData,
  BulkClasseFormData,
  ClasseFilters,
  ClasseOptions,
  Subject,
} from '../types/school.types'

export async function getClasses(params?: ClasseFilters): Promise<PaginatedResponse<Classe>> {
  const { data } = await api.get<PaginatedResponse<Classe>>('/api/school/classes', { params })
  return data
}

export async function getClasse(id: number): Promise<ApiSuccess<Classe>> {
  const { data } = await api.get<ApiSuccess<Classe>>(`/api/school/classes/${id}`)
  return data
}

export async function getClasseOptions(): Promise<ApiSuccess<ClasseOptions>> {
  const { data } = await api.get<ApiSuccess<ClasseOptions>>('/api/school/classes/options')
  return data
}

export async function createClasse(payload: ClasseFormData): Promise<ApiSuccess<Classe>> {
  const { data } = await api.post<ApiSuccess<Classe>>('/api/school/classes', payload)
  return data
}

export async function bulkCreateClasses(payload: BulkClasseFormData): Promise<ApiSuccess<Classe[]>> {
  const { data } = await api.post<ApiSuccess<Classe[]>>('/api/school/classes/bulk', payload)
  return data
}

export async function updateClasse(
  id: number,
  payload: Partial<ClasseFormData>,
): Promise<ApiSuccess<Classe>> {
  const { data } = await api.put<ApiSuccess<Classe>>(`/api/school/classes/${id}`, payload)
  return data
}

export async function deleteClasse(id: number): Promise<ApiSuccess<null>> {
  const { data } = await api.delete<ApiSuccess<null>>(`/api/school/classes/${id}`)
  return data
}

export async function getClasseSubjects(id: number): Promise<ApiSuccess<Subject[]>> {
  const { data } = await api.get<ApiSuccess<Subject[]>>(`/api/school/classes/${id}/subjects`)
  return data
}

export async function syncClasseSubjects(
  id: number,
  subjectIds: number[],
): Promise<ApiSuccess<null>> {
  const { data } = await api.put<ApiSuccess<null>>(`/api/school/classes/${id}/subjects`, {
    subject_ids: subjectIds,
  })
  return data
}
