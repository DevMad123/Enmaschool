// ===== src/modules/school/api/schoolLevels.api.ts =====

import api from '@/shared/lib/axios'
import type { ApiSuccess } from '@/shared/types/api.types'
import type { SchoolLevel, LevelCategory, Subject } from '../types/school.types'

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

export async function getLevelSubjects(levelId: number): Promise<ApiSuccess<Subject[]>> {
  const { data } = await api.get<ApiSuccess<Subject[]>>(`/api/school/school-levels/${levelId}/subjects`)
  return data
}

export async function syncLevelSubjects(
  levelId: number,
  subjectIds: number[],
): Promise<ApiSuccess<null>> {
  const { data } = await api.post<ApiSuccess<null>>(
    `/api/school/school-levels/${levelId}/subjects/sync`,
    { subject_ids: subjectIds },
  )
  return data
}
