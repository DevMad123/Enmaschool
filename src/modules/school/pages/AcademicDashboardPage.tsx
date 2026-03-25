// ===== src/modules/school/pages/AcademicDashboardPage.tsx =====

import { useState } from 'react';
import { BookOpen, ClipboardList, GraduationCap, TrendingUp } from 'lucide-react';
import { useAcademicYears, useAcademicYearPeriods } from '../hooks/useAcademicYears';
import { useAcademicDashboard } from '../hooks/useDashboard';
import { DashboardRefreshInfo } from '../components/DashboardRefreshInfo';
import { DashboardSkeleton } from '../components/DashboardSkeleton';
import { EmptyDashboard } from '../components/EmptyDashboard';
import { GradeDistributionChart } from '../components/GradeDistributionChart';
import { KpiCard } from '../components/KpiCard';
import { PassingRateChart } from '../components/PassingRateChart';

export function AcademicDashboardPage() {
  const { data: years = [] } = useAcademicYears();
  const currentYear = years.find((y) => y.is_current) ?? years[0];
  const [yearId, setYearId] = useState<number>(currentYear?.id ?? 0);
  const [periodId, setPeriodId] = useState<number | undefined>();

  const { data, isLoading, isFetching, refetch, error } = useAcademicDashboard(yearId, periodId);
  const { data: periodsData = [] } = useAcademicYearPeriods(yearId);
  const periods = periodsData as Array<{ id: number; name: string }>;

  if (isLoading) return <DashboardSkeleton />;
  if (error || !data) return <EmptyDashboard message="Impossible de charger les données académiques." />;

  const bySubjectChart = data.by_subject.map((s) => ({
    name: s.subject.name,
    rate: s.passing_rate,
    avg: s.avg ?? 0,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Académique</h1>
          {data.period && <p className="text-sm text-gray-500">Période : {data.period.name}</p>}
        </div>
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
          <select
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            value={periodId ?? ''}
            onChange={(e) => setPeriodId(e.target.value ? Number(e.target.value) : undefined)}
          >
            <option value="">Toutes les périodes</option>
            {periods.map((p: { id: number; name: string }) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <DashboardRefreshInfo
            generatedAt={data.generated_at}
            onRefresh={() => refetch()}
            isRefreshing={isFetching}
          />
        </div>
      </div>

      {/* ROW 1 — KPIs */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard
          title="Moyenne générale"
          value={data.overall.avg_general !== null ? data.overall.avg_general.toFixed(2) : '—'}
          unit="/20"
          icon={<TrendingUp className="h-5 w-5" />}
          color="#2563eb"
        />
        <KpiCard
          title="Taux de réussite"
          value={`${data.overall.passing_rate}%`}
          icon={<GraduationCap className="h-5 w-5" />}
          color={data.overall.passing_rate >= 60 ? '#16a34a' : '#dc2626'}
        />
        <KpiCard
          title="Évaluations"
          value={data.evaluations_this_period}
          icon={<ClipboardList className="h-5 w-5" />}
          color="#7c3aed"
        />
        <KpiCard
          title="Meilleure classe"
          value={data.overall.top_classe?.display_name ?? '—'}
          subtitle={data.overall.top_classe ? `Moy. ${data.overall.top_classe.average.toFixed(2)}` : undefined}
          icon={<BookOpen className="h-5 w-5" />}
          color="#16a34a"
        />
      </div>

      {/* ROW 2 — Distribution */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="mb-4 text-sm font-semibold text-gray-700">Distribution des moyennes générales</h3>
        {Object.values(data.grade_distribution).some((v) => v > 0) ? (
          <GradeDistributionChart distribution={data.grade_distribution} />
        ) : (
          <p className="py-8 text-center text-sm text-gray-400">Aucune note saisie pour cette période.</p>
        )}
      </div>

      {/* ROW 3 — Tableau par classe */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="mb-4 text-sm font-semibold text-gray-700">Résultats par classe</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3">Classe</th>
                <th className="px-4 py-3 text-right">Effectif</th>
                <th className="px-4 py-3 text-right">Moy. Gén.</th>
                <th className="px-4 py-3 text-right">Taux réussite</th>
                <th className="px-4 py-3">Meilleure matière</th>
                <th className="px-4 py-3">Matière faible</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.by_classe.map((c) => (
                <tr key={c.classe.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{c.classe.display_name}</td>
                  <td className="px-4 py-3 text-right">{c.students_count}</td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {c.avg_general !== null ? c.avg_general.toFixed(2) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className="inline-block rounded-full px-2 py-0.5 text-xs font-medium"
                      style={{
                        background: c.passing_rate >= 60 ? '#dcfce7' : '#fee2e2',
                        color: c.passing_rate >= 60 ? '#16a34a' : '#dc2626',
                      }}
                    >
                      {c.passing_rate}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-green-700">
                    {c.best_subject ? `${c.best_subject.name} (${c.best_subject.average.toFixed(2)})` : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-red-600">
                    {c.worst_subject ? `${c.worst_subject.name} (${c.worst_subject.average.toFixed(2)})` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.by_classe.length === 0 && (
            <p className="py-8 text-center text-sm text-gray-400">Aucune donnée disponible.</p>
          )}
        </div>
      </div>

      {/* ROW 4 — Par matière */}
      {bySubjectChart.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="mb-4 text-sm font-semibold text-gray-700">Taux de réussite par matière</h3>
          <PassingRateChart data={bySubjectChart} type="by_subject" />
        </div>
      )}
    </div>
  );
}
