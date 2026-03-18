// ===== src/modules/superadmin/pages/tenants/TenantDetailPage.tsx =====

import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Pencil,
  CheckCircle,
  PauseCircle,
  Trash2,
  Building2,
  Users,
  GraduationCap,
  BookOpen,
  HardDrive,
  Calendar,
  Globe,
  Phone,
  Mail,
  MapPin,
  CreditCard,
} from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { TenantStatusBadge } from '../../components/TenantStatusBadge'
import { SchoolTypeBadges } from '../../components/SchoolTypeBadges'
import { ModuleToggle } from '../../components/ModuleToggle'
import { StatsCard } from '../../components/StatsCard'
import {
  useTenant,
  useTenantStats,
  useTenantModules,
  useTenantActivity,
  useActivateTenant,
  useSuspendTenant,
  useDeleteTenant,
  useEnableModule,
  useDisableModule,
} from '../../hooks/useTenants'
import { useTenantSubscriptions, useAssignPlan } from '../../hooks/useSubscriptions'
import { usePlans } from '../../hooks/usePlans'
import type { ActivityLogFilters } from '../../types/activity.types'
import type { BillingCycle } from '../../types/subscription.types'

// ── Tab types ──────────────────────────────────────────────────────────────────
type Tab = 'info' | 'modules' | 'stats' | 'subscriptions' | 'activity'

const TABS: { id: Tab; label: string }[] = [
  { id: 'info', label: 'Informations' },
  { id: 'modules', label: 'Modules' },
  { id: 'stats', label: 'Statistiques' },
  { id: 'subscriptions', label: 'Abonnements' },
  { id: 'activity', label: 'Activité' },
]

// ── Helpers ────────────────────────────────────────────────────────────────────
function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function formatDateShort(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "à l'instant"
  if (mins < 60) return `il y a ${mins}min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `il y a ${hrs}h`
  return `il y a ${Math.floor(hrs / 24)}j`
}

function ProgressBar({ value, max, label }: { value: number; max: number | null; label: string }) {
  const pct = max ? Math.min(100, Math.round((value / max) * 100)) : 0
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-slate-500">
        <span>{label}</span>
        <span>
          {value}{max ? ` / ${max}` : ''} {max ? `(${pct}%)` : ''}
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all ${
            pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-indigo-500'
          }`}
          style={{ width: max ? `${pct}%` : '0%' }}
        />
      </div>
    </div>
  )
}

// ── Tab: Info ──────────────────────────────────────────────────────────────────
function TabInfo({ tenantId }: { tenantId: string }) {
  const { data: tenantRes } = useTenant(tenantId)
  const { data: subsRes } = useTenantSubscriptions(tenantId)
  const { data: plansRes } = usePlans()
  const { mutate: assignPlan, isPending: assigning } = useAssignPlan()
  const [showAssign, setShowAssign] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null)
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly')

  const tenant = tenantRes?.data
  const subs = subsRes?.data ?? []
  const activeSub = subs[0]
  const plans = plansRes?.data ?? []

  if (!tenant) return <div className="p-4 text-slate-400">Chargement…</div>

  const p = tenant.profile

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Profile card */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Profil de l&apos;école</h3>
          <Button variant="outline" size="sm" asChild>
            <Link to={`/admin/tenants/${tenantId}/edit`}>
              <Pencil className="h-3.5 w-3.5" /> Modifier
            </Link>
          </Button>
        </div>

        <dl className="space-y-3">
          {[
            { icon: Globe, label: 'Slug', value: tenant.slug },
            { icon: MapPin, label: 'Ville', value: p.city ?? '—' },
            { icon: MapPin, label: 'Pays', value: p.country },
            { icon: Phone, label: 'Téléphone', value: p.phone ?? '—' },
            { icon: Mail, label: 'Email', value: p.email ?? '—' },
            { icon: Calendar, label: 'Inscription', value: formatDate(tenant.created_at) },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-3">
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              <div className="min-w-0 flex-1">
                <dt className="text-xs text-slate-400">{label}</dt>
                <dd className="text-sm text-slate-700 break-all">{value}</dd>
              </div>
            </div>
          ))}
        </dl>

        <div className="mt-4 border-t border-slate-100 pt-4">
          <p className="mb-2 text-xs text-slate-400">Types d&apos;établissement</p>
          <SchoolTypeBadges
            has_maternelle={tenant.has_maternelle}
            has_primary={tenant.has_primary}
            has_college={tenant.has_college}
            has_lycee={tenant.has_lycee}
            size="md"
          />
        </div>
      </div>

      {/* Subscription card */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Abonnement actuel</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAssign((v) => !v)}
          >
            <CreditCard className="h-3.5 w-3.5" />
            {activeSub ? 'Changer de plan' : 'Assigner un plan'}
          </Button>
        </div>

        {activeSub ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Plan</span>
              <span className="text-sm font-semibold text-slate-900">
                {activeSub.plan?.name ?? '—'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Statut</span>
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                  activeSub.status === 'active'
                    ? 'bg-green-50 text-green-800 border-green-200'
                    : activeSub.status === 'trial'
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-red-50 text-red-800 border-red-200'
                }`}
              >
                {activeSub.status_label}
              </span>
            </div>
            {activeSub.trial_ends_at && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Fin essai</span>
                <span className="text-sm text-amber-600 font-medium">
                  {formatDate(activeSub.trial_ends_at)}
                </span>
              </div>
            )}
            {activeSub.ends_at && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Expiration</span>
                <span className="text-sm text-slate-700">
                  {formatDate(activeSub.ends_at)}
                </span>
              </div>
            )}
            {activeSub.days_left !== null && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Jours restants</span>
                <span
                  className={`text-sm font-bold ${
                    activeSub.days_left <= 5 ? 'text-red-600' : 'text-slate-900'
                  }`}
                >
                  {activeSub.days_left}j
                </span>
              </div>
            )}
          </div>
        ) : (
          <p className="py-4 text-center text-sm text-slate-400">
            Aucun abonnement actif
          </p>
        )}

        {/* Assign plan form */}
        {showAssign && (
          <div className="mt-4 rounded-lg border border-indigo-100 bg-indigo-50 p-4 space-y-3">
            <p className="text-sm font-medium text-indigo-800">Assigner un plan</p>
            <select
              value={selectedPlan ?? ''}
              onChange={(e) => setSelectedPlan(Number(e.target.value) || null)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            >
              <option value="">Sélectionner un plan</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <select
              value={billingCycle}
              onChange={(e) => setBillingCycle(e.target.value as BillingCycle)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            >
              <option value="monthly">Mensuel</option>
              <option value="yearly">Annuel</option>
            </select>
            <div className="flex gap-2">
              <Button
                size="sm"
                disabled={!selectedPlan || assigning}
                onClick={() => {
                  if (!selectedPlan) return
                  assignPlan(
                    {
                      tenantId,
                      data: { plan_id: selectedPlan, billing_cycle: billingCycle },
                    },
                    { onSuccess: () => setShowAssign(false) },
                  )
                }}
              >
                Confirmer
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowAssign(false)}>
                Annuler
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Tab: Modules ───────────────────────────────────────────────────────────────
function TabModules({ tenantId }: { tenantId: string }) {
  const { data: modulesRes, isLoading } = useTenantModules(tenantId)
  const { mutate: enableMod, isPending: enabling } = useEnableModule()
  const { mutate: disableMod, isPending: disabling } = useDisableModule()

  const modules = modulesRes?.data ?? []

  const handleToggle = (moduleKey: string, enable: boolean, reason?: string) => {
    if (enable) {
      enableMod({ tenantId, data: { module_key: moduleKey } })
    } else {
      disableMod({ tenantId, data: { module_key: moduleKey, reason } })
    }
  }

  if (isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-slate-100" />
        ))}
      </div>
    )
  }

  if (modules.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-slate-400">
        Aucun module disponible
      </p>
    )
  }

  const coreModules = modules.filter((m) => m.is_core)
  const optionalModules = modules.filter((m) => !m.is_core)

  return (
    <div className="space-y-6">
      {coreModules.length > 0 && (
        <div>
          <h4 className="mb-3 text-sm font-semibold text-slate-700">
            Modules de base (toujours actifs)
          </h4>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {coreModules.map((mod) => (
              <ModuleToggle
                key={mod.module_key}
                module={mod}
                isEnabled={mod.is_enabled}
                isCore={mod.is_core}
                onToggle={handleToggle}
                loading={enabling || disabling}
              />
            ))}
          </div>
        </div>
      )}
      {optionalModules.length > 0 && (
        <div>
          <h4 className="mb-3 text-sm font-semibold text-slate-700">
            Modules optionnels
          </h4>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {optionalModules.map((mod) => (
              <ModuleToggle
                key={mod.module_key}
                module={mod}
                isEnabled={mod.is_enabled}
                isCore={mod.is_core}
                onToggle={handleToggle}
                loading={enabling || disabling}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Tab: Stats ─────────────────────────────────────────────────────────────────
function TabStats({ tenantId }: { tenantId: string }) {
  const { data: tenantRes } = useTenant(tenantId)
  const { data: statsRes, isLoading } = useTenantStats(tenantId)

  const s = statsRes?.data
  const plan = tenantRes?.data?.plan

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl bg-slate-100" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          title="Élèves"
          value={s?.students_count ?? 0}
          icon={GraduationCap}
          color="indigo"
        />
        <StatsCard
          title="Enseignants"
          value={s?.teachers_count ?? 0}
          icon={Users}
          color="green"
        />
        <StatsCard
          title="Utilisateurs total"
          value={s?.users_count ?? 0}
          icon={Users}
          color="violet"
        />
        <StatsCard
          title="Classes"
          value={s?.classes_count ?? 0}
          icon={BookOpen}
          color="sky"
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-2 flex items-center gap-2">
          <HardDrive className="h-4 w-4 text-slate-400" />
          <h4 className="font-medium text-slate-900">
            Utilisation &amp; Limites du plan
          </h4>
          {plan && (
            <span className="ml-auto text-xs text-slate-400">Plan {plan.name}</span>
          )}
        </div>
        <p className="mb-4 text-xs text-slate-400">
          Limites basées sur le plan actuel
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <ProgressBar
            value={s?.storage_used_mb ? Math.round(s.storage_used_mb / 1024) : 0}
            max={null}
            label="Stockage utilisé (GB)"
          />
        </div>
      </div>
    </div>
  )
}

// ── Tab: Subscriptions ─────────────────────────────────────────────────────────
function TabSubscriptions({ tenantId }: { tenantId: string }) {
  const { data: subsRes, isLoading } = useTenantSubscriptions(tenantId)
  const subs = subsRes?.data ?? []

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-100" />
        ))}
      </div>
    )
  }

  if (subs.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-slate-400">
        Aucun historique d&apos;abonnement
      </p>
    )
  }

  return (
    <div className="relative pl-6">
      <div className="absolute left-3 top-0 h-full w-0.5 bg-slate-200" />
      <div className="space-y-4">
        {subs.map((sub) => (
          <div key={sub.id} className="relative">
            <div className="absolute -left-[13px] top-3 h-3 w-3 rounded-full border-2 border-white bg-indigo-400 ring-1 ring-indigo-200" />
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-slate-900">
                    {sub.plan?.name ?? 'Plan inconnu'}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {formatDateShort(sub.starts_at ?? sub.trial_ends_at ?? '')} →{' '}
                    {sub.ends_at ? formatDateShort(sub.ends_at) : 'En cours'}
                  </p>
                </div>
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                    sub.status === 'active'
                      ? 'border-green-200 bg-green-50 text-green-800'
                      : sub.status === 'trial'
                        ? 'border-amber-200 bg-amber-50 text-amber-800'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                  }`}
                >
                  {sub.status_label}
                </span>
              </div>
              {sub.cancellation_reason && (
                <p className="mt-2 text-xs text-red-500">
                  Annulé : {sub.cancellation_reason}
                </p>
              )}
              {sub.notes && (
                <p className="mt-2 text-xs text-slate-400">{sub.notes}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Tab: Activity ──────────────────────────────────────────────────────────────
function TabActivity({ tenantId }: { tenantId: string }) {
  const [filters, setFilters] = useState<ActivityLogFilters>({ page: 1, per_page: 20 })
  const { data, isLoading, isFetching } = useTenantActivity(tenantId, filters)
  const logs = data?.data ?? []
  const meta = data?.meta

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <select
          value={filters.activity_type ?? ''}
          onChange={(e) =>
            setFilters((f) => ({
              ...f,
              activity_type: (e.target.value as ActivityLogFilters['activity_type']) || undefined,
              page: 1,
            }))
          }
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        >
          <option value="">Tous types</option>
          <option value="create">Créations</option>
          <option value="update">Modifications</option>
          <option value="delete">Suppressions</option>
          <option value="login">Connexions</option>
        </select>
        {isFetching && !isLoading && (
          <span className="text-xs text-slate-400">Chargement…</span>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded bg-slate-100" />
          ))}
        </div>
      ) : (
        <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white shadow-sm">
          {logs.map((log) => (
            <div key={log.id} className="flex items-start gap-3 px-4 py-3">
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                {(log.activity_label ?? log.activity_type ?? 'A')
                  .slice(0, 1)
                  .toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-slate-700">
                  <span className="font-medium">{log.actor_name ?? 'Système'}</span>
                  {' · '}
                  {log.description}
                </p>
                {log.module && (
                  <p className="mt-0.5 text-xs text-indigo-500">
                    Module: {log.module}
                  </p>
                )}
              </div>
              <span className="shrink-0 whitespace-nowrap text-xs text-slate-400">
                {timeAgo(log.created_at)}
              </span>
            </div>
          ))}
          {logs.length === 0 && (
            <p className="px-4 py-12 text-center text-sm text-slate-400">
              Aucune activité enregistrée
            </p>
          )}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.last_page > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {meta.from ?? 0}–{meta.to ?? 0} sur {meta.total}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!data?.links?.prev}
              onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }))}
            >
              Précédent
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!data?.links?.next}
              onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))}
            >
              Suivant
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────
export function TenantDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<Tab>('info')

  const { data: tenantRes, isLoading } = useTenant(id!)
  const { mutate: activate, isPending: activating } = useActivateTenant()
  const { mutate: suspend, isPending: suspending } = useSuspendTenant()
  const { mutate: deleteTenant, isPending: deleting } = useDeleteTenant()

  const tenant = tenantRes?.data

  const handleDelete = () => {
    if (!window.confirm('Supprimer cette école ? Cette action est irréversible.')) return
    deleteTenant(id!, { onSuccess: () => navigate('/admin/tenants') })
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-slate-100" />
        <div className="h-32 animate-pulse rounded-xl bg-slate-100" />
      </div>
    )
  }

  if (!tenant) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-red-700">École introuvable.</p>
        <Button variant="outline" size="sm" className="mt-3" asChild>
          <Link to="/admin/tenants">Retour à la liste</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <Link to="/admin/tenants">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-lg font-bold text-indigo-700">
            {tenant.name[0]?.toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">{tenant.name}</h2>
              <TenantStatusBadge status={tenant.status} />
            </div>
            <p className="text-sm text-slate-400">{tenant.slug}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {tenant.status !== 'active' && (
            <Button
              size="sm"
              variant="outline"
              className="text-green-700 border-green-300 hover:bg-green-50"
              disabled={activating}
              onClick={() => activate(id!)}
            >
              <CheckCircle className="h-4 w-4" /> Activer
            </Button>
          )}
          {(tenant.status === 'active' || tenant.status === 'trial') && (
            <Button
              size="sm"
              variant="outline"
              className="text-amber-700 border-amber-300 hover:bg-amber-50"
              disabled={suspending}
              onClick={() =>
                suspend({ id: id!, data: { reason: 'Suspension depuis admin' } })
              }
            >
              <PauseCircle className="h-4 w-4" /> Suspendre
            </Button>
          )}
          <Button variant="outline" size="sm" asChild>
            <Link to={`/admin/tenants/${id}/edit`}>
              <Pencil className="h-4 w-4" /> Modifier
            </Link>
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-red-600 border-red-300 hover:bg-red-50"
            disabled={deleting}
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4" /> Supprimer
          </Button>
        </div>
      </div>

      {/* ── School type chips ── */}
      <div className="flex items-center gap-3">
        <SchoolTypeBadges
          has_maternelle={tenant.has_maternelle}
          has_primary={tenant.has_primary}
          has_college={tenant.has_college}
          has_lycee={tenant.has_lycee}
          size="md"
        />
        <Building2 className="h-4 w-4 text-slate-300" />
        <span className="text-sm text-slate-400">{tenant.school_types_label}</span>
      </div>

      {/* ── Tabs ── */}
      <div className="border-b border-slate-200">
        <div className="flex gap-0 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content ── */}
      <div>
        {activeTab === 'info' && <TabInfo tenantId={id!} />}
        {activeTab === 'modules' && <TabModules tenantId={id!} />}
        {activeTab === 'stats' && <TabStats tenantId={id!} />}
        {activeTab === 'subscriptions' && <TabSubscriptions tenantId={id!} />}
        {activeTab === 'activity' && <TabActivity tenantId={id!} />}
      </div>
    </div>
  )
}
