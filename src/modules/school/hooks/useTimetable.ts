import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ApiError } from '@/shared/types/api.types'
import { toast } from '@/shared/lib/toast'
import type {
  TimetableFilters,
  StoreTimetableEntryPayload,
  UpdateTimetableEntryPayload,
  BulkStoreTimetablePayload,
  StoreOverridePayload,
  CheckConflictsPayload,
} from '../types/timetable.types'
import { timetableApi } from '../api/timetable.api'

// ── Query Keys ─────────────────────────────────────────────────────────────

export const timetableKeys = {
  all:        ['timetable'] as const,
  weekView:   (f: TimetableFilters) => ['timetable', 'week', f] as const,
  entry:      (id: number) => ['timetable', 'entry', id] as const,
  overrides:  (entryId: number) => ['timetable', 'overrides', entryId] as const,
  timeSlots:  () => ['time-slots'] as const,
}

// ── Time Slots Queries ─────────────────────────────────────────────────────

export function useTimeSlots(params?: { day?: number; active_only?: boolean; no_breaks?: boolean }) {
  return useQuery({
    queryKey: [...timetableKeys.timeSlots(), params],
    queryFn:  () => timetableApi.getTimeSlots(params).then((r) => r.data.data ?? []),
    staleTime: Infinity,
  })
}

// ── Time Slots Mutations ───────────────────────────────────────────────────

export function useCreateTimeSlot() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Parameters<typeof timetableApi.createTimeSlot>[0]) =>
      timetableApi.createTimeSlot(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: timetableKeys.timeSlots() })
      toast.success('Créneau créé.')
    },
    onError: (e: ApiError) => toast.error(e.response?.data?.message ?? 'Erreur'),
  })
}

export function useUpdateTimeSlot() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof timetableApi.updateTimeSlot>[1] }) =>
      timetableApi.updateTimeSlot(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: timetableKeys.timeSlots() })
      toast.success('Créneau modifié.')
    },
    onError: (e: ApiError) => toast.error(e.response?.data?.message ?? 'Erreur'),
  })
}

export function useDeleteTimeSlot() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => timetableApi.deleteTimeSlot(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: timetableKeys.timeSlots() })
      toast.success('Créneau supprimé.')
    },
    onError: (e: ApiError) => toast.error(e.response?.data?.message ?? 'Erreur'),
  })
}

export function useToggleTimeSlot() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => timetableApi.toggleTimeSlot(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: timetableKeys.timeSlots() })
    },
    onError: (e: ApiError) => toast.error(e.response?.data?.message ?? 'Erreur'),
  })
}

// ── Timetable Queries ──────────────────────────────────────────────────────

export function useTimetableWeekView(filters: TimetableFilters) {
  return useQuery({
    queryKey: timetableKeys.weekView(filters),
    queryFn:  () => timetableApi.getWeekView(filters).then((r) => r.data.data),
    enabled:  !!filters.year_id && (!!filters.class_id || !!filters.teacher_id),
  })
}

export function useTimetableEntry(id: number | undefined) {
  return useQuery({
    queryKey: timetableKeys.entry(id!),
    queryFn:  () => timetableApi.getEntry(id!).then((r) => r.data.data),
    enabled:  !!id,
  })
}

export function useTimetableOverrides(entryId: number | undefined) {
  return useQuery({
    queryKey: timetableKeys.overrides(entryId!),
    queryFn:  () => timetableApi.getOverrides(entryId!).then((r) => r.data.data ?? []),
    enabled:  !!entryId,
  })
}

// ── Mutations ──────────────────────────────────────────────────────────────

export function useCreateTimetableEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: StoreTimetableEntryPayload) => timetableApi.createEntry(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: timetableKeys.all })
      toast.success('Cours ajouté à l\'emploi du temps.')
    },
    onError: (e: ApiError) => toast.error(e.response?.data?.message ?? 'Erreur'),
  })
}

export function useUpdateTimetableEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTimetableEntryPayload }) =>
      timetableApi.updateEntry(id, data),
    onSuccess: (_res, { id }) => {
      qc.invalidateQueries({ queryKey: timetableKeys.entry(id) })
      qc.invalidateQueries({ queryKey: timetableKeys.all })
      toast.success('Cours modifié.')
    },
    onError: (e: ApiError) => toast.error(e.response?.data?.message ?? 'Erreur'),
  })
}

export function useDeleteTimetableEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => timetableApi.deleteEntry(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: timetableKeys.all })
      toast.success('Cours supprimé.')
    },
    onError: (e: ApiError) => toast.error(e.response?.data?.message ?? 'Erreur'),
  })
}

export function useBulkStoreTimetable() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: BulkStoreTimetablePayload) => timetableApi.bulkStore(data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: timetableKeys.all })
      const count = res.data.data?.count ?? 0
      toast.success(`${count} cours enregistrés.`)
    },
    onError: (e: ApiError) => toast.error(e.response?.data?.message ?? 'Erreur'),
  })
}

export function useCheckConflicts() {
  return useMutation({
    mutationFn: (data: CheckConflictsPayload) =>
      timetableApi.checkConflicts(data).then((r) => r.data.data),
  })
}

export function useDownloadTimetablePdf() {
  return useMutation({
    mutationFn: async ({ classId, yearId, filename }: { classId: number; yearId: number; filename: string }) => {
      const res = await timetableApi.downloadPdf({ class_id: classId, year_id: yearId })
      const url = URL.createObjectURL(res.data as Blob)
      const a   = document.createElement('a')
      a.href     = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    },
    onError: (e: ApiError) => toast.error(e.response?.data?.message ?? 'Erreur téléchargement'),
  })
}

export function useCreateOverride() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ entryId, data }: { entryId: number; data: StoreOverridePayload }) =>
      timetableApi.createOverride(entryId, data),
    onSuccess: (_res, { entryId }) => {
      qc.invalidateQueries({ queryKey: timetableKeys.overrides(entryId) })
      toast.success('Dérogation créée.')
    },
    onError: (e: ApiError) => toast.error(e.response?.data?.message ?? 'Erreur'),
  })
}

export function useDeleteOverride() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ overrideId, entryId }: { overrideId: number; entryId: number }) =>
      timetableApi.deleteOverride(overrideId),
    onSuccess: (_res, { entryId }) => {
      qc.invalidateQueries({ queryKey: timetableKeys.overrides(entryId) })
      toast.success('Dérogation supprimée.')
    },
    onError: (e: ApiError) => toast.error(e.response?.data?.message ?? 'Erreur'),
  })
}
