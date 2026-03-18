// ===== src/modules/school/pages/users/UsersPage.tsx =====

import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { type ColumnDef, type PaginationState } from '@tanstack/react-table'
import {
  Search, MoreHorizontal, MailPlus, UserPlus, ShieldAlert, KeyRound,
  UserCheck, UserX, Trash2, ArrowUpRight,
} from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Badge } from '@/shared/components/ui/badge'
import { DataTable } from '@/shared/components/tables/DataTable'
import { EmptyState } from '@/shared/components/feedback/EmptyState'
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner'
import { ConfirmDialog } from '@/shared/components/feedback/ConfirmDialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { useAuthStore } from '@/modules/auth/store/authStore'
import { useUsers, useDeleteUser, useActivateUser, useDeactivateUser, useSuspendUser } from '../../hooks/useUsers'
import { UserRoleBadge } from '../../components/users/UserRoleBadge'
import { UserStatusBadge } from '../../components/users/UserStatusBadge'
import { UserAvatar } from '../../components/users/UserAvatar'
import { UserFormModal } from '../../components/users/UserFormModal'
import { InviteUserModal } from '../../components/users/InviteUserModal'
import { ResetPasswordModal } from '../../components/users/ResetPasswordModal'
import { STAFF_ROLES, USER_ROLE_LABELS, type SchoolUser, type UserRole, type UserStatus } from '../../types/users.types'

const ROLE_TABS: { label: string; value: UserRole | '' }[] = [
  { label: 'Tous', value: '' },
  { label: 'Admins', value: 'school_admin' },
  { label: 'Directeurs', value: 'director' },
  { label: 'Enseignants', value: 'teacher' },
  { label: 'Comptables', value: 'accountant' },
  { label: 'Personnel', value: 'staff' },
]

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Jamais'
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return "À l'instant"
  if (minutes < 60) return `il y a ${minutes}min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `il y a ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 30) return `il y a ${days}j`
  return `il y a ${Math.floor(days / 30)} mois`
}

export function UsersPage() {
  const navigate = useNavigate()
  const currentUser = useAuthStore((s) => s.user)

  const [activeRole, setActiveRole] = useState<UserRole | ''>('')
  const [statusFilter, setStatusFilter] = useState<UserStatus | ''>('')
  const [search, setSearch] = useState('')
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 })

  const [createOpen, setCreateOpen] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [editUser, setEditUser] = useState<SchoolUser | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<SchoolUser | null>(null)
  const [resetTarget, setResetTarget] = useState<SchoolUser | null>(null)

  const { data, isLoading } = useUsers({
    role:     activeRole || undefined,
    status:   statusFilter || undefined,
    search:   search || undefined,
    page:     pagination.pageIndex + 1,
    per_page: pagination.pageSize,
  })

  const deleteMutation  = useDeleteUser()
  const activateMutation = useActivateUser()
  const deactivateMutation = useDeactivateUser()
  const suspendMutation = useSuspendUser()

  const users      = data?.data ?? []
  const pageCount  = data?.meta?.last_page ?? 1

  // Count per role tab
  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const r of STAFF_ROLES) counts[r] = 0
    for (const u of users) counts[u.role.value] = (counts[u.role.value] ?? 0) + 1
    return counts
  }, [users])

  const columns: ColumnDef<SchoolUser, unknown>[] = useMemo(() => [
    {
      id: 'user',
      header: 'Utilisateur',
      cell: ({ row }) => {
        const u = row.original
        const isMe = currentUser?.id === u.id
        return (
          <div className="flex items-center gap-3">
            <UserAvatar user={u} size="sm" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium text-gray-900">{u.full_name}</span>
                {isMe && (
                  <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">Vous</Badge>
                )}
              </div>
              <span className="text-xs text-gray-500">{u.email}</span>
            </div>
          </div>
        )
      },
    },
    {
      id: 'role',
      header: 'Rôle',
      cell: ({ row }) => <UserRoleBadge role={row.original.role.value} />,
    },
    {
      id: 'status',
      header: 'Statut',
      cell: ({ row }) => <UserStatusBadge status={row.original.status.value} />,
    },
    {
      id: 'last_login',
      header: 'Dernière connexion',
      cell: ({ row }) => (
        <span className="text-xs text-gray-500">{timeAgo(row.original.last_login_at)}</span>
      ),
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }) => {
        const u = row.original
        const isMe = currentUser?.id === u.id
        const isActive = u.status.value === 'active'

        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost" size="icon" className="h-8 w-8"
              onClick={() => navigate(`/school/users/${u.id}`)}
            >
              <ArrowUpRight className="h-4 w-4 text-gray-500" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4 text-gray-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => setEditUser(u)}>
                  Modifier
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setResetTarget(u)}>
                  <KeyRound className="mr-2 h-3.5 w-3.5" />
                  Réinitialiser MDP
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {isActive ? (
                  <DropdownMenuItem
                    onClick={() => !isMe && deactivateMutation.mutate(u.id)}
                    disabled={isMe}
                    className={isMe ? 'opacity-40' : ''}
                  >
                    <UserX className="mr-2 h-3.5 w-3.5" />
                    Désactiver
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => activateMutation.mutate(u.id)}>
                    <UserCheck className="mr-2 h-3.5 w-3.5" />
                    Activer
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => !isMe && suspendMutation.mutate({ id: u.id })}
                  disabled={isMe}
                  className={isMe ? 'opacity-40' : 'text-amber-600'}
                >
                  <ShieldAlert className="mr-2 h-3.5 w-3.5" />
                  Suspendre
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => !isMe && setDeleteTarget(u)}
                  disabled={isMe}
                  className={isMe ? 'opacity-40' : 'text-red-600 focus:text-red-600'}
                >
                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ], [navigate, currentUser, activateMutation, deactivateMutation, suspendMutation])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Utilisateurs</h1>
          <p className="mt-1 text-sm text-gray-500">Gérez les membres du personnel de l'école</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setInviteOpen(true)}>
            <MailPlus className="mr-2 h-4 w-4" />
            Inviter
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Créer
          </Button>
        </div>
      </div>

      {/* Tabs rôle */}
      <div className="flex flex-wrap gap-1 border-b border-gray-200">
        {ROLE_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => {
              setActiveRole(tab.value)
              setPagination((p) => ({ ...p, pageIndex: 0 }))
            }}
            className={`inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              activeRole === tab.value
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            {tab.value && roleCounts[tab.value] !== undefined && (
              <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                {roleCounts[tab.value]}
              </Badge>
            )}
          </button>
        ))}
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Rechercher…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPagination((p) => ({ ...p, pageIndex: 0 })) }}
            className="pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as UserStatus | '')
            setPagination((p) => ({ ...p, pageIndex: 0 }))
          }}
          className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Tous les statuts</option>
          <option value="active">Actif</option>
          <option value="inactive">Inactif</option>
          <option value="suspended">Suspendu</option>
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <LoadingSpinner fullScreen />
      ) : users.length === 0 ? (
        <EmptyState
          icon={UserPlus}
          title="Aucun utilisateur"
          description="Aucun utilisateur ne correspond à vos filtres."
        />
      ) : (
        <DataTable
          columns={columns}
          data={users}
          isLoading={isLoading}
          pagination={pagination}
          onPaginationChange={setPagination}
          pageCount={pageCount}
          manualPagination
        />
      )}

      {/* Modals */}
      <UserFormModal open={createOpen} onOpenChange={setCreateOpen} />
      <UserFormModal open={!!editUser} onOpenChange={(o) => !o && setEditUser(null)} user={editUser} />
      <InviteUserModal open={inviteOpen} onOpenChange={setInviteOpen} />

      {resetTarget && (
        <ResetPasswordModal
          open={!!resetTarget}
          onOpenChange={(o) => !o && setResetTarget(null)}
          user={resetTarget}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Supprimer l'utilisateur"
        description={`Êtes-vous sûr de vouloir supprimer ${deleteTarget?.full_name} ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (deleteTarget) {
            deleteMutation.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) })
          }
        }}
      />
    </div>
  )
}
