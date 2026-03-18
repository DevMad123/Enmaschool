// ===== src/modules/superadmin/pages/support/TicketDetailPage.tsx =====

import { useState, useRef, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  User,
  Building2,
  Clock,
  Send,
  LoaderCircle,
  UserCheck,
} from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { ConfirmDialog } from '@/shared/components/feedback/ConfirmDialog'
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner'
import { useTicket, useUpdateTicket, useReplyToTicket, useCloseTicket } from '../../hooks/useTickets'
import { useAuthStore } from '@/modules/auth/store/authStore'
import type { TicketStatus, TicketPriority, TicketReply } from '../../types/ticket.types'

// ── Config ─────────────────────────────────────────────────────────────
const statusConfig: Record<
  TicketStatus,
  { label: string; color: string; bg: string }
> = {
  open: { label: 'Ouvert', color: 'text-blue-700', bg: 'bg-blue-100' },
  in_progress: { label: 'En cours', color: 'text-amber-700', bg: 'bg-amber-100' },
  resolved: { label: 'Résolu', color: 'text-green-700', bg: 'bg-green-100' },
  closed: { label: 'Fermé', color: 'text-gray-600', bg: 'bg-gray-100' },
}

const priorityConfig: Record<TicketPriority, { label: string; color: string; bg: string }> = {
  low: { label: 'Basse', color: 'text-gray-600', bg: 'bg-gray-100' },
  medium: { label: 'Moyenne', color: 'text-blue-600', bg: 'bg-blue-100' },
  high: { label: 'Haute', color: 'text-amber-600', bg: 'bg-amber-100' },
  urgent: { label: 'Urgente', color: 'text-red-600', bg: 'bg-red-100' },
}

const nextStatuses: Record<TicketStatus, { value: TicketStatus; label: string }[]> = {
  open: [
    { value: 'in_progress', label: 'Passer en cours' },
    { value: 'resolved', label: 'Marquer résolu' },
  ],
  in_progress: [
    { value: 'resolved', label: 'Marquer résolu' },
    { value: 'open', label: 'Rouvrir' },
  ],
  resolved: [
    { value: 'closed', label: 'Fermer' },
    { value: 'open', label: 'Rouvrir' },
  ],
  closed: [{ value: 'open', label: 'Rouvrir' }],
}

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

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// ── Message Bubble ─────────────────────────────────────────────────────
function MessageBubble({
  reply,
  isSuperAdmin,
}: {
  reply: TicketReply
  isSuperAdmin: boolean
}) {
  return (
    <div
      className={`flex ${isSuperAdmin ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-[75%] space-y-1.5 ${
          isSuperAdmin ? 'items-end' : 'items-start'
        }`}
      >
        {/* Author & time */}
        <div
          className={`flex items-center gap-2 text-xs ${
            isSuperAdmin ? 'flex-row-reverse' : ''
          }`}
        >
          <div
            className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${
              isSuperAdmin
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-gray-200 text-gray-600'
            }`}
          >
            {getInitials(reply.author_name)}
          </div>
          <span className="font-medium text-gray-700">
            {reply.author_name}
          </span>
          <span className="text-gray-400" title={formatDateTime(reply.created_at)}>
            {timeAgo(reply.created_at)}
          </span>
        </div>

        {/* Message body */}
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isSuperAdmin
              ? 'rounded-tr-md bg-indigo-600 text-white'
              : 'rounded-tl-md bg-gray-100 text-gray-800'
          }`}
        >
          {reply.message.split('\n').map((line, i) => (
            <p key={i} className={i > 0 ? 'mt-1' : ''}>
              {line}
            </p>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Reply Form ─────────────────────────────────────────────────────────
function ReplyForm({
  ticketId,
  ticketStatus,
}: {
  ticketId: number
  ticketStatus: TicketStatus
}) {
  const [body, setBody] = useState('')
  const replyMutation = useReplyToTicket()
  const closeMutation = useCloseTicket()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const isClosed = ticketStatus === 'closed'

  const handleReply = () => {
    if (!body.trim()) return
    replyMutation.mutate(
      { id: ticketId, data: { message: body.trim() } },
      { onSuccess: () => setBody('') },
    )
  }

  const handleReplyAndClose = () => {
    if (!body.trim()) return
    replyMutation.mutate(
      { id: ticketId, data: { message: body.trim() } },
      {
        onSuccess: () => {
          setBody('')
          closeMutation.mutate(ticketId)
        },
      },
    )
  }

  if (isClosed) {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-center text-sm text-gray-500">
        Ce ticket est fermé. Rouvrez-le pour répondre.
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <textarea
        ref={textareaRef}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Rédigez votre réponse…"
        rows={4}
        className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      />
      <div className="mt-3 flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleReplyAndClose}
          disabled={!body.trim() || replyMutation.isPending || closeMutation.isPending}
        >
          {(replyMutation.isPending || closeMutation.isPending) && (
            <LoaderCircle className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          )}
          Répondre et fermer
        </Button>
        <Button
          size="sm"
          onClick={handleReply}
          disabled={!body.trim() || replyMutation.isPending}
        >
          {replyMutation.isPending && (
            <LoaderCircle className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          )}
          <Send className="mr-1.5 h-3.5 w-3.5" />
          Répondre
        </Button>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────
export function TicketDetailPage() {
  const { id } = useParams<{ id: string }>()
  const ticketId = Number(id)
  const { data, isLoading } = useTicket(ticketId)
  const updateMutation = useUpdateTicket()
  const closeMutation = useCloseTicket()
  const user = useAuthStore((s) => s.user)

  const [confirmClose, setConfirmClose] = useState(false)

  const ticket = data?.data

  // Scroll to bottom of thread on load
  const threadRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight
    }
  }, [ticket?.replies])

  if (isLoading) {
    return <LoadingSpinner fullScreen />
  }

  if (!ticket) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Ticket introuvable</p>
        <Link
          to="/admin/tickets"
          className="mt-4 inline-flex items-center text-sm text-indigo-600 hover:text-indigo-700"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Retour aux tickets
        </Link>
      </div>
    )
  }

  const sc = statusConfig[ticket.status]
  const pc = priorityConfig[ticket.priority]
  const replies: TicketReply[] = ticket.replies ?? []
  const transitions = nextStatuses[ticket.status]

  const handleAssignToMe = () => {
    if (!user) return
    updateMutation.mutate({
      id: ticketId,
      data: { assigned_to: user.id },
    })
  }

  const handleStatusChange = (newStatus: TicketStatus) => {
    if (newStatus === 'closed') {
      setConfirmClose(true)
    } else {
      updateMutation.mutate({
        id: ticketId,
        data: { status: newStatus },
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        to="/admin/tickets"
        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Retour aux tickets
      </Link>

      {/* Header card */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-gray-900">
              {ticket.subject}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${sc.bg} ${sc.color}`}
              >
                {sc.label}
              </span>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${pc.bg} ${pc.color}`}
              >
                {pc.label}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {!ticket.assigned_to && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleAssignToMe}
                disabled={updateMutation.isPending}
              >
                <UserCheck className="mr-1.5 h-3.5 w-3.5" />
                M&apos;assigner
              </Button>
            )}
            {transitions.map((t) => (
              <Button
                key={t.value}
                variant={t.value === 'closed' ? 'destructive' : 'outline'}
                size="sm"
                onClick={() => handleStatusChange(t.value)}
                disabled={updateMutation.isPending}
              >
                {t.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Meta */}
        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-500">
          {ticket.tenant_name && (
            <span className="flex items-center gap-1.5">
              <Building2 className="h-4 w-4 text-gray-400" />
              {ticket.tenant_name}
            </span>
          )}
          {ticket.submitted_by_name && (
            <span className="flex items-center gap-1.5">
              <User className="h-4 w-4 text-gray-400" />
              {ticket.submitted_by_name}
              {ticket.submitted_by_email && (
                <span className="text-gray-400">
                  ({ticket.submitted_by_email})
                </span>
              )}
            </span>
          )}
          {ticket.assigned_to && (
            <span className="flex items-center gap-1.5">
              <UserCheck className="h-4 w-4 text-gray-400" />
              Assigné à : {ticket.assigned_to.name}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-gray-400" />
            {formatDateTime(ticket.created_at)}
          </span>
        </div>
      </div>

      {/* Initial description */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          Description
        </h3>
        <div className="prose prose-sm max-w-none text-gray-700">
          {ticket.description.split('\n').map((line, i) => (
            <p key={i} className={i > 0 ? 'mt-2' : ''}>
              {line}
            </p>
          ))}
        </div>
      </div>

      {/* Thread */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">
          Conversation
          {replies.length > 0 && (
            <span className="ml-1.5 text-gray-400 font-normal">
              ({replies.length})
            </span>
          )}
        </h3>

        {replies.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-8 text-center">
            <p className="text-sm text-gray-400">
              Aucune réponse pour le moment
            </p>
          </div>
        ) : (
          <div
            ref={threadRef}
            className="space-y-4 max-h-[500px] overflow-y-auto rounded-xl border border-gray-100 bg-gray-50/30 p-4"
          >
            {replies.map((reply) => (
              <MessageBubble
                key={reply.id}
                reply={reply}
                isSuperAdmin={reply.author_type === 'super_admin'}
              />
            ))}
          </div>
        )}
      </div>

      {/* Reply form */}
      <ReplyForm ticketId={ticketId} ticketStatus={ticket.status} />

      {/* Close confirmation */}
      <ConfirmDialog
        open={confirmClose}
        onOpenChange={setConfirmClose}
        title="Fermer le ticket"
        description="Êtes-vous sûr de vouloir fermer ce ticket ? Il pourra être rouvert ultérieurement."
        confirmLabel="Fermer le ticket"
        onConfirm={() => {
          closeMutation.mutate(ticketId, {
            onSuccess: () => setConfirmClose(false),
          })
        }}
        isLoading={closeMutation.isPending}
        variant="warning"
      />
    </div>
  )
}
