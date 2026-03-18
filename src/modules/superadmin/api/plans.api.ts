// ===== src/modules/superadmin/api/plans.api.ts =====

import api from '@/shared/lib/axios'
import type { ApiSuccess } from '@/shared/types/api.types'
import type { Plan, CreatePlanDTO, UpdatePlanDTO } from '../types/plan.types'

export async function getPlans(): Promise<ApiSuccess<Plan[]>> {
  const { data } = await api.get<ApiSuccess<Plan[]>>('/central/plans')
  return data
}

export async function getPlan(id: number): Promise<ApiSuccess<Plan>> {
  const { data } = await api.get<ApiSuccess<Plan>>(`/central/plans/${id}`)
  return data
}

export async function createPlan(payload: CreatePlanDTO): Promise<ApiSuccess<Plan>> {
  const { data } = await api.post<ApiSuccess<Plan>>('/central/plans', payload)
  return data
}

export async function updatePlan(
  id: number,
  payload: UpdatePlanDTO,
): Promise<ApiSuccess<Plan>> {
  const { data } = await api.put<ApiSuccess<Plan>>(`/central/plans/${id}`, payload)
  return data
}

export async function deletePlan(id: number): Promise<ApiSuccess<null>> {
  const { data } = await api.delete<ApiSuccess<null>>(`/central/plans/${id}`)
  return data
}
