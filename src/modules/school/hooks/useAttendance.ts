import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ApiError } from '@/shared/types/api.types'
import { toast } from '@/shared/lib/toast'
import { attendanceApi, justificationsApi } from '../api/attendance.api'
import type { RecordAttendanceData } from '../types/attendance.types'

// ── Query Keys ──────────────────────────────────────────────────────────────

export const attendanceKeys = {
  sheet:          (entryId?: number, classeId?: number, date?: string) =>
    ['attendance-sheet', entryId, classeId, date] as const,
  studentStats:   (enrollmentId: number, periodId?: number) =>
    ['student-attendance-stats', enrollmentId, periodId] as const,
  studentHistory: (enrollmentId: number, filters?: Record<string, unknown>) =>
    ['student-attendance-history', enrollmentId, filters] as const,
  classStats:     (classeId: number, periodId?: number) =>
    ['class-attendance-stats', classeId, periodId] as const,
  calendar:       (classeId: number, yearId?: number, month?: string) =>
    ['attendance-calendar', classeId, yearId, month] as const,
  justifications: (filters?: Record<string, unknown>) =>
    ['justifications', filters] as const,
}

// ── Feuille d'appel ──────────────────────────────────────────────────────────

export function useAttendanceSheet(
  entryId: number | undefined,
  classeId: number,
  date: string,
) {
  return useQuery({
    queryKey: attendanceKeys.sheet(entryId, classeId, date),
    queryFn:  () =>
      attendanceApi.getSheet({ entry_id: entryId, class_id: classeId, date }).then((r) => r.data.data),
    enabled:  !!entryId && !!classeId && !!date,
    staleTime: 30_000, // 30 secondes — données quasi temps réel
  })
}

export function useRecordAttendance() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: RecordAttendanceData) => attendanceApi.record(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attendance-sheet'] })
      qc.invalidateQueries({ queryKey: ['student-attendance-stats'] })
    },
    onError: (e: ApiError) => toast.error(e.response?.data?.message ?? 'Erreur de saisie'),
  })
}

// ── Statistiques ─────────────────────────────────────────────────────────────

export function useStudentAttendanceStats(
  enrollmentId: number | undefined,
  periodId?: number,
) {
  return useQuery({
    queryKey: attendanceKeys.studentStats(enrollmentId!, periodId),
    queryFn:  () =>
      attendanceApi.getStudentStats(enrollmentId!, { period_id: periodId }).then((r) => r.data.data),
    enabled: !!enrollmentId,
  })
}

export function useStudentAttendanceHistory(
  enrollmentId: number | undefined,
  filters?: Record<string, unknown>,
) {
  return useQuery({
    queryKey: attendanceKeys.studentHistory(enrollmentId!, filters),
    queryFn:  () =>
      attendanceApi.getStudentHistory(enrollmentId!, filters).then((r) => r.data),
    enabled: !!enrollmentId,
  })
}

export function useClassAttendanceStats(
  classeId: number | undefined,
  periodId?: number,
) {
  return useQuery({
    queryKey: attendanceKeys.classStats(classeId!, periodId),
    queryFn:  () =>
      attendanceApi.getClassStats(classeId!, { period_id: periodId }).then((r) => r.data.data),
    enabled: !!classeId,
  })
}

export function useClassAttendanceCalendar(
  classeId: number | undefined,
  yearId: number | undefined,
  month: string | undefined,
) {
  return useQuery({
    queryKey: attendanceKeys.calendar(classeId!, yearId, month),
    queryFn:  () =>
      attendanceApi.getClassCalendar(classeId!, { year_id: yearId!, month: month! }).then((r) => r.data.data ?? []),
    enabled: !!classeId && !!yearId && !!month,
  })
}

// ── Justifications ────────────────────────────────────────────────────────────

export function useJustifications(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: attendanceKeys.justifications(filters),
    queryFn:  () => justificationsApi.getAll(filters).then((r) => r.data),
  })
}

export function useSubmitJustification() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (formData: FormData) => justificationsApi.submit(formData),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['justifications'] })
      qc.invalidateQueries({ queryKey: ['student-attendance-stats'] })
      toast.success('Justification soumise.')
    },
    onError: (e: ApiError) => toast.error(e.response?.data?.message ?? 'Erreur'),
  })
}

export function useReviewJustification() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { action: 'approve' | 'reject'; review_note?: string } }) =>
      justificationsApi.review(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['justifications'] })
      qc.invalidateQueries({ queryKey: ['student-attendance-stats'] })
      toast.success('Justification mise à jour.')
    },
    onError: (e: ApiError) => toast.error(e.response?.data?.message ?? 'Erreur'),
  })
}

export function useDeleteJustification() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => justificationsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['justifications'] })
      toast.success('Justification supprimée.')
    },
    onError: (e: ApiError) => toast.error(e.response?.data?.message ?? 'Erreur'),
  })
}
