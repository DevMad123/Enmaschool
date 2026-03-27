// ===== src/modules/school/pages/AttendanceDashboardPage.tsx =====

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ClipboardCheck, Clock, UserCheck } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useAcademicYears } from '../hooks/useAcademicYears';
import { useAttendanceDashboard } from '../hooks/useDashboard';
import { AttendanceTrendChart } from '../components/AttendanceTrendChart';
import { DashboardRefreshInfo } from '../components/DashboardRefreshInfo';
import { DashboardSkeleton } from '../components/DashboardSkeleton';
import { EmptyDashboard } from '../components/EmptyDashboard';
import { KpiCard } from '../components/KpiCard';

export function AttendanceDashboardPage() {
  const { data: yearsData, isLoading: yearsLoading } = useAcademicYears();
  const years = yearsData?.data ?? [];
  const currentYear = years.find((y) => y.is_current) ?? years[0];
  const [yearId, setYearId] = useState<number>(0);
  useEffect(() => { if (currentYear?.id && !yearId) setYearId(currentYear.id); }, [currentYear?.id, yearId]);
  const [periodId, setPeriodId] = useState<number | undefined>();

  const { data, isLoading, isFetching, refetch, error } = useAttendanceDashboard(yearId, periodId);
  const navigate = useNavigate();

  if (yearsLoading || !yearId || isLoading) return <DashboardSkeleton />;
  if (error || !data) return <EmptyDashboard message="Impossible de charger les données de présence." />;

  const byClassChart = data.by_class.map((c) => ({
    name: c.classe.display_name,
    rate: c.attendance_rate,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Présences</h1>
          <p className="text-sm text-gray-500">Aujourd'hui : {data.today.date}</p>
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
          title="Taux aujourd'hui"
          value={data.today.overall_rate !== null ? `${data.today.overall_rate}%` : '—'}
          subtitle={`${data.today.classes_with_record}/${data.today.classes_total} classes saisies`}
          icon={<UserCheck className="h-5 w-5" />}
          color="#2563eb"
        />
        <KpiCard
          title="Taux période"
          value={`${data.period.avg_rate}%`}
          icon={<ClipboardCheck className="h-5 w-5" />}
          color={data.period.avg_rate >= 80 ? '#16a34a' : '#d97706'}
        />
        <KpiCard
          title="Élèves à risque"
          value={data.at_risk_students.length}
          icon={<AlertTriangle className="h-5 w-5" />}
          color="#dc2626"
        />
        <KpiCard
          title="Justif. en attente"
          value={data.justifications.pending}
          icon={<Clock className="h-5 w-5" />}
          color="#d97706"
          href="/school/attendance/justifications"
        />
      </div>

      {/* ROW 2 — Tendance 30 jours */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="mb-4 text-sm font-semibold text-gray-700">
          Évolution du taux de présence (30 derniers jours)
        </h3>
        <AttendanceTrendChart data={data.by_day} />
      </div>

      {/* ROW 3 — Par classe */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="mb-4 text-sm font-semibold text-gray-700">Présences du jour par classe</h3>
          {byClassChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byClassChart} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} unit="%" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                <Tooltip formatter={(v: number) => [`${v}%`, 'Taux']} />
                <Bar dataKey="rate" fill="#2563eb" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-8 text-center text-sm text-gray-400">Aucune donnée</p>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="mb-4 text-sm font-semibold text-gray-700">Résumé du jour</h3>
          <div className="space-y-3">
            {[
              { label: 'Présents', value: data.today.present, color: 'text-green-600' },
              { label: 'Absents', value: data.today.absent, color: 'text-red-600' },
              { label: 'En retard', value: data.today.late, color: 'text-amber-600' },
              { label: 'Excusés', value: data.today.excused, color: 'text-blue-600' },
              { label: 'Total enregistrements', value: data.today.total, color: 'text-gray-700' },
            ].map((item) => (
              <div key={item.label} className="flex justify-between text-sm">
                <span className="text-gray-500">{item.label}</span>
                <span className={`font-semibold ${item.color}`}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ROW 4 — Élèves à risque */}
      {data.at_risk_students.length > 0 && (
        <div className="rounded-xl border border-red-100 bg-white p-5">
          <h3 className="mb-4 text-sm font-semibold text-red-700">
            Élèves à risque ({data.at_risk_students.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead>
                <tr className="bg-red-50 text-left text-xs font-medium uppercase tracking-wide text-red-600">
                  <th className="px-4 py-3">Élève</th>
                  <th className="px-4 py-3">Classe</th>
                  <th className="px-4 py-3 text-right">Taux présence</th>
                  <th className="px-4 py-3 text-right">Heures absence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.at_risk_students.map((s, i) => (
                  <tr key={i} className="hover:bg-red-50">
                    <td className="px-4 py-3">
                      <div className="font-medium">{s.student.full_name}</div>
                      <div className="text-xs text-gray-400">{s.student.matricule}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{s.classe}</td>
                    <td className="px-4 py-3 text-right font-semibold text-red-600">
                      {s.attendance_rate}%
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">{s.absent_hours}h</td>
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
