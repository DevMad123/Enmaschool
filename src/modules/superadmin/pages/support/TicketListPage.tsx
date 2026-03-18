// ===== src/modules/superadmin/pages/support/TicketListPage.tsx =====

import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  type ColumnDef,
  type PaginationState,
} from '@tanstack/react-table'
import {
  Search,
  LayoutGrid,
  List,
  MessageSquare,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
} from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Badge } from '@/shared/components/ui/badge'
import { DataTable } from '@/shared/components/tables/DataTable'
import { EmptyState } from '@/shared/components/feedback/EmptyState'
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner'
import { useTickets } from '../../hooks/useTickets'
import type {
  SupportTicket,
  TicketStatus,
  TicketPriority,
  TicketFilters,
} from '../../types/ticket.types'

// ── Config ─────────────────────────────────────────────────────────────
const statusConfig: Record<
  TicketStatus,
  { label: string; color: string; bg: string; icon: typeof AlertCircle }
> = {
  open: { label: 'Ouvert', color: 'text-blue-700', bg: 'bg-blue-100', icon: AlertCircle },
  in_progress: { label: 'En cours', color: 'text-amber-700', bg: 'bg-amber-100', icon: Clock },
  resolved: { label: 'Résolu', color: 'text-green-700', bg: 'bg-green-100', icon: CheckCircle2 },
  closed: { label: 'Fermé', color: 'text-gray-600', bg: 'bg-gray-100', icon: XCircle },
}

const priorityConfig: Record<TicketPriority, { label: string; color: string; bg: string }> = {
  low: { label: 'Basse', color: 'text-gray-600', bg: 'bg-gray-100' },
  medium: { label: 'Moyenne', color: 'text-blue-600', bg: 'bg-blue-100' },
  high: { label: 'Haute', color: 'text-amber-600', bg: 'bg-amber-100' },
  urgent: { label: 'Urgente', color: 'text-red-600', bg: 'bg-red-100' },
}

const kanbanColumns: TicketStatus[] = ['open', 'in_progress', 'resolved', 'closed']

// ── Helpers ────────────────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return "À l'instant"
  if (minutes < 60) return `il y a ${minutes}min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `il y a ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 30) return `il y a ${days}j`
  const months = Math.floor(days / 30)
  return `il y a ${months} mois`
}

// ── Kanban Card ────────────────────────────────────────────────────────
function KanbanCard({ ticket }: { ticket: SupportTicket }) {
  const navigate = useNavigate()
  const p = priorityConfig[ticket.priority]

  return (
    <button
      type="button"
      onClick={() => navigate(`/admin/tickets/${ticket.id}`)}
      className="w-full rounded-lg border border-gray-200 bg-white p-3 text-left shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-gray-900 line-clamp-2">
          {ticket.subject}
        </p>
        <span
          className={`shrink-0 inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${p.bg} ${p.color}`}
        >
          {p.label}
        </span>
      </div>
      {ticket.tenant_name && (
        <p className="mt-1.5 text-xs text-gray-500 truncate">
          {ticket.tenant_name}
        </p>
      )}
      <div className="mt-2 flex items-center justify-between text-[11px] text-gray-400">
        <span>{timeAgo(ticket.created_at)}</span>
        {ticket.replies_count != null && ticket.replies_count > 0 && (
          <span className="flex items-center gap-0.5">
            <MessageSquare className="h-3 w-3" />
            {ticket.replies_count}
          </span>
        )}
      </div>
    </button>
  )
}

// ── Kanban View ────────────────────────────────────────────────────────
function KanbanView({ tickets }: { tickets: SupportTicket[] }) {
  const grouped = useMemo(() => {
    const map: Record<TicketStatus, SupportTicket[]> = {
      open: [],
      in_progress: [],
      resolved: [],
      closed: [],
    }
    for (const t of tickets) {
      map[t.status]?.push(t)
    }
    return map
  }, [tickets])

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
      {kanbanColumns.map((status) => {
        const cfg = statusConfig[status]
        const items = grouped[status]
        return (
          <div key={status} className="flex flex-col">
            <div className="mb-3 flex items-center gap-2 px-1">
              <cfg.icon className={`h-4 w-4 ${cfg.color}`} />
              <span className="text-sm font-semibold text-gray-700">
                {cfg.label}
              </span>
              <Badge
                variant="secondary"
                className="ml-auto text-[10px] px-1.5 py-0"
              >
                {items.length}
              </Badge>
            </div>
            <div className="flex flex-col gap-2 rounded-xl bg-gray-50/60 p-2 min-h-[200px]">
              {items.length === 0 ? (
                <p className="py-8 text-center text-xs text-gray-400">
                  Aucun ticket
                </p>
              ) : (
                items.map((t) => <KanbanCard key={t.id} ticket={t} />)
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────
export function TicketListPage() {
  const navigate = useNavigate()
  const [view, setView] = useState<'table' | 'kanban'>('table')
  const [statusFilter, setStatusFilter] = useState<TicketStatus | ''>('')
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | ''>('')
  const [search, setSearch] = useState('')
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  })

  const filters: TicketFilters = {
    status: statusFilter || undefined,
    priority: priorityFilter || undefined,
    page: pagination.pageIndex + 1,
    per_page: view === 'kanban' ? 100 : pagination.pageSize,
  }

  const { data, isLoading } = useTickets(filters)
  const tickets = data?.data ?? []
  const pageCount = data?.meta?.last_page ?? 1

  // Filter locally by search (subject)
  const filteredTickets = useMemo(() => {
    if (!search) return tickets
    const term = search.toLowerCase()
    return tickets.filter(
      (t) =>
        t.subject.toLowerCase().includes(term) ||
        t.tenant_name?.toLowerCase().includes(term),
    )
  }, [tickets, search])

  // Table columns
  const columns: ColumnDef<SupportTicket, unknown>[] = useMemo(
    () => [
      {
        id: 'tenant',
        header: 'École',
        accessorFn: (row) => row.tenant_name,
        cell: ({ row }) => (
          <span className="text-sm text-gray-700">
            {row.original.tenant_name ?? '—'}
          </span>
        ),
      },
      {
        id: 'subject',
        header: 'Sujet',
        accessorFn: (row) => row.subject,
        cell: ({ row }) => (
          <Link
            to={`/admin/tickets/${row.original.id}`}
            className="text-sm font-medium text-gray-900 hover:text-indigo-600 transition-colors line-clamp-1"
          >
            {row.original.subject}
          </Link>
        ),
      },
      {
        id: 'priority',
        header: 'Priorité',
        accessorFn: (row) => row.priority,
        cell: ({ row }) => {
          const p = priorityConfig[row.original.priority]
          return (
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${p.bg} ${p.color}`}
            >
              {p.label}
            </span>
          )
        },
      },
      {
        id: 'status',
        header: 'Statut',
        accessorFn: (row) => row.status,
        cell: ({ row }) => {
          const s = statusConfig[row.original.status]
          return (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${s.bg} ${s.color}`}
            >
              <s.icon className="h-3 w-3" />
              {s.label}
            </span>
          )
        },
      },
      {
        id: 'assigned',
        header: 'Assigné à',
        cell: ({ row }) => (
          <span className="text-sm text-gray-600">
            {row.original.assigned_to?.name ?? (
              <span className="text-gray-400">—</span>
            )}
          </span>
        ),
      },
      {
        id: 'date',
        header: 'Date',
        accessorFn: (row) => row.created_at,
        cell: ({ row }) => (
          <span className="text-xs text-gray-500">
            {timeAgo(row.original.created_at)}
          </span>
        ),
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => navigate(`/admin/tickets/${row.original.id}`)}
          >
            <ArrowUpRight className="h-4 w-4 text-gray-500" />
          </Button>
        ),
      },
    ],
    [navigate],
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gérez les tickets de support des écoles
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-gray-200 p-0.5">
            <button
              type="button"
              onClick={() => setView('table')}
              className={`inline-flex items-center rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                view === 'table'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <List className="mr-1 h-3.5 w-3.5" />
              Table
            </button>
            <button
              type="button"
              onClick={() => setView('kanban')}
              className={`inline-flex items-center rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                view === 'kanban'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <LayoutGrid className="mr-1 h-3.5 w-3.5" />
              Kanban
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Rechercher un ticket…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as TicketStatus | '')
            setPagination((p) => ({ ...p, pageIndex: 0 }))
          }}
          className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Tous les statuts</option>
          {(Object.keys(statusConfig) as TicketStatus[]).map((s) => (
            <option key={s} value={s}>
              {statusConfig[s].label}
            </option>
          ))}
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => {
            setPriorityFilter(e.target.value as TicketPriority | '')
            setPagination((p) => ({ ...p, pageIndex: 0 }))
          }}
          className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Toutes les priorités</option>
          {(Object.keys(priorityConfig) as TicketPriority[]).map((p) => (
            <option key={p} value={p}>
              {priorityConfig[p].label}
            </option>
          ))}
        </select>
      </div>

      {/* Content */}
      {isLoading ? (
        <LoadingSpinner fullScreen />
      ) : filteredTickets.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="Aucun ticket"
          description="Aucun ticket de support ne correspond à vos filtres."
        />
      ) : view === 'kanban' ? (
        <KanbanView tickets={filteredTickets} />
      ) : (
        <DataTable
          columns={columns}
          data={filteredTickets}
          isLoading={isLoading}
          pagination={pagination}
          onPaginationChange={setPagination}
          pageCount={pageCount}
          manualPagination
        />
      )}
    </div>
  )
}
