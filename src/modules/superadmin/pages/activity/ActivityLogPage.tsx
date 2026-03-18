// ===== src/modules/superadmin/pages/activity/ActivityLogPage.tsx =====

import { useState, useCallback } from 'react'
import {
  Search,
  Download,
  X,
  LogIn,
  LogOut,
  Plus,
  Pencil,
  Trash2,
  FileDown,
  FileUp,
  Zap,
  CreditCard,
  ClipboardList,
  Globe,
} from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { DateRangePicker, type DateRange } from '@/shared/components/ui/DateRangePicker'
import { EmptyState } from '@/shared/components/feedback/EmptyState'
import { useActivityLogs, useExportActivityLogs } from '../../hooks/useActivityLogs'
import { useTenants } from '../../hooks/useTenants'
import { toast } from '@/shared/lib/toast'
import type { ActivityLog, ActivityLogFilters, ActivityType } from '../../types/activity.types'

// ── Activity type config ───────────────────────────────────────────────
const activityTypeConfig: Record<
  ActivityType,
  { label: string; icon: typeof LogIn; color: string; bg: string }
> = {
  login: { label: 'Connexion', icon: LogIn, color: 'text-green-600', bg: 'bg-green-100' },
  logout: { label: 'Déconnexion', icon: LogOut, color: 'text-gray-600', bg: 'bg-gray-100' },
  create: { label: 'Création', icon: Plus, color: 'text-blue-600', bg: 'bg-blue-100' },
  update: { label: 'Modification', icon: Pencil, color: 'text-amber-600', bg: 'bg-amber-100' },
  delete: { label: 'Suppression', icon: Trash2, color: 'text-red-600', bg: 'bg-red-100' },
  export: { label: 'Export', icon: FileDown, color: 'text-violet-600', bg: 'bg-violet-100' },
  import: { label: 'Import', icon: FileUp, color: 'text-teal-600', bg: 'bg-teal-100' },
  generate: { label: 'Génération', icon: Zap, color: 'text-yellow-600', bg: 'bg-yellow-100' },
  payment: { label: 'Paiement', icon: CreditCard, color: 'text-emerald-600', bg: 'bg-emerald-100' },
}

const actorTypeLabels: Record<string, string> = {
  super_admin: 'Super Admin',
  user: 'Utilisateur école',
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
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ── Activity Entry ─────────────────────────────────────────────────────
function ActivityEntry({ activity }: { activity: ActivityLog }) {
  const config = activity.activity_type
    ? activityTypeConfig[activity.activity_type]
    : null
  const Icon = config?.icon ?? ClipboardList
  const color = config?.color ?? 'text-gray-500'
  const bg = config?.bg ?? 'bg-gray-100'

  return (
    <div className="flex gap-4 rounded-xl border border-gray-100 bg-white p-4 transition-shadow hover:shadow-sm">
      {/* Icon */}
      <div
        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${bg}`}
      >
        <Icon className={`h-4 w-4 ${color}`} />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {/* Actor */}
          <span className="text-sm font-medium text-gray-900">
            {activity.actor_name ?? 'Système'}
          </span>
          {activity.actor_type && (
            <span className="text-xs text-gray-400">
              ({actorTypeLabels[activity.actor_type] ?? activity.actor_type})
            </span>
          )}
        </div>

        {/* Description */}
        <p className="mt-0.5 text-sm text-gray-600 leading-relaxed">
          {activity.description}
        </p>

        {/* Meta row */}
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-400">
          {activity.tenant_name && (
            <span className="flex items-center gap-1">
              <Globe className="h-3 w-3" />
              {activity.tenant_name}
            </span>
          )}
          {activity.ip_address && (
            <span>IP: {activity.ip_address}</span>
          )}
          <span title={formatDateTime(activity.created_at)}>
            {timeAgo(activity.created_at)}
          </span>
        </div>
      </div>

      {/* Activity type badge */}
      {config && (
        <div className="shrink-0">
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${bg} ${color}`}
          >
            {config.label}
          </span>
        </div>
      )}
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────
export function ActivityLogPage() {
  const [dateRange, setDateRange] = useState<DateRange>({ from: '', to: '' })
  const [actorType, setActorType] = useState('')
  const [tenantId, setTenantId] = useState('')
  const [activityType, setActivityType] = useState<ActivityType | ''>('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearch(e.target.value)
      setTimeout(() => {
        setDebouncedSearch(e.target.value)
        setPage(1)
      }, 400)
    },
    [],
  )

  const filters: ActivityLogFilters = {
    from: dateRange.from || undefined,
    to: dateRange.to || undefined,
    actor_type: actorType || undefined,
    tenant_id: tenantId || undefined,
    activity_type: activityType || undefined,
    page,
    per_page: 20,
  }

  const { data, isLoading } = useActivityLogs(filters)
  const { data: tenantsData } = useTenants({ per_page: 200 })
  const exportMutation = useExportActivityLogs()

  const activities = data?.data ?? []
  const meta = data?.meta
  const tenants = tenantsData?.data ?? []

  const hasActiveFilters =
    dateRange.from || dateRange.to || actorType || tenantId || activityType || debouncedSearch

  const handleExport = () => {
    toast.loading('Export en cours…')
    exportMutation.mutate({
      from: dateRange.from || undefined,
      to: dateRange.to || undefined,
      actor_type: actorType || undefined,
      tenant_id: tenantId || undefined,
      activity_type: activityType || undefined,
    })
  }

  const clearFilters = () => {
    setDateRange({ from: '', to: '' })
    setActorType('')
    setTenantId('')
    setActivityType('')
    setSearch('')
    setDebouncedSearch('')
    setPage(1)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Journal d&apos;activité
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Historique de toutes les actions sur la plateforme
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={exportMutation.isPending}
        >
          <Download className="mr-2 h-4 w-4" />
          Exporter
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <DateRangePicker value={dateRange} onChange={setDateRange} />

        <select
          value={actorType}
          onChange={(e) => {
            setActorType(e.target.value)
            setPage(1)
          }}
          className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Type acteur</option>
          <option value="super_admin">Super Admin</option>
          <option value="user">Utilisateur école</option>
        </select>

        <select
          value={tenantId}
          onChange={(e) => {
            setTenantId(e.target.value)
            setPage(1)
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

        <select
          value={activityType}
          onChange={(e) => {
            setActivityType(e.target.value as ActivityType | '')
            setPage(1)
          }}
          className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Type action</option>
          {(Object.keys(activityTypeConfig) as ActivityType[]).map((t) => (
            <option key={t} value={t}>
              {activityTypeConfig[t].label}
            </option>
          ))}
        </select>

        <div className="relative min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Rechercher…"
            value={search}
            onChange={handleSearchChange}
            className="pl-9"
          />
        </div>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="mr-1 h-3.5 w-3.5" />
            Effacer
          </Button>
        )}
      </div>

      {/* Activity Feed */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex gap-4 rounded-xl border border-gray-100 bg-white p-4"
            >
              <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-gray-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-48 animate-pulse rounded bg-gray-200" />
                <div className="h-3 w-full max-w-[400px] animate-pulse rounded bg-gray-100" />
                <div className="h-3 w-32 animate-pulse rounded bg-gray-100" />
              </div>
            </div>
          ))}
        </div>
      ) : activities.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Aucune activité"
          description="Aucune activité ne correspond à vos filtres."
        />
      ) : (
        <div className="space-y-3">
          {activities.map((a) => (
            <ActivityEntry key={a.id} activity={a} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.last_page > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-gray-500">
            Page {meta.current_page} sur {meta.last_page} — {meta.total}{' '}
            résultat{meta.total > 1 ? 's' : ''}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={meta.current_page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Précédent
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={meta.current_page >= meta.last_page}
              onClick={() => setPage((p) => p + 1)}
            >
              Suivant
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
