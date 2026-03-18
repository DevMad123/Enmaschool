// ===== src/modules/superadmin/pages/DashboardPage.tsx =====

import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Building2,
  DollarSign,
  Ticket,
  AlertTriangle,
  Activity,
  ArrowRight,
  RefreshCw,
  BarChart2,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Button } from '@/shared/components/ui/button'
import { StatsCard } from '../components/StatsCard'
import { TenantStatusBadge } from '../components/TenantStatusBadge'
import { SchoolTypeBadges } from '../components/SchoolTypeBadges'
import { useDashboardStats, useRefreshDashboard } from '../hooks/useDashboard'
import { useTickets } from '../hooks/useTickets'

// ── Helpers ────────────────────────────────────────────────────────────────────
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(amount) + ' FCFA'
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "à l'instant"
  if (mins < 60) return `il y a ${mins}min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `il y a ${hrs}h`
  return `il y a ${Math.floor(hrs / 24)}j`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const ACTIVITY_ICON_COLOR: Record<string, string> = {
  login: 'bg-blue-100 text-blue-600',
  logout: 'bg-slate-100 text-slate-600',
  create: 'bg-green-100 text-green-600',
  update: 'bg-amber-100 text-amber-600',
  delete: 'bg-red-100 text-red-600',
  payment: 'bg-violet-100 text-violet-600',
}

// ── Chart: build monthly buckets ───────────────────────────────────────────────
function buildChartData(
  monthlyRegistrations?: Array<{ month: string; count: number }>,
): Array<{ month: string; count: number }> {
  if (monthlyRegistrations && monthlyRegistrations.length > 0) {
    return monthlyRegistrations.slice(-6)
  }
  // Placeholder for last 6 months
  const now = new Date()
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
    return {
      month: d.toLocaleDateString('fr-FR', { month: 'short' }),
      count: 0,
    }
  })
}

// ── Dashboard Page ─────────────────────────────────────────────────────────────
export function DashboardPage() {
  const { data: statsData, isLoading } = useDashboardStats()
  const { data: ticketsData } = useTickets({ status: 'open', per_page: 1 })
  const refresh = useRefreshDashboard()

  const stats = statsData?.data
  const openTickets = ticketsData?.meta?.total ?? 0

  const chartData = useMemo(
    () => buildChartData(stats?.monthly_registrations),
    [stats?.monthly_registrations],
  )

  const hasPlaceholderChart = !stats?.monthly_registrations?.length

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Vue d'ensemble</h2>
          <p className="text-sm text-slate-500">
            Bienvenue dans le tableau de bord Enma School Admin
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refresh()}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          title="Total écoles"
          value={stats?.tenants.total ?? 0}
          subtitle={`${stats?.tenants.new_this_month ?? 0} nouvelles ce mois`}
          icon={Building2}
          color="indigo"
          trend={
            stats
              ? {
                  value: stats.tenants.new_this_month,
                  label: 'ce mois',
                }
              : undefined
          }
          loading={isLoading}
        />
        <StatsCard
          title="Écoles actives / en essai"
          value={`${stats?.tenants.active ?? 0} / ${stats?.tenants.trial ?? 0}`}
          subtitle={`${stats?.tenants.suspended ?? 0} suspendue(s)`}
          icon={Activity}
          color="green"
          loading={isLoading}
        />
        <StatsCard
          title="Revenus mensuels estimés"
          value={stats ? formatCurrency(stats.revenue.monthly_arr) : '—'}
          subtitle="ARR basé sur abonnements actifs"
          icon={DollarSign}
          color="violet"
          loading={isLoading}
        />
        <StatsCard
          title="Tickets support ouverts"
          value={openTickets}
          subtitle="En attente de traitement"
          icon={Ticket}
          color={openTickets > 5 ? 'red' : 'amber'}
          loading={isLoading}
        />
      </div>

      {/* ── Main content grid ── */}
      <div className="grid gap-6 xl:grid-cols-3">
        {/* Left column: 2/3 */}
        <div className="xl:col-span-2 space-y-6">
          {/* ── Essais expirant bientôt ── */}
          {(stats?.revenue.trials_expiring_soon.length ?? 0) > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
              <div className="mb-3 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <h3 className="font-semibold text-amber-900">
                  Essais expirant bientôt
                </h3>
                <span className="ml-auto text-xs text-amber-700">
                  {stats?.revenue.trials_expiring_soon.length} école(s)
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-amber-200 text-xs text-amber-700">
                      <th className="py-2 text-left font-medium">École</th>
                      <th className="py-2 text-center font-medium">Jours restants</th>
                      <th className="py-2 text-right font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-100">
                    {stats?.revenue.trials_expiring_soon.map((item) => (
                      <tr key={item.tenant.id}>
                        <td className="py-2.5">
                          <div>
                            <p className="font-medium text-slate-900">
                              {item.tenant.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {item.tenant.slug}
                            </p>
                          </div>
                        </td>
                        <td className="py-2.5 text-center">
                          <span
                            className={`inline-flex items-center justify-center rounded-full px-2.5 py-1 text-xs font-bold ${
                              (item.days_left ?? 99) <= 3
                                ? 'bg-red-100 text-red-700'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {item.days_left ?? '?'}j
                          </span>
                        </td>
                        <td className="py-2.5 text-right">
                          <Link
                            to={`/admin/tenants/${item.tenant.id}`}
                            className="text-xs font-medium text-indigo-600 hover:underline"
                          >
                            Convertir →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Dernières écoles ── */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h3 className="font-semibold text-slate-900">
                Dernières écoles inscrites
              </h3>
              <Link
                to="/admin/tenants"
                className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline"
              >
                Voir toutes <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            {isLoading ? (
              <div className="p-5 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-10 animate-pulse rounded bg-slate-100" />
                ))}
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {(stats?.recent_tenants ?? []).slice(0, 5).map((tenant) => (
                  <Link
                    key={tenant.id}
                    to={`/admin/tenants/${tenant.id}`}
                    className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                      {tenant.name[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {tenant.name}
                      </p>
                      <p className="text-xs text-slate-400">{tenant.slug}</p>
                    </div>
                    <SchoolTypeBadges
                      has_maternelle={tenant.has_maternelle}
                      has_primary={tenant.has_primary}
                      has_college={tenant.has_college}
                      has_lycee={tenant.has_lycee}
                      size="sm"
                    />
                    <TenantStatusBadge status={tenant.status} size="sm" />
                    <span className="shrink-0 text-xs text-slate-400">
                      {formatDate(tenant.created_at)}
                    </span>
                  </Link>
                ))}
                {(stats?.recent_tenants ?? []).length === 0 && (
                  <p className="px-5 py-8 text-center text-sm text-slate-400">
                    Aucune école enregistrée
                  </p>
                )}
              </div>
            )}
          </div>

          {/* ── Bar chart: nouvelles inscriptions ── */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-indigo-500" />
              <h3 className="font-semibold text-slate-900">
                Nouvelles inscriptions
              </h3>
              <span className="ml-1 text-xs text-slate-400">6 derniers mois</span>
              {hasPlaceholderChart && (
                <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">
                  Données en exemple
                </span>
              )}
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                  }}
                  formatter={(value) => [value, 'Inscriptions']}
                />
                <Bar
                  dataKey="count"
                  fill="#6366f1"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right column: 1/3 */}
        <div className="xl:col-span-1 space-y-6">
          {/* ── Activité récente ── */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h3 className="font-semibold text-slate-900">Activité récente</h3>
              <Link
                to="/admin/activity"
                className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline"
              >
                Tout voir <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            {isLoading ? (
              <div className="p-4 space-y-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-10 animate-pulse rounded bg-slate-100" />
                ))}
              </div>
            ) : (
              <div className="divide-y divide-slate-50 max-h-[480px] overflow-y-auto">
                {(stats?.recent_activity ?? []).slice(0, 10).map((log) => (
                  <div key={log.id} className="flex items-start gap-3 px-4 py-3">
                    <div
                      className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                        ACTIVITY_ICON_COLOR[log.activity_type ?? ''] ??
                        'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {(log.activity_label ?? log.activity_type ?? 'A')
                        .slice(0, 1)
                        .toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-slate-700 leading-relaxed">
                        <span className="font-medium">{log.actor_name ?? 'Système'}</span>
                        {' · '}
                        {log.description}
                      </p>
                      {log.tenant_name && (
                        <p className="mt-0.5 text-[11px] text-slate-400">
                          {log.tenant_name}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 text-[10px] text-slate-400 whitespace-nowrap">
                      {timeAgo(log.created_at)}
                    </span>
                  </div>
                ))}
                {(stats?.recent_activity ?? []).length === 0 && (
                  <p className="px-4 py-8 text-center text-sm text-slate-400">
                    Aucune activité récente
                  </p>
                )}
              </div>
            )}
          </div>

          {/* ── Modules les plus utilisés ── */}
          {(stats?.modules.most_used.length ?? 0) > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 font-semibold text-slate-900">
                Modules populaires
              </h3>
              <div className="space-y-3">
                {stats?.modules.most_used.slice(0, 5).map((m) => {
                  const max =
                    stats.modules.most_used[0]?.tenants_count ?? 1
                  const pct = Math.round((m.tenants_count / max) * 100)
                  return (
                    <div key={m.module}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-700 capitalize">
                          {m.module.replace(/_/g, ' ')}
                        </span>
                        <span className="text-slate-400">
                          {m.tenants_count} écoles
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-indigo-500 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
