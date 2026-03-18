// ===== src/modules/superadmin/api/subscriptions.api.ts =====

import api from '@/shared/lib/axios'
import type { ApiSuccess, PaginatedResponse } from '@/shared/types/api.types'
import type {
  Subscription,
  AssignPlanDTO,
  CancelSubscriptionDTO,
  SubscriptionFilters,
} from '../types/subscription.types'

export async function getSubscriptions(
  params?: SubscriptionFilters,
): Promise<PaginatedResponse<Subscription>> {
  const { data } = await api.get<PaginatedResponse<Subscription>>(
    '/central/subscriptions',
    { params },
  )
  return data
}

export async function getTenantSubscriptions(
  tenantId: string,
  params?: SubscriptionFilters,
): Promise<PaginatedResponse<Subscription>> {
  const { data } = await api.get<PaginatedResponse<Subscription>>(
    `/central/tenants/${tenantId}/subscriptions`,
    { params },
  )
  return data
}

export async function assignPlan(
  tenantId: string,
  payload: AssignPlanDTO,
): Promise<ApiSuccess<Subscription>> {
  const { data } = await api.post<ApiSuccess<Subscription>>(
    `/central/tenants/${tenantId}/subscriptions`,
    payload,
  )
  return data
}

export async function cancelSubscription(
  id: number,
  payload?: CancelSubscriptionDTO,
): Promise<ApiSuccess<null>> {
  const { data } = await api.delete<ApiSuccess<null>>(
    `/central/subscriptions/${id}`,
    { data: payload },
  )
  return data
}
