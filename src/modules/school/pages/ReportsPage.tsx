// ===== src/modules/school/pages/ReportsPage.tsx =====

import { useState } from 'react';
import { BarChart2, Calendar, FileText, GraduationCap, Loader2, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { useAcademicYears, useAcademicYearPeriods } from '../hooks/useAcademicYears';
import { useClasses } from '../hooks/useClasses';
import {
  useExportAttendance,
  useExportPayments,
  useExportResults,
  useExportStudents,
  useGenerateClassResults,
  useGenerateYearSummary,
} from '../hooks/useDashboard';
import { ExportButton } from '../components/ExportButton';
import { reportsApi } from '../api/dashboard.api';

export function ReportsPage() {
  const { data: years = [] } = useAcademicYears();
  const currentYear = years.find((y) => y.is_current) ?? years[0];
  const [yearId, setYearId] = useState<number>(currentYear?.id ?? 0);

  const { data: classes = [] } = useClasses();
  const { data: periodsRaw = [] } = useAcademicYearPeriods(yearId);
  const periods = periodsRaw as Array<{ id: number; name: string }>;

  // Filtres élèves
  const [studentFilters, setStudentFilters] = useState({ level_category: '', classe_id: '', status: '', gender: '' });
  // Filtres résultats
  const [resultFilters, setResultFilters] = useState({ period_id: '', classe_id: '' });
  const [classPdfId, setClassPdfId] = useState('');
  const [classPdfPeriodId, setClassPdfPeriodId] = useState('');
  // Filtres présences
  const [attFilters, setAttFilters] = useState({ period_id: '', classe_id: '' });
  // Filtres paiements
  const [payFilters, setPayFilters] = useState({ date_from: '', date_to: '', method: '', status: '' });

  const exportStudents    = useExportStudents();
  const exportResults     = useExportResults();
  const exportAttendance  = useExportAttendance();
  const exportPayments    = useExportPayments();
  const generateClassPdf  = useGenerateClassResults();
  const generateYearPdf   = useGenerateYearSummary();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rapports & Exports</h1>
          <p className="text-sm text-gray-500">Générez et téléchargez vos rapports</p>
        </div>
        <select
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          value={yearId}
          onChange={(e) => setYearId(Number(e.target.value))}
        >
          {years.map((y) => (
            <option key={y.id} value={y.id}>{y.name}</option>
          ))}
        </select>
      </div>

      {/* Section 1 — Élèves */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-center gap-2 mb-4">
          <GraduationCap className="h-5 w-5 text-blue-600" />
          <h2 className="text-base font-semibold text-gray-900">Liste des élèves</h2>
        </div>
        <div className="flex flex-wrap gap-3 mb-4">
          <select
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            value={studentFilters.level_category}
            onChange={(e) => setStudentFilters((f) => ({ ...f, level_category: e.target.value }))}
          >
            <option value="">Tous les niveaux</option>
            <option value="maternelle">Maternelle</option>
            <option value="primaire">Primaire</option>
            <option value="college">Collège</option>
            <option value="lycee">Lycée</option>
          </select>
          <select
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            value={studentFilters.classe_id}
            onChange={(e) => setStudentFilters((f) => ({ ...f, classe_id: e.target.value }))}
          >
            <option value="">Toutes les classes</option>
            {classes.map((c: { id: number; display_name: string }) => (
              <option key={c.id} value={c.id}>{c.display_name}</option>
            ))}
          </select>
          <select
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            value={studentFilters.gender}
            onChange={(e) => setStudentFilters((f) => ({ ...f, gender: e.target.value }))}
          >
            <option value="">Tous les genres</option>
            <option value="male">Garçons</option>
            <option value="female">Filles</option>
          </select>
        </div>
        <ExportButton
          label="Télécharger Excel"
          onExport={() =>
            reportsApi
              .exportStudents({ year_id: yearId, ...Object.fromEntries(Object.entries(studentFilters).filter(([, v]) => v)) })
              .then((r) => r.data as Blob)
          }
          filename={`eleves-${yearId}`}
          format="xlsx"
          variant="primary"
        />
      </div>

      {/* Section 2 — Résultats académiques */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 className="h-5 w-5 text-purple-600" />
          <h2 className="text-base font-semibold text-gray-900">Résultats académiques</h2>
        </div>

        <div className="space-y-4">
          {/* Export Excel résultats */}
          <div>
            <p className="text-sm text-gray-500 mb-2">Exporter toutes les classes</p>
            <div className="flex flex-wrap gap-3 mb-3">
              <select
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                value={resultFilters.period_id}
                onChange={(e) => setResultFilters((f) => ({ ...f, period_id: e.target.value }))}
              >
                <option value="">Sélectionner une période</option>
                {periods.map((p: { id: number; name: string }) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <ExportButton
              label="Télécharger Excel (toutes les classes)"
              onExport={() =>
                reportsApi
                  .exportResults({ year_id: yearId, period_id: resultFilters.period_id })
                  .then((r) => r.data as Blob)
              }
              filename={`resultats-${yearId}`}
              format="xlsx"
              disabled={!resultFilters.period_id}
            />
          </div>

          <hr className="border-gray-100" />

          {/* PDF tableau de résultats d'une classe */}
          <div>
            <p className="text-sm text-gray-500 mb-2">PDF tableau de résultats (par classe)</p>
            <div className="flex flex-wrap gap-3 mb-3">
              <select
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                value={classPdfId}
                onChange={(e) => setClassPdfId(e.target.value)}
              >
                <option value="">Sélectionner une classe</option>
                {classes.map((c: { id: number; display_name: string }) => (
                  <option key={c.id} value={c.id}>{c.display_name}</option>
                ))}
              </select>
              <select
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                value={classPdfPeriodId}
                onChange={(e) => setClassPdfPeriodId(e.target.value)}
              >
                <option value="">Sélectionner une période</option>
                {periods.map((p: { id: number; name: string }) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <ExportButton
              label="Télécharger PDF résultats"
              onExport={() =>
                reportsApi
                  .generateClassResults(Number(classPdfId), Number(classPdfPeriodId))
                  .then((r) => r.data as Blob)
              }
              filename={`resultats-classe-${classPdfId}`}
              format="pdf"
              disabled={!classPdfId || !classPdfPeriodId}
            />
          </div>

          <hr className="border-gray-100" />

          {/* Synthèse annuelle */}
          <div>
            <p className="text-sm text-gray-500 mb-2">Synthèse annuelle complète (PDF asynchrone)</p>
            <button
              onClick={() => generateYearPdf.mutate(yearId)}
              disabled={generateYearPdf.isPending || !yearId}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {generateYearPdf.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Lancement...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4" />
                  Générer la synthèse annuelle
                </>
              )}
            </button>
            <p className="mt-2 text-xs text-gray-400">
              Le rapport sera généré en arrière-plan. Vous recevrez une notification quand il sera prêt.
            </p>
          </div>
        </div>
      </div>

      {/* Section 3 — Présences */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5 text-green-600" />
          <h2 className="text-base font-semibold text-gray-900">Rapport d'absences</h2>
        </div>
        <div className="flex flex-wrap gap-3 mb-4">
          <select
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            value={attFilters.period_id}
            onChange={(e) => setAttFilters((f) => ({ ...f, period_id: e.target.value }))}
          >
            <option value="">Toutes les périodes</option>
            {periods.map((p: { id: number; name: string }) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <select
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            value={attFilters.classe_id}
            onChange={(e) => setAttFilters((f) => ({ ...f, classe_id: e.target.value }))}
          >
            <option value="">Toutes les classes</option>
            {classes.map((c: { id: number; display_name: string }) => (
              <option key={c.id} value={c.id}>{c.display_name}</option>
            ))}
          </select>
        </div>
        <ExportButton
          label="Télécharger Excel"
          onExport={() =>
            reportsApi
              .exportAttendance({ year_id: yearId, ...Object.fromEntries(Object.entries(attFilters).filter(([, v]) => v)) })
              .then((r) => r.data as Blob)
          }
          filename={`absences-${yearId}`}
          format="xlsx"
          variant="primary"
        />
      </div>

      {/* Section 4 — Paiements */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-center gap-2 mb-4">
          <Wallet className="h-5 w-5 text-amber-600" />
          <h2 className="text-base font-semibold text-gray-900">Rapport des paiements</h2>
        </div>
        <div className="flex flex-wrap gap-3 mb-4">
          <input
            type="date"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            value={payFilters.date_from}
            onChange={(e) => setPayFilters((f) => ({ ...f, date_from: e.target.value }))}
            placeholder="Date début"
          />
          <input
            type="date"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            value={payFilters.date_to}
            onChange={(e) => setPayFilters((f) => ({ ...f, date_to: e.target.value }))}
            placeholder="Date fin"
          />
          <select
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            value={payFilters.method}
            onChange={(e) => setPayFilters((f) => ({ ...f, method: e.target.value }))}
          >
            <option value="">Tous les modes</option>
            <option value="cash">Espèces</option>
            <option value="bank_transfer">Virement</option>
            <option value="mobile_money">Mobile Money</option>
            <option value="check">Chèque</option>
          </select>
        </div>
        <ExportButton
          label="Télécharger Excel"
          onExport={() =>
            reportsApi
              .exportPayments({ year_id: yearId, ...Object.fromEntries(Object.entries(payFilters).filter(([, v]) => v)) })
              .then((r) => r.data as Blob)
          }
          filename={`paiements-${yearId}`}
          format="xlsx"
          variant="primary"
        />
      </div>
    </div>
  );
}
