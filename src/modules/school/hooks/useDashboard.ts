// ===== src/modules/school/hooks/useDashboard.ts =====

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { dashboardApi, reportsApi } from '../api/dashboard.api';
import { downloadExcelBlob, downloadPdfBlob } from '../lib/dashboardHelpers';
import { toast } from 'sonner';

// ── Dashboards ───────────────────────────────────────────────────────────────

export function useDirectionDashboard(yearId: number) {
  return useQuery({
    queryKey: ['dashboard-direction', yearId],
    queryFn: () => dashboardApi.getDirection(yearId).then((r) => r.data.data),
    enabled: yearId > 0,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
}

export function useAcademicDashboard(yearId: number, periodId?: number) {
  return useQuery({
    queryKey: ['dashboard-academic', yearId, periodId],
    queryFn: () => dashboardApi.getAcademic(yearId, periodId).then((r) => r.data.data),
    enabled: yearId > 0,
    staleTime: 10 * 60 * 1000,
  });
}

export function useAttendanceDashboard(yearId: number, periodId?: number, date?: string) {
  return useQuery({
    queryKey: ['dashboard-attendance', yearId, periodId, date],
    queryFn: () => dashboardApi.getAttendance(yearId, periodId, date).then((r) => r.data.data),
    enabled: yearId > 0,
    staleTime: 2 * 60 * 1000,
    refetchInterval: 2 * 60 * 1000,
  });
}

export function useFinancialDashboard(yearId: number) {
  return useQuery({
    queryKey: ['dashboard-financial', yearId],
    queryFn: () => dashboardApi.getFinancial(yearId).then((r) => r.data.data),
    enabled: yearId > 0,
    staleTime: 5 * 60 * 1000,
  });
}

export function useTeacherDashboard(yearId: number) {
  return useQuery({
    queryKey: ['dashboard-teacher', yearId],
    queryFn: () => dashboardApi.getTeacher(yearId).then((r) => r.data.data),
    enabled: yearId > 0,
    staleTime: 3 * 60 * 1000,
  });
}

export function useInvalidateDashboardCache() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => dashboardApi.invalidateCache(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-direction'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-academic'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-attendance'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-financial'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-teacher'] });
      toast.success('Cache vidé — les données seront rechargées depuis la base.');
    },
    onError: () => toast.error('Impossible de vider le cache.'),
  });
}

// ── Exports ──────────────────────────────────────────────────────────────────

export function useExportStudents() {
  return useMutation({
    mutationFn: (params: Record<string, unknown>) =>
      reportsApi.exportStudents(params).then((r) => r.data as Blob),
    onSuccess: (blob, params) => {
      const year = params.year_id ?? 'export';
      downloadExcelBlob(blob, `eleves-${year}`);
      toast.success('Fichier téléchargé ✓');
    },
    onError: () => toast.error('Erreur lors de la génération du fichier.'),
  });
}

export function useExportResults() {
  return useMutation({
    mutationFn: (params: Record<string, unknown>) =>
      reportsApi.exportResults(params).then((r) => r.data as Blob),
    onSuccess: (blob, params) => {
      downloadExcelBlob(blob, `resultats-${params.year_id ?? 'export'}`);
      toast.success('Fichier téléchargé ✓');
    },
    onError: () => toast.error('Erreur lors de la génération du fichier.'),
  });
}

export function useExportAttendance() {
  return useMutation({
    mutationFn: (params: Record<string, unknown>) =>
      reportsApi.exportAttendance(params).then((r) => r.data as Blob),
    onSuccess: (blob, params) => {
      downloadExcelBlob(blob, `absences-${params.year_id ?? 'export'}`);
      toast.success('Fichier téléchargé ✓');
    },
    onError: () => toast.error('Erreur lors de la génération du fichier.'),
  });
}

export function useExportPayments() {
  return useMutation({
    mutationFn: (params: Record<string, unknown>) =>
      reportsApi.exportPayments(params).then((r) => r.data as Blob),
    onSuccess: (blob, params) => {
      downloadExcelBlob(blob, `paiements-${params.year_id ?? 'export'}`);
      toast.success('Fichier téléchargé ✓');
    },
    onError: () => toast.error('Erreur lors de la génération du fichier.'),
  });
}

export function useGenerateClassResults() {
  return useMutation({
    mutationFn: ({ classId, periodId }: { classId: number; periodId: number }) =>
      reportsApi.generateClassResults(classId, periodId).then((r) => r.data as Blob),
    onSuccess: (blob) => {
      downloadPdfBlob(blob, `resultats-classe-${Date.now()}`);
      toast.success('PDF téléchargé ✓');
    },
    onError: () => toast.error('Erreur lors de la génération du PDF.'),
  });
}

export function useGenerateYearSummary() {
  return useMutation({
    mutationFn: (yearId: number) =>
      reportsApi.generateYearSummary(yearId).then((r) => r.data),
    onSuccess: () =>
      toast.success('Synthèse annuelle en cours — vous serez notifié quand elle sera prête.'),
    onError: () => toast.error('Erreur lors du lancement de la génération.'),
  });
}
