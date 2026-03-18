// ===== src/modules/superadmin/types/ticket.types.ts =====

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'

export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface TicketAssignee {
  id: number
  name: string
}

export interface TicketReply {
  id: number
  author_type: string
  author_id?: number
  author_name: string
  message: string
  created_at: string
}

export interface SupportTicket {
  id: number
  tenant_name: string | null
  submitted_by_name: string | null
  submitted_by_email: string | null
  subject: string
  description: string
  status: TicketStatus
  status_label: string
  status_color: string
  priority: TicketPriority
  priority_label: string
  priority_color: string
  assigned_to: TicketAssignee | null
  replies_count: number | null
  replies?: TicketReply[]
  resolved_at: string | null
  created_at: string
}

export interface CreateTicketDTO {
  subject: string
  description: string
  priority: TicketPriority
}

export interface UpdateTicketDTO {
  status?: TicketStatus
  priority?: TicketPriority
  assigned_to?: number | null
}

export interface ReplyTicketDTO {
  message: string
}

export interface TicketFilters {
  status?: TicketStatus
  priority?: TicketPriority
  page?: number
  per_page?: number
}
