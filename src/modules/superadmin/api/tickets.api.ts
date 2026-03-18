// ===== src/modules/superadmin/api/tickets.api.ts =====

import api from '@/shared/lib/axios'
import type { ApiSuccess, PaginatedResponse } from '@/shared/types/api.types'
import type {
  SupportTicket,
  TicketReply,
  CreateTicketDTO,
  UpdateTicketDTO,
  ReplyTicketDTO,
  TicketFilters,
} from '../types/ticket.types'

export async function getTickets(
  params?: TicketFilters,
): Promise<PaginatedResponse<SupportTicket>> {
  const { data } = await api.get<PaginatedResponse<SupportTicket>>(
    '/central/tickets',
    { params },
  )
  return data
}

export async function getTicket(id: number): Promise<ApiSuccess<SupportTicket>> {
  const { data } = await api.get<ApiSuccess<SupportTicket>>(`/central/tickets/${id}`)
  return data
}

export async function createTicket(
  payload: CreateTicketDTO,
): Promise<ApiSuccess<SupportTicket>> {
  const { data } = await api.post<ApiSuccess<SupportTicket>>('/central/tickets', payload)
  return data
}

export async function updateTicket(
  id: number,
  payload: UpdateTicketDTO,
): Promise<ApiSuccess<SupportTicket>> {
  const { data } = await api.put<ApiSuccess<SupportTicket>>(
    `/central/tickets/${id}`,
    payload,
  )
  return data
}

export async function replyToTicket(
  id: number,
  payload: ReplyTicketDTO,
): Promise<ApiSuccess<TicketReply>> {
  const { data } = await api.post<ApiSuccess<TicketReply>>(
    `/central/tickets/${id}/reply`,
    payload,
  )
  return data
}

export async function closeTicket(id: number): Promise<ApiSuccess<SupportTicket>> {
  const { data } = await api.post<ApiSuccess<SupportTicket>>(
    `/central/tickets/${id}/close`,
  )
  return data
}
