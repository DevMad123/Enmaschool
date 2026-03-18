// ===== src/modules/superadmin/hooks/useTickets.ts =====

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ApiError } from '@/shared/types/api.types'
import { toast } from '@/shared/lib/toast'
import type {
  CreateTicketDTO,
  UpdateTicketDTO,
  ReplyTicketDTO,
  TicketFilters,
} from '../types/ticket.types'
import {
  getTickets,
  getTicket,
  createTicket,
  updateTicket,
  replyToTicket,
  closeTicket,
} from '../api/tickets.api'

// ── Query keys ────────────────────────────────────────────────────────
export const ticketKeys = {
  all: ['tickets'] as const,
  lists: () => [...ticketKeys.all, 'list'] as const,
  list: (filters?: TicketFilters) => [...ticketKeys.lists(), filters] as const,
  detail: (id: number) => [...ticketKeys.all, 'detail', id] as const,
}

// ── Queries ───────────────────────────────────────────────────────────

export function useTickets(filters?: TicketFilters) {
  return useQuery({
    queryKey: ticketKeys.list(filters),
    queryFn: () => getTickets(filters),
  })
}

export function useTicket(id: number) {
  return useQuery({
    queryKey: ticketKeys.detail(id),
    queryFn: () => getTicket(id),
    enabled: !!id,
  })
}

// ── Mutations ─────────────────────────────────────────────────────────

export function useCreateTicket() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateTicketDTO) => createTicket(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ticketKeys.lists() })
      toast.success('Ticket créé avec succès')
    },
    onError: (error: ApiError) => {
      toast.error(error.message)
    },
  })
}

export function useUpdateTicket() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTicketDTO }) =>
      updateTicket(id, data),
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: ticketKeys.detail(id) })
      void queryClient.invalidateQueries({ queryKey: ticketKeys.lists() })
      toast.success('Ticket mis à jour')
    },
    onError: (error: ApiError) => {
      toast.error(error.message)
    },
  })
}

export function useReplyToTicket() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ReplyTicketDTO }) =>
      replyToTicket(id, data),
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: ticketKeys.detail(id) })
      toast.success('Réponse envoyée')
    },
    onError: (error: ApiError) => {
      toast.error(error.message)
    },
  })
}

export function useCloseTicket() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => closeTicket(id),
    onSuccess: (_, id) => {
      void queryClient.invalidateQueries({ queryKey: ticketKeys.detail(id) })
      void queryClient.invalidateQueries({ queryKey: ticketKeys.lists() })
      toast.success('Ticket fermé')
    },
    onError: (error: ApiError) => {
      toast.error(error.message)
    },
  })
}
