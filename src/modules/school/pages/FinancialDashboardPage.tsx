// ===== src/modules/school/pages/FinancialDashboardPage.tsx =====

import { useState } from 'react';
import { AlertCircle, TrendingUp, Wallet } from 'lucide-react';
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { useAcademicYears } from '../hooks/useAcademicYears';
import { useFinancialDashboard } from '../hooks/useDashboard';
import { DashboardRefreshInfo } from '../components/DashboardRefreshInfo';
import { DashboardSkeleton } from '../components/DashboardSkeleton';
import { EmptyDashboard } from '../components/EmptyDashboard';
import { KpiCard } from '../components/KpiCard';
import { MonthlyRevenueChart } from '../components/MonthlyRevenueChart';
import { ProgressRing } from '../components/ProgressRing';
import { getCollectionRateColor, PIE_COLORS } from '../lib/dashboardHelpers';

export function FinancialDashboardPage() {
  const { data: years = [] } = useAcademicYears();
  const currentYear = years.find((y) => y.is_current) ?? years[0];
  const [yearId, setYearId] = useState<number>(currentYear?.id ?? 0);

  const { data, isLoading, isFetching, refetch, error } = useFinancialDashboard(yearId);

  if (isLoading) return <DashboardSkeleton />;
  if (error || !data) return <EmptyDashboard message="Impossible de charger les données financières." />;

  const collectionColor = getCollectionRateColor(data.summary.collection_rate);

  const feeTypeChart = data.by_fee_type.map((ft) => ({
    name: ft.fee_type.name,
    Attendu: ft.expected,
    Collecté: ft.collected,
    rate: ft.rate,
  }));

  const methodChart = data.by_method.map((m, i) => ({
    name: m.method === 'cash' ? 'Espèces' : m.method === 'bank_transfer' ? 'Virement' : m.method,
    value: m.amount,
    fill: PIE_COLORS[i % PIE_COLORS.length],
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Financier</h1>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            value={yearId}
            onChange={(e) => setYearId(Number(e.target.value))}
          >
            {years.map((y) => (
              <option key={y.id} value={y.id}>{y.name}</option>
            ))}
          </select>
          <DashboardRefreshInfo
            generatedAt={data.generated_at}
            onRefresh={() => refetch()}
            isRefreshing={isFetching}
          />
        </div>
      </div>

      {/* ROW 1 — KPIs + barre progression */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="col-span-1 grid grid-cols-2 gap-4 md:col-span-2">
          <KpiCard
            title="Total attendu"
            value={data.summary.total_expected_formatted}
            icon={<Wallet className="h-5 w-5" />}
            color="#6b7280"
          />
          <KpiCard
            title="Collecté"
            value={data.summary.total_collected_formatted}
            icon={<TrendingUp className="h-5 w-5" />}
            color="#16a34a"
          />
          <KpiCard
            title="Restant"
            value={data.summary.total_remaining_formatted}
            icon={<AlertCircle className="h-5 w-5" />}
            color="#dc2626"
          />
          <KpiCard
            title="Frais en retard"
            value={data.by_status['overdue']?.count ?? 0}
            icon={<AlertCircle className="h-5 w-5" />}
            color="#d97706"
          />
        </div>
        <div className="flex items-center justify-center rounded-xl border border-gray-200 bg-white p-5">
          <div className="text-center">
            <ProgressRing
              percentage={data.summary.collection_rate}
              size={100}
              color={collectionColor}
            />
            <p className="mt-2 text-sm font-medium text-gray-700">Taux de recouvrement</p>
          </div>
        </div>
      </div>

      {/* ROW 2 — Graphiques */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="mb-4 text-sm font-semibold text-gray-700">Recouvrement par type de frais</h3>
          {feeTypeChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={feeTypeChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => [`${v.toLocaleString('fr-FR')} FCFA`, '']} />
                <Legend />
                <Bar dataKey="Attendu"  fill="#e5e7eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Collecté" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-8 text-center text-sm text-gray-400">Aucune donnée</p>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="mb-4 text-sm font-semibold text-gray-700">Répartition par mode de paiement</h3>
          {methodChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={methodChart}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {methodChart.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => [`${v.toLocaleString('fr-FR')} FCFA`, '']} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-8 text-center text-sm text-gray-400">Aucun paiement enregistré</p>
          )}
        </div>
      </div>

      {/* ROW 3 — Tendance mensuelle */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="mb-4 text-sm font-semibold text-gray-700">
          Encaissements des 6 derniers mois
        </h3>
        <MonthlyRevenueChart data={data.monthly_trend} />
      </div>

      {/* ROW 4 — Par niveau */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="mb-4 text-sm font-semibold text-gray-700">Recouvrement par niveau</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs font-medium uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3 text-left">Niveau</th>
                <th className="px-4 py-3 text-right">Attendu</th>
                <th className="px-4 py-3 text-right">Collecté</th>
                <th className="px-4 py-3 text-right">Taux</th>
                <th className="px-4 py-3">Progression</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.by_level.map((level) => (
                <tr key={level.level}>
                  <td className="px-4 py-3 font-medium">{level.level}</td>
                  <td className="px-4 py-3 text-right text-gray-600">
                    {level.expected.toLocaleString('fr-FR')} FCFA
                  </td>
                  <td className="px-4 py-3 text-right text-green-700 font-semibold">
                    {level.collected.toLocaleString('fr-FR')} FCFA
                  </td>
                  <td className="px-4 py-3 text-right font-semibold" style={{ color: getCollectionRateColor(level.rate) }}>
                    {level.rate}%
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-2 w-full rounded-full bg-gray-200">
                      <div
                        className="h-2 rounded-full"
                        style={{ width: `${level.rate}%`, backgroundColor: getCollectionRateColor(level.rate) }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ROW 5 — Élèves en retard */}
      {data.overdue_students.length > 0 && (
        <div className="rounded-xl border border-amber-100 bg-white p-5">
          <h3 className="mb-4 text-sm font-semibold text-amber-700">
            Top 10 — Élèves avec frais en retard
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead>
                <tr className="bg-amber-50 text-xs font-medium uppercase tracking-wide text-amber-700">
                  <th className="px-4 py-3 text-left">Élève</th>
                  <th className="px-4 py-3 text-left">Classe</th>
                  <th className="px-4 py-3 text-right">Montant restant</th>
                  <th className="px-4 py-3 text-right">Jours retard</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.overdue_students.map((s, i) => (
                  <tr key={i} className="hover:bg-amber-50">
                    <td className="px-4 py-3">
                      <div className="font-medium">{s.student.full_name}</div>
                      <div className="text-xs text-gray-400">{s.student.matricule}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{s.classe}</td>
                    <td className="px-4 py-3 text-right font-semibold text-red-600">
                      {s.amount_remaining_formatted}
                    </td>
                    <td className="px-4 py-3 text-right text-amber-700 font-semibold">
                      {s.days_overdue}j
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
