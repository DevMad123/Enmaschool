// ===== src/modules/superadmin/api/tenants.api.ts =====

import api from '@/shared/lib/axios'
import type { ApiSuccess, PaginatedResponse } from '@/shared/types/api.types'
import type {
  Tenant,
  TenantStats,
  TenantFilters,
  CreateTenantDTO,
  UpdateTenantDTO,
  SuspendTenantDTO,
} from '../types/tenant.types'
import type { TenantModule, EnableModuleDTO, DisableModuleDTO } from '../types/module.types'
import type { ActivityLog, ActivityLogFilters } from '../types/activity.types'

export async function getTenants(
  params?: TenantFilters,
): Promise<PaginatedResponse<Tenant>> {
  const { data } = await api.get<PaginatedResponse<Tenant>>('/central/tenants', { params })
  return data
}

export async function getTenant(id: string): Promise<ApiSuccess<Tenant>> {
  const { data } = await api.get<ApiSuccess<Tenant>>(`/central/tenants/${id}`)
  return data
}

export async function createTenant(
  payload: CreateTenantDTO,
): Promise<ApiSuccess<Tenant>> {
  const { data } = await api.post<ApiSuccess<Tenant>>('/central/tenants', payload)
  return data
}

export async function updateTenant(
  id: string,
  payload: UpdateTenantDTO,
): Promise<ApiSuccess<Tenant>> {
  const { data } = await api.put<ApiSuccess<Tenant>>(`/central/tenants/${id}`, payload)
  return data
}

export async function deleteTenant(id: string): Promise<ApiSuccess<null>> {
  const { data } = await api.delete<ApiSuccess<null>>(`/central/tenants/${id}`)
  return data
}

export async function activateTenant(id: string): Promise<ApiSuccess<Tenant>> {
  const { data } = await api.post<ApiSuccess<Tenant>>(`/central/tenants/${id}/activate`)
  return data
}

export async function suspendTenant(
  id: string,
  payload: SuspendTenantDTO,
): Promise<ApiSuccess<Tenant>> {
  const { data } = await api.post<ApiSuccess<Tenant>>(
    `/central/tenants/${id}/suspend`,
    payload,
  )
  return data
}

export async function getTenantStats(id: string): Promise<ApiSuccess<TenantStats>> {
  const { data } = await api.get<ApiSuccess<TenantStats>>(`/central/tenants/${id}/stats`)
  return data
}

export async function getTenantModules(id: string): Promise<ApiSuccess<TenantModule[]>> {
  const { data } = await api.get<ApiSuccess<TenantModule[]>>(
    `/central/tenants/${id}/modules`,
  )
  return data
}

export async function enableModule(
  tenantId: string,
  payload: EnableModuleDTO,
): Promise<ApiSuccess<TenantModule>> {
  const { data } = await api.post<ApiSuccess<TenantModule>>(
    `/central/tenants/${tenantId}/modules/enable`,
    payload,
  )
  return data
}

export async function disableModule(
  tenantId: string,
  payload: DisableModuleDTO,
): Promise<ApiSuccess<TenantModule>> {
  const { data } = await api.post<ApiSuccess<TenantModule>>(
    `/central/tenants/${tenantId}/modules/disable`,
    payload,
  )
  return data
}

export async function getTenantActivity(
  id: string,
  params?: ActivityLogFilters,
): Promise<PaginatedResponse<ActivityLog>> {
  const { data } = await api.get<PaginatedResponse<ActivityLog>>(
    `/central/tenants/${id}/activity`,
    { params },
  )
  return data
}
