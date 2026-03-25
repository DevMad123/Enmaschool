// ===== src/modules/school/pages/DirectionDashboardPage.tsx =====

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  GraduationCap,
  ShieldCheck,
  Trash2,
  UserCheck,
  Users,
  Wallet,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAuthStore } from '@/modules/auth/store/authStore';
import { useAcademicYears } from '../hooks/useAcademicYears';
import { useDirectionDashboard, useInvalidateDashboardCache } from '../hooks/useDashboard';
import { DashboardRefreshInfo } from '../components/DashboardRefreshInfo';
import { DashboardSkeleton } from '../components/DashboardSkeleton';
import { EmptyDashboard } from '../components/EmptyDashboard';
import { KpiCard } from '../components/KpiCard';
import { CHART_COLORS, GENDER_COLORS, PIE_COLORS } from '../lib/dashboardHelpers';

export function DirectionDashboardPage() {
  const { data: yearsData } = useAcademicYears();
  const years = yearsData?.data ?? [];
  const currentYear = years.find((y) => y.is_current) ?? years[0];
  const [yearId, setYearId] = useState<number>(currentYear?.id ?? 0);

  const { data, isLoading, isFetching, refetch, error } = useDirectionDashboard(yearId);
  const invalidate = useInvalidateDashboardCache();
  const roles = useAuthStore((s) => s.roles);
  const isAdmin = roles.includes('school_admin');
  const navigate = useNavigate();

  if (isLoading) return <DashboardSkeleton />;
  if (error || !data) return <EmptyDashboard message="Impossible de charger le tableau de bord." />;

  // PieChart : élèves par catégorie
  const categoryData = Object.entries(data.students.by_category).map(([name, value], i) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    fill: PIE_COLORS[i % PIE_COLORS.length],
  }));

  // BarChart : genre par catégorie
  const genderData = categoryData.map((c) => ({
    name: c.name,
    Garçons: Math.round(c.value * (data.students.by_gender.male / (data.students.total || 1))),
    Filles:  Math.round(c.value * (data.students.by_gender.female / (data.students.total || 1))),
  }));

  const attendanceColor =
    data.attendance.week_rate >= 80 ? '#16a34a' : data.attendance.week_rate >= 60 ? '#d97706' : '#dc2626';
  const collectionColor =
    data.finance.collection_rate >= 75 ? '#16a34a' : data.finance.collection_rate >= 50 ? '#d97706' : '#dc2626';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Tableau de bord — {data.school.name}
          </h1>
          <p className="text-sm text-gray-500">{data.school.academic_year_name}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={yearId}
            onChange={(e) => setYearId(Number(e.target.value))}
          >
            {years.map((y) => (
              <option key={y.id} value={y.id}>{y.name}</option>
            ))}
          </select>
          <DashboardRefreshInfo
            generatedAt={data.generated_at}
            cacheTtl={data.cache_ttl}
            onRefresh={() => refetch()}
            isRefreshing={isFetching}
          />
          {isAdmin && (
            <button
              onClick={() => invalidate.mutate()}
              disabled={invalidate.isPending}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Vider le cache
            </button>
          )}
        </div>
      </div>

      {/* ROW 1 — KPIs */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard
          title="Élèves inscrits"
          value={data.students.total}
          trend={data.students.trend}
          trendLabel="vs mois préc."
          icon={<GraduationCap className="h-5 w-5" />}
          color={CHART_COLORS.primary}
          href="/school/students"
        />
        <KpiCard
          title="Enseignants actifs"
          value={data.staff.teachers}
          icon={<Users className="h-5 w-5" />}
          color={CHART_COLORS.purple}
          href="/school/teachers"
        />
        <KpiCard
          title="Présence semaine"
          value={`${data.attendance.week_rate}%`}
          icon={<UserCheck className="h-5 w-5" />}
          color={attendanceColor}
          href="/school/dashboard/attendance"
        />
        <KpiCard
          title="Recouvrement"
          value={`${data.finance.collection_rate}%`}
          icon={<Wallet className="h-5 w-5" />}
          color={collectionColor}
          href="/school/dashboard/financial"
        />
      </div>

      {/* ROW 2 — Graphiques */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="mb-4 text-sm font-semibold text-gray-700">Répartition par niveau</h3>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {categoryData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => [v, 'Élèves']} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">Aucune donnée</p>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="mb-4 text-sm font-semibold text-gray-700">Répartition par genre et niveau</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={genderData}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Garçons" fill={GENDER_COLORS.male} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Filles"  fill={GENDER_COLORS.female} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ROW 3 — État académique et Bulletins */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="mb-4 text-sm font-semibold text-gray-700">État académique</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Classes actives</span>
              <span className="font-semibold">{data.academic.classes_count}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Matières</span>
              <span className="font-semibold">{data.academic.subjects_count}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Période courante</span>
              <span className="font-semibold">{data.academic.current_period?.name ?? '—'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Périodes clôturées</span>
              <span className="font-semibold">
                {data.academic.periods_closed} / {data.academic.periods_total}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Élèves à risque (absences)</span>
              <span className={`font-semibold ${data.attendance.at_risk_students > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {data.attendance.at_risk_students}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="mb-4 text-sm font-semibold text-gray-700">État des bulletins</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total bulletins</span>
              <span className="font-semibold">{data.bulletins.total}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Publiés</span>
              <span className="font-semibold text-green-600">{data.bulletins.published}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">En attente</span>
              <span className="font-semibold text-amber-600">{data.bulletins.pending}</span>
            </div>
            {data.bulletins.total > 0 && (
              <div className="mt-2">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Progression</span>
                  <span>{Math.round(data.bulletins.published / data.bulletins.total * 100)}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-200">
                  <div
                    className="h-2 rounded-full bg-green-500"
                    style={{ width: `${data.bulletins.total > 0 ? data.bulletins.published / data.bulletins.total * 100 : 0}%` }}
                  />
                </div>
              </div>
            )}
          </div>
          <button
            className="mt-4 text-xs text-blue-600 hover:underline"
            onClick={() => navigate('/school/report-cards')}
          >
            Voir les bulletins →
          </button>
        </div>
      </div>

      {/* ROW 4 — Finance */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="mb-4 text-sm font-semibold text-gray-700">Situation financière</h3>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div>
            <p className="text-xs text-gray-500">Collecté</p>
            <p className="text-lg font-bold text-green-600">{data.finance.total_collected_formatted}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Restant</p>
            <p className="text-lg font-bold text-red-600">{data.finance.total_remaining_formatted}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Frais en retard</p>
            <p className="text-lg font-bold text-amber-600">{data.finance.overdue_count}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Taux recouvrement</p>
            <p className="text-lg font-bold" style={{ color: collectionColor }}>
              {data.finance.collection_rate}%
            </p>
          </div>
        </div>
        <button
          className="mt-3 text-xs text-blue-600 hover:underline"
          onClick={() => navigate('/school/dashboard/financial')}
        >
          Voir le tableau de bord financier →
        </button>
      </div>
    </div>
  );
}
