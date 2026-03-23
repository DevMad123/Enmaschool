// ===== src/modules/school/pages/users/InvitationsPage.tsx =====

import { useState } from 'react'
import { type ColumnDef, type PaginationState } from '@tanstack/react-table'
import { MailPlus, Copy, RotateCcw, XCircle, Check } from 'lucide-react'
import { copyToClipboard } from '@/shared/lib/clipboard'
import { Button } from '@/shared/components/ui/button'
import { DataTable } from '@/shared/components/tables/DataTable'
import { EmptyState } from '@/shared/components/feedback/EmptyState'
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner'
import { useInvitations, useResendInvitation, useRevokeInvitation } from '../../hooks/useUsers'
import { InvitationStatusBadge } from '../../components/users/InvitationStatusBadge'
import { UserRoleBadge } from '../../components/users/UserRoleBadge'
import { InviteUserModal } from '../../components/users/InviteUserModal'
import type { UserInvitation, InvitationStatus } from '../../types/users.types'

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

export function InvitationsPage() {
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 })
  const [statusFilter, setStatusFilter] = useState<InvitationStatus | ''>('')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [copiedId, setCopiedId] = useState<number | null>(null)

  const { data, isLoading } = useInvitations({
    status:   statusFilter || undefined,
    page:     pagination.pageIndex + 1,
    per_page: pagination.pageSize,
  })

  const resendMutation = useResendInvitation()
  const revokeMutation = useRevokeInvitation()

  const invitations = data?.data ?? []
  const pageCount   = data?.meta?.last_page ?? 1

  const handleCopy = async (invitation: UserInvitation) => {
    if (!invitation.invitation_link) return
    try { await copyToClipboard(invitation.invitation_link) } catch { /* silent */ }
    setCopiedId(invitation.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const columns: ColumnDef<UserInvitation, unknown>[] = [
    {
      id: 'email',
      header: 'Email',
      cell: ({ row }) => (
        <span className="text-sm text-gray-900">{row.original.email}</span>
      ),
    },
    {
      id: 'role',
      header: 'Rôle',
      cell: ({ row }) => <UserRoleBadge role={row.original.role.value} />,
    },
    {
      id: 'status',
      header: 'Statut',
      cell: ({ row }) => <InvitationStatusBadge status={row.original.status.value} />,
    },
    {
      id: 'invited_by',
      header: 'Invité par',
      cell: ({ row }) => (
        <span className="text-sm text-gray-600">{row.original.invited_by?.full_name ?? '—'}</span>
      ),
    },
    {
      id: 'expires_at',
      header: 'Expire le',
      cell: ({ row }) => (
        <span className="text-xs text-gray-500">{formatDate(row.original.expires_at)}</span>
      ),
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }) => {
        const inv    = row.original
        const status = inv.status.value

        return (
          <div className="flex items-center gap-1">
            {(status === 'pending' || status === 'expired') && (
              <Button
                variant="ghost" size="sm"
                onClick={() => resendMutation.mutate(inv.id)}
                disabled={resendMutation.isPending}
              >
                <RotateCcw className="mr-1 h-3.5 w-3.5" />
                Renvoyer
              </Button>
            )}
            {status === 'pending' && (
              <>
                <Button
                  variant="ghost" size="icon" className="h-8 w-8"
                  onClick={() => handleCopy(inv)}
                  title="Copier le lien"
                >
                  {copiedId === inv.id
                    ? <Check className="h-4 w-4 text-green-600" />
                    : <Copy className="h-4 w-4 text-gray-500" />
                  }
                </Button>
                <Button
                  variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-600"
                  onClick={() => revokeMutation.mutate(inv.id)}
                  disabled={revokeMutation.isPending}
                  title="Révoquer"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invitations</h1>
          <p className="mt-1 text-sm text-gray-500">Suivi des invitations envoyées</p>
        </div>
        <Button size="sm" onClick={() => setInviteOpen(true)}>
          <MailPlus className="mr-2 h-4 w-4" />
          Nouvelle invitation
        </Button>
      </div>

      {/* Filtre statut */}
      <div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as InvitationStatus | '')
            setPagination((p) => ({ ...p, pageIndex: 0 }))
          }}
          className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="accepted">Acceptées</option>
          <option value="expired">Expirées</option>
          <option value="revoked">Révoquées</option>
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <LoadingSpinner fullScreen />
      ) : invitations.length === 0 ? (
        <EmptyState
          icon={MailPlus}
          title="Aucune invitation"
          description="Aucune invitation ne correspond à vos filtres."
        />
      ) : (
        <DataTable
          columns={columns}
          data={invitations}
          isLoading={isLoading}
          pagination={pagination}
          onPaginationChange={setPagination}
          pageCount={pageCount}
          manualPagination
        />
      )}

      <InviteUserModal open={inviteOpen} onOpenChange={setInviteOpen} />
    </div>
  )
}
