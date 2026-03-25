import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Wallet, Users, BarChart2, Settings, AlertTriangle, ArrowRight } from 'lucide-react'
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner'
import { AmountDisplay } from '../components/AmountDisplay'
import { CollectionRateBar } from '../components/CollectionRateBar'
import { FeeStatusBadge } from '../components/FeeStatusBadge'
import { usePaymentYearStats } from '../hooks/usePayments'
import { useAcademicYears } from '../hooks/useAcademicYears'

const TABS = [
  { key: 'dashboard',   label: 'Paiements',    icon: Wallet },
  { key: 'students',    label: 'Élèves',        icon: Users },
  { key: 'stats',       label: 'Statistiques',  icon: BarChart2 },
  { key: 'config',      label: 'Configuration', icon: Settings },
] as const

type Tab = typeof TABS[number]['key']

export function PaymentsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Frais scolaires</h1>
        <p className="mt-1 text-sm text-gray-500">Gérez les frais, paiements et statistiques de recouvrement.</p>
      </div>

      {/* Onglets */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-6">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => {
                if (key === 'config') {
                  window.location.href = '/school/payments/config'
                } else {
                  setActiveTab(key)
                }
              }}
              className={`flex items-center gap-2 border-b-2 pb-3 text-sm font-medium transition-colors ${
                activeTab === key
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'dashboard' && <DashboardTab />}
      {activeTab === 'students'  && <StudentsTab />}
      {activeTab === 'stats'     && <StatsTab />}
    </div>
  )
}

// ── Dashboard ────────────────────────────────────────────────────────────────

function DashboardTab() {
  const { data: yearsData } = useAcademicYears()
  const years: Array<{ id: number; is_current: boolean; name: string }> = yearsData?.data ?? []
  const currentYear = years.find((y) => y.is_current)
  const yearId = currentYear?.id ?? 0

  const { data: stats, isLoading } = usePaymentYearStats(yearId)

  if (isLoading) return <LoadingSpinner />
  if (!stats) return <p className="text-center text-gray-400">Aucune donnée disponible.</p>

  return (
    <div className="space-y-6">
      {/* Stats rapides */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total attendu" value={stats.total_expected} color="gray" />
        <StatCard label="Collecté" value={stats.total_collected} color="#2563eb" />
        <StatCard label="Reste à payer" value={stats.total_remaining} color="#dc2626" />
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Taux de collecte</p>
          <p className={`mt-1 text-2xl font-bold ${stats.collection_rate >= 80 ? 'text-green-600' : stats.collection_rate >= 50 ? 'text-orange-500' : 'text-red-600'}`}>
            {stats.collection_rate.toFixed(1)}%
          </p>
          <CollectionRateBar rate={stats.collection_rate} collected={stats.total_collected} expected={stats.total_expected} />
        </div>
      </div>

      {/* Statuts */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-semibold text-gray-900">Répartition par statut</h2>
        <div className="flex flex-wrap gap-4">
          {Object.entries(stats.by_status).map(([status, count]) => (
            <div key={status} className="flex items-center gap-2">
              <FeeStatusBadge status={status as any} />
              <span className="text-sm font-semibold text-gray-800">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Par type de frais */}
      {stats.by_fee_type.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold text-gray-900">Par type de frais</h2>
          <div className="space-y-4">
            {stats.by_fee_type.map((item, i) => (
              <div key={i}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-medium text-gray-700">{item.fee_type_name}</span>
                  <span className="text-gray-500">{item.rate.toFixed(0)}%</span>
                </div>
                <CollectionRateBar rate={item.rate} collected={item.collected} expected={item.expected} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <AmountDisplay amount={value} size="lg" color={color === 'gray' ? undefined : color} className="mt-1 block" />
    </div>
  )
}

// ── Élèves ───────────────────────────────────────────────────────────────────

function StudentsTab() {
  const { data: yearsData } = useAcademicYears()
  const years: Array<{ id: number; is_current: boolean; name: string }> = yearsData?.data ?? []
  const currentYear = years.find((y) => y.is_current)
  const yearId = currentYear?.id ?? 0

  const { data: stats } = usePaymentYearStats(yearId)
  const overdueCount = stats?.by_status?.overdue ?? 0

  return (
    <div className="space-y-4">
      {overdueCount > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <span>{overdueCount} élève(s) avec des frais en retard.</span>
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-400">
        <Users className="mx-auto mb-3 h-8 w-8 text-gray-300" />
        <p className="text-sm">Recherchez un élève dans la liste des élèves pour accéder à son dossier de paiement.</p>
        <Link
          to="/school/students"
          className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:underline"
        >
          Voir la liste des élèves <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}

// ── Stats ────────────────────────────────────────────────────────────────────

function StatsTab() {
  return (
    <Link to="/school/payments/report" className="block">
      <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-6 text-center text-indigo-700 hover:bg-indigo-100 transition-colors">
        <BarChart2 className="mx-auto mb-2 h-8 w-8" />
        <p className="font-medium">Voir le rapport journalier</p>
        <p className="mt-1 text-sm text-indigo-500">Rapport détaillé des encaissements par jour.</p>
      </div>
    </Link>
  )
}
