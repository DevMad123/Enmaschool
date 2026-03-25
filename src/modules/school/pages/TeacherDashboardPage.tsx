// ===== src/modules/school/pages/TeacherDashboardPage.tsx =====

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, BookOpen, Clock, Users } from 'lucide-react';
import { useAcademicYears } from '../hooks/useAcademicYears';
import { useTeacherDashboard } from '../hooks/useDashboard';
import { DashboardRefreshInfo } from '../components/DashboardRefreshInfo';
import { DashboardSkeleton } from '../components/DashboardSkeleton';
import { EmptyDashboard } from '../components/EmptyDashboard';
import { KpiCard } from '../components/KpiCard';
import { ProgressRing } from '../components/ProgressRing';

export function TeacherDashboardPage() {
  const { data: yearsData } = useAcademicYears();
  const years = yearsData?.data ?? [];
  const currentYear = years.find((y) => y.is_current) ?? years[0];
  const [yearId, setYearId] = useState<number>(currentYear?.id ?? 0);

  const { data, isLoading, isFetching, refetch, error } = useTeacherDashboard(yearId);
  const navigate = useNavigate();

  if (isLoading) return <DashboardSkeleton />;
  if (error || !data) return <EmptyDashboard message="Impossible de charger votre tableau de bord." />;

  const hoursPercent = data.teacher.max_hours > 0
    ? Math.round(data.teacher.weekly_hours / data.teacher.max_hours * 100)
    : 0;

  const hasPendingActions =
    data.pending_actions.evaluations_to_lock > 0 || data.pending_actions.absences_to_record > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mon Tableau de bord</h1>
          <p className="text-sm text-gray-500">{data.teacher.full_name}</p>
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
        <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-5">
          <ProgressRing
            percentage={hoursPercent}
            size={60}
            color={hoursPercent >= 90 ? '#dc2626' : '#2563eb'}
          />
          <div>
            <p className="text-xs text-gray-500">Charge horaire</p>
            <p className="text-lg font-bold text-gray-900">{data.teacher.weekly_hours}h</p>
            <p className="text-xs text-gray-400">/ {data.teacher.max_hours}h max</p>
          </div>
        </div>
        <KpiCard
          title="Mes classes"
          value={data.classes.length}
          icon={<Users className="h-5 w-5" />}
          color="#7c3aed"
        />
        <KpiCard
          title="Actions en attente"
          value={data.pending_actions.evaluations_to_lock + data.pending_actions.absences_to_record}
          icon={<AlertTriangle className="h-5 w-5" />}
          color={hasPendingActions ? '#dc2626' : '#16a34a'}
        />
        <KpiCard
          title="Cours cette semaine"
          value={data.this_week.courses_count}
          subtitle={`${data.this_week.total_hours}h au total`}
          icon={<Clock className="h-5 w-5" />}
          color="#0891b2"
        />
      </div>

      {/* ROW 2 — Emploi du temps semaine */}
      {data.this_week.schedule.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="mb-4 text-sm font-semibold text-gray-700">Planning de la semaine</h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {data.this_week.schedule.map((slot, i) => (
              <div
                key={i}
                className={`rounded-lg border px-3 py-2 ${
                  slot.is_cancelled
                    ? 'border-red-200 bg-red-50 opacity-60'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-700">{slot.day_label}</span>
                  <span className="text-xs text-gray-400">{slot.time_range}</span>
                </div>
                <p className="mt-1 text-sm font-medium text-gray-900">{slot.subject}</p>
                <p className="text-xs text-gray-500">{slot.classe}</p>
                {slot.room && <p className="text-xs text-gray-400">Salle : {slot.room}</p>}
                {slot.is_cancelled && (
                  <span className="mt-1 inline-block text-xs text-red-600 font-medium">Annulé</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ROW 3 — Mes classes */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="mb-4 text-sm font-semibold text-gray-700">Mes classes</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.classes.map((c) => (
            <div
              key={c.classe.id}
              className="rounded-lg border border-gray-200 bg-gray-50 p-4 hover:border-blue-200 hover:bg-blue-50 cursor-pointer"
              onClick={() => navigate(`/school/classes/${c.classe.id}`)}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{c.classe.display_name}</p>
                  <p className="text-xs text-gray-500">{c.subject.name}</p>
                </div>
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: c.subject.color }}
                />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">{c.students_count} élèves</span>
                  <span className="text-gray-500">{c.evaluations_count} évals.</span>
                </div>
                {c.avg_general !== null && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Moy.</span>
                    <span className="font-semibold text-gray-700">{c.avg_general.toFixed(2)}/20</span>
                  </div>
                )}
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Présence</span>
                  <span className={`font-semibold ${c.attendance_rate >= 80 ? 'text-green-600' : 'text-amber-600'}`}>
                    {c.attendance_rate}%
                  </span>
                </div>
                {c.next_evaluation && (
                  <p className="mt-1 text-xs text-blue-600">
                    Prochain : {c.next_evaluation.title} ({c.next_evaluation.date})
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
        {data.classes.length === 0 && (
          <p className="py-6 text-center text-sm text-gray-400">Aucune classe affectée.</p>
        )}
      </div>

      {/* ROW 4 — Actions en attente */}
      {hasPendingActions && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <h3 className="mb-3 text-sm font-semibold text-amber-800">Actions requises</h3>
          <div className="space-y-2">
            {data.pending_actions.evaluations_to_lock > 0 && (
              <div className="flex items-center justify-between rounded-lg bg-white px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <span className="text-sm text-gray-700">
                    {data.pending_actions.evaluations_to_lock} évaluation(s) à verrouiller
                  </span>
                </div>
                <button
                  className="rounded-lg bg-amber-600 px-3 py-1 text-xs text-white hover:bg-amber-700"
                  onClick={() => navigate('/school/grades')}
                >
                  Voir les évaluations
                </button>
              </div>
            )}
            {data.pending_actions.absences_to_record > 0 && (
              <div className="flex items-center justify-between rounded-lg bg-white px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-gray-700">
                    {data.pending_actions.absences_to_record} appel(s) non fait aujourd'hui
                  </span>
                </div>
                <button
                  className="rounded-lg bg-red-600 px-3 py-1 text-xs text-white hover:bg-red-700"
                  onClick={() => navigate('/school/attendance/sheet')}
                >
                  Faire l'appel
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notes récentes */}
      {data.recent_grades.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="mb-4 text-sm font-semibold text-gray-700">Évaluations récentes</h3>
          <div className="space-y-2">
            {data.recent_grades.map((g, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{g.evaluation_title}</p>
                  <p className="text-xs text-gray-500">{g.classe} — {g.date}</p>
                </div>
                {g.avg_score !== null && (
                  <span className={`text-sm font-bold ${g.avg_score >= 10 ? 'text-green-600' : 'text-red-600'}`}>
                    Moy. {g.avg_score.toFixed(2)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
