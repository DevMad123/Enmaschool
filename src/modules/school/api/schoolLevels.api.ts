// ===== src/modules/school/api/schoolLevels.api.ts =====

import api from '@/shared/lib/axios'
import type { ApiSuccess } from '@/shared/types/api.types'
import type { SchoolLevel, LevelCategory } from '../types/school.types'

export async function getSchoolLevels(
  params?: { category?: LevelCategory },
): Promise<ApiSuccess<SchoolLevel[]>> {
  const { data } = await api.get<ApiSuccess<SchoolLevel[]>>('/api/school/school-levels', { params })
  return data
}

export async function toggleSchoolLevel(id: number): Promise<ApiSuccess<SchoolLevel>> {
  const { data } = await api.post<ApiSuccess<SchoolLevel>>(`/api/school/school-levels/${id}/toggle`)
  return data
}
