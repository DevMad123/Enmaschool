// ===== src/modules/school/api/academicYears.api.ts =====

import api from '@/shared/lib/axios'
import type { ApiSuccess, PaginatedResponse } from '@/shared/types/api.types'
import type { AcademicYear, AcademicYearFormData, AcademicYearFilters, Period } from '../types/school.types'

export async function getAcademicYears(
  params?: AcademicYearFilters,
): Promise<PaginatedResponse<AcademicYear>> {
  const { data } = await api.get<PaginatedResponse<AcademicYear>>('/api/school/academic-years', { params })
  return data
}

export async function getAcademicYear(id: number): Promise<ApiSuccess<AcademicYear>> {
  const { data } = await api.get<ApiSuccess<AcademicYear>>(`/api/school/academic-years/${id}`)
  return data
}

export async function createAcademicYear(payload: AcademicYearFormData): Promise<ApiSuccess<AcademicYear>> {
  const { data } = await api.post<ApiSuccess<AcademicYear>>('/api/school/academic-years', payload)
  return data
}

export async function updateAcademicYear(
  id: number,
  payload: Partial<AcademicYearFormData>,
): Promise<ApiSuccess<AcademicYear>> {
  const { data } = await api.put<ApiSuccess<AcademicYear>>(`/api/school/academic-years/${id}`, payload)
  return data
}

export async function deleteAcademicYear(id: number): Promise<ApiSuccess<null>> {
  const { data } = await api.delete<ApiSuccess<null>>(`/api/school/academic-years/${id}`)
  return data
}

export async function activateAcademicYear(id: number): Promise<ApiSuccess<AcademicYear>> {
  const { data } = await api.post<ApiSuccess<AcademicYear>>(`/api/school/academic-years/${id}/activate`)
  return data
}

export async function closeAcademicYear(id: number): Promise<ApiSuccess<AcademicYear>> {
  const { data } = await api.post<ApiSuccess<AcademicYear>>(`/api/school/academic-years/${id}/close`)
  return data
}

export async function getAcademicYearPeriods(id: number): Promise<ApiSuccess<Period[]>> {
  const { data } = await api.get<ApiSuccess<Period[]>>(`/api/school/academic-years/${id}/periods`)
  return data
}
