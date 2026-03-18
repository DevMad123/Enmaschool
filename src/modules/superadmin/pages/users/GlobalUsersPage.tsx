// ===== src/modules/superadmin/pages/users/GlobalUsersPage.tsx =====

import { useState, useMemo, useCallback } from 'react'
import {
  type ColumnDef,
  type RowSelectionState,
  type PaginationState,
} from '@tanstack/react-table'
import {
  Search,
  Users,
  Download,
  UserX,
  Eye,
  KeyRound,
  X,
  Clock,
  Building2,
  Shield,
  Mail,
  Phone,
  LoaderCircle,
} from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Avatar, AvatarImage, AvatarFallback } from '@/shared/components/ui/avatar'
import {
  Sheet,
  SheetContent,
} from '@/shared/components/ui/sheet'
import { DataTable } from '@/shared/components/tables/DataTable'
import { ConfirmDialog } from '@/shared/components/feedback/ConfirmDialog'
import {
  useGlobalUsers,
  useDeactivateUser,
  useBulkDeactivateUsers,
  useResetUserPassword,
  useExportUsers,
  useUserActivity,
} from '../../hooks/useUsers'
import { useTenants } from '../../hooks/useTenants'
import type {
  GlobalUser,
  GlobalUserFilters,
  GlobalUserRole,
  GlobalUserStatus,
} from '../../types/user.types'
import type { ActivityLog } from '../../types/activity.types'

// ── Helpers ────────────────────────────────────────────────────────────
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
  const months = Math.floor(days / 30)
  return `il y a ${months} mois`
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const roleColors: Record<GlobalUserRole, string> = {
  school_admin: 'bg-indigo-100 text-indigo-700',
  director: 'bg-violet-100 text-violet-700',
  teacher: 'bg-blue-100 text-blue-700',
  accountant: 'bg-emerald-100 text-emerald-700',
  staff: 'bg-slate-100 text-slate-700',
  student: 'bg-amber-100 text-amber-700',
  parent: 'bg-pink-100 text-pink-700',
}

const roleLabels: Record<GlobalUserRole, string> = {
  school_admin: 'Admin école',
  director: 'Directeur',
  teacher: 'Enseignant',
  accountant: 'Comptable',
  staff: 'Personnel',
  student: 'Élève',
  parent: 'Parent',
}

const statusColors: Record<GlobalUserStatus, string> = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-600',
  suspended: 'bg-red-100 text-red-700',
}

const statusLabels: Record<GlobalUserStatus, string> = {
  active: 'Actif',
  inactive: 'Inactif',
  suspended: 'Suspendu',
}

// ── Activity icon ──────────────────────────────────────────────────────
function activityIcon(type: string | null) {
  const iconMap: Record<string, { icon: string; color: string }> = {
    login: { icon: '🔑', color: 'bg-green-100' },
    logout: { icon: '🚪', color: 'bg-gray-100' },
    create: { icon: '➕', color: 'bg-blue-100' },
    update: { icon: '✏️', color: 'bg-amber-100' },
    delete: { icon: '🗑️', color: 'bg-red-100' },
    export: { icon: '📥', color: 'bg-violet-100' },
    import: { icon: '📤', color: 'bg-teal-100' },
    generate: { icon: '⚡', color: 'bg-yellow-100' },
    payment: { icon: '💳', color: 'bg-emerald-100' },
  }
  return iconMap[type ?? ''] ?? { icon: '📋', color: 'bg-gray-100' }
}

// ── User Detail Drawer ─────────────────────────────────────────────────
function UserDrawer({
  user,
  open,
  onClose,
}: {
  user: GlobalUser | null
  open: boolean
  onClose: () => void
}) {
  const { data: activityData, isLoading: activityLoading } = useUserActivity(
    user?.id ?? 0,
  )
  const deactivateMutation = useDeactivateUser()
  const resetPasswordMutation = useResetUserPassword()
  const [confirmDeactivate, setConfirmDeactivate] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)

  const activities: ActivityLog[] = activityData?.data ?? []

  if (!user) return null

  return (
    <>
      <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
        <SheetContent side="right" className="w-full max-w-md overflow-y-auto p-0">
          {/* Header */}
          <div className="border-b border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14">
                {user.avatar_url && <AvatarImage src={user.avatar_url} />}
                <AvatarFallback className="bg-indigo-100 text-indigo-700 text-lg font-bold">
                  {getInitials(user.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {user.full_name}
                </h3>
                <p className="text-sm text-gray-500 truncate">{user.email}</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${roleColors[user.role]}`}
              >
                {user.role_label || roleLabels[user.role]}
              </span>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[user.status]}`}
              >
                {user.status_label || statusLabels[user.status]}
              </span>
            </div>
          </div>

          {/* Info */}
          <div className="p-6 space-y-5">
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-900">
                Informations
              </h4>
              <div className="space-y-2.5">
                <div className="flex items-center gap-3 text-sm">
                  <Building2 className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">
                    {user.tenant_name}
                    {user.tenant_plan && (
                      <span className="ml-1.5 text-xs text-gray-400">
                        ({user.tenant_plan})
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">{user.email}</span>
                </div>
                {user.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">{user.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm">
                  <Shield className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">
                    {user.role_label || roleLabels[user.role]}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">
                    Dernière connexion : {timeAgo(user.last_login_at)}
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-900">
                Activité récente
              </h4>
              {activityLoading ? (
                <div className="flex items-center justify-center py-6">
                  <LoaderCircle className="h-5 w-5 animate-spin text-gray-400" />
                </div>
              ) : activities.length === 0 ? (
                <p className="text-xs text-gray-400 py-3">
                  Aucune activité récente
                </p>
              ) : (
                <div className="space-y-2.5">
                  {activities.slice(0, 5).map((a) => {
                    const ai = activityIcon(a.activity_type)
                    return (
                      <div
                        key={a.id}
                        className="flex items-start gap-3 rounded-lg bg-gray-50 p-2.5"
                      >
                        <div
                          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs ${ai.color}`}
                        >
                          {ai.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-gray-700 leading-relaxed">
                            {a.description}
                          </p>
                          <p className="mt-0.5 text-[11px] text-gray-400">
                            {timeAgo(a.created_at)}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => setConfirmDeactivate(true)}
                disabled={user.status === 'inactive'}
              >
                <UserX className="mr-1.5 h-3.5 w-3.5" />
                Désactiver
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setConfirmReset(true)}
              >
                <KeyRound className="mr-1.5 h-3.5 w-3.5" />
                Reset MDP
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={confirmDeactivate}
        onOpenChange={setConfirmDeactivate}
        title="Désactiver l'utilisateur"
        description={`Voulez-vous vraiment désactiver ${user.full_name} ? Il ne pourra plus se connecter.`}
        confirmLabel="Désactiver"
        onConfirm={() => {
          deactivateMutation.mutate(user.id, {
            onSuccess: () => setConfirmDeactivate(false),
          })
        }}
        isLoading={deactivateMutation.isPending}
        variant="danger"
      />

      <ConfirmDialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title="Réinitialiser le mot de passe"
        description={`Un email de réinitialisation sera envoyé à ${user.email}.`}
        confirmLabel="Réinitialiser"
        onConfirm={() => {
          resetPasswordMutation.mutate(user.id, {
            onSuccess: () => setConfirmReset(false),
          })
        }}
        isLoading={resetPasswordMutation.isPending}
        variant="warning"
      />
    </>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────
export function GlobalUsersPage() {
  // Filters state
  const [search, setSearch] = useState('')
  const [tenantId, setTenantId] = useState('')
  const [role, setRole] = useState<GlobalUserRole | ''>('')
  const [status, setStatus] = useState<GlobalUserStatus | ''>('')
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 15,
  })
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

  // Selected user for drawer
  const [selectedUser, setSelectedUser] = useState<GlobalUser | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearch(e.target.value)
      const timeout = setTimeout(() => {
        setDebouncedSearch(e.target.value)
        setPagination((p) => ({ ...p, pageIndex: 0 }))
      }, 400)
      return () => clearTimeout(timeout)
    },
    [],
  )

  // Build filters
  const filters: GlobalUserFilters = {
    search: debouncedSearch || undefined,
    tenant_id: tenantId || undefined,
    role: role || undefined,
    status: status || undefined,
    page: pagination.pageIndex + 1,
    per_page: pagination.pageSize,
  }

  // Data queries
  const { data, isLoading } = useGlobalUsers(filters)
  const { data: tenantsData } = useTenants({ per_page: 200 })
  const bulkDeactivate = useBulkDeactivateUsers()
  const exportMutation = useExportUsers()

  const users = data?.data ?? []
  const pageCount = data?.meta?.last_page ?? 1
  const tenants = tenantsData?.data ?? []

  // Selected user IDs for bulk actions
  const selectedIds = Object.keys(rowSelection)
    .filter((k) => rowSelection[k])
    .map((idx) => users[Number(idx)]?.id)
    .filter(Boolean) as number[]

  // Open drawer
  const openDrawer = useCallback((user: GlobalUser) => {
    setSelectedUser(user)
    setDrawerOpen(true)
  }, [])

  // ── Columns ────────────────────────────────────────────────────────
  const columns: ColumnDef<GlobalUser, unknown>[] = useMemo(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <input
            type="checkbox"
            className="rounded border-gray-300"
            checked={table.getIsAllPageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            className="rounded border-gray-300"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
          />
        ),
        enableSorting: false,
        size: 40,
      },
      {
        id: 'user',
        header: 'Utilisateur',
        accessorFn: (row) => row.full_name,
        cell: ({ row }) => {
          const u = row.original
          return (
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                {u.avatar_url && <AvatarImage src={u.avatar_url} />}
                <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs font-bold">
                  {getInitials(u.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-900">
                  {u.full_name}
                </p>
                <p className="truncate text-xs text-gray-400">{u.email}</p>
              </div>
            </div>
          )
        },
      },
      {
        id: 'tenant',
        header: 'École',
        accessorFn: (row) => row.tenant_name,
        cell: ({ row }) => (
          <span className="text-sm text-gray-700">
            {row.original.tenant_name}
          </span>
        ),
      },
      {
        id: 'role',
        header: 'Rôle',
        accessorFn: (row) => row.role,
        cell: ({ row }) => (
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${roleColors[row.original.role]}`}
          >
            {row.original.role_label || roleLabels[row.original.role]}
          </span>
        ),
      },
      {
        id: 'status',
        header: 'Statut',
        accessorFn: (row) => row.status,
        cell: ({ row }) => (
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[row.original.status]}`}
          >
            {row.original.status_label || statusLabels[row.original.status]}
          </span>
        ),
      },
      {
        id: 'last_login',
        header: 'Dernière connexion',
        accessorFn: (row) => row.last_login_at,
        cell: ({ row }) => (
          <span className="text-xs text-gray-500">
            {timeAgo(row.original.last_login_at)}
          </span>
        ),
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title="Voir détails"
              onClick={() => openDrawer(row.original)}
            >
              <Eye className="h-4 w-4 text-gray-500" />
            </Button>
          </div>
        ),
      },
    ],
    [openDrawer],
  )

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Utilisateurs globaux
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Tous les utilisateurs de toutes les écoles
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => exportMutation.mutate(filters)}
          disabled={exportMutation.isPending}
        >
          <Download className="mr-2 h-4 w-4" />
          Exporter
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Rechercher (nom, email)…"
            value={search}
            onChange={handleSearchChange}
            className="pl-9"
          />
        </div>

        {/* Tenant filter */}
        <select
          value={tenantId}
          onChange={(e) => {
            setTenantId(e.target.value)
            setPagination((p) => ({ ...p, pageIndex: 0 }))
          }}
          className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Toutes les écoles</option>
          {tenants.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>

        {/* Role filter */}
        <select
          value={role}
          onChange={(e) => {
            setRole(e.target.value as GlobalUserRole | '')
            setPagination((p) => ({ ...p, pageIndex: 0 }))
          }}
          className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Tous les rôles</option>
          {(Object.keys(roleLabels) as GlobalUserRole[]).map((r) => (
            <option key={r} value={r}>
              {roleLabels[r]}
            </option>
          ))}
        </select>

        {/* Status filter */}
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as GlobalUserStatus | '')
            setPagination((p) => ({ ...p, pageIndex: 0 }))
          }}
          className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Tous les statuts</option>
          {(Object.keys(statusLabels) as GlobalUserStatus[]).map((s) => (
            <option key={s} value={s}>
              {statusLabels[s]}
            </option>
          ))}
        </select>

        {/* Clear filters */}
        {(debouncedSearch || tenantId || role || status) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch('')
              setDebouncedSearch('')
              setTenantId('')
              setRole('')
              setStatus('')
            }}
          >
            <X className="mr-1 h-3.5 w-3.5" />
            Effacer
          </Button>
        )}
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={users}
        isLoading={isLoading}
        pagination={pagination}
        onPaginationChange={setPagination}
        pageCount={pageCount}
        manualPagination
        enableRowSelection
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        emptyIcon={<Users className="h-8 w-8 text-gray-400" />}
        emptyTitle="Aucun utilisateur"
        emptyDescription="Aucun utilisateur ne correspond à vos filtres."
        bulkActions={
          <>
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 border-red-200 hover:bg-red-50"
              onClick={() => bulkDeactivate.mutate(selectedIds, {
                onSuccess: () => setRowSelection({}),
              })}
              disabled={bulkDeactivate.isPending}
            >
              <UserX className="mr-1.5 h-3.5 w-3.5" />
              Désactiver
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportMutation.mutate(filters)}
              disabled={exportMutation.isPending}
            >
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Exporter la sélection
            </Button>
          </>
        }
      />

      {/* User detail drawer */}
      <UserDrawer
        user={selectedUser}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false)
          setSelectedUser(null)
        }}
      />
    </div>
  )
}
