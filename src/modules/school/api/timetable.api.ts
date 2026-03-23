import api from '@/shared/lib/axios'
import type { ApiSuccess } from '@/shared/types/api.types'
import type {
  TimeSlot,
  TimetableEntry,
  TimetableWeekView,
  TimetableOverride,
  ConflictCheckResult,
  StoreTimetableEntryPayload,
  UpdateTimetableEntryPayload,
  BulkStoreTimetablePayload,
  StoreOverridePayload,
  CheckConflictsPayload,
  TimetableFilters,
} from '../types/timetable.types'

const BASE = '/api/school'

export const timetableApi = {
  // ── Time Slots ──────────────────────────────────────────────────────────

  getTimeSlots: (params?: { day?: number; active_only?: boolean; no_breaks?: boolean }) =>
    api.get<ApiSuccess<TimeSlot[]>>(`${BASE}/time-slots`, { params }),

  createTimeSlot: (data: Omit<TimeSlot, 'id'>) =>
    api.post<ApiSuccess<TimeSlot>>(`${BASE}/time-slots`, data),

  updateTimeSlot: (id: number, data: Partial<Omit<TimeSlot, 'id'>>) =>
    api.put<ApiSuccess<TimeSlot>>(`${BASE}/time-slots/${id}`, data),

  deleteTimeSlot: (id: number) =>
    api.delete<ApiSuccess<null>>(`${BASE}/time-slots/${id}`),

  toggleTimeSlot: (id: number) =>
    api.post<ApiSuccess<TimeSlot>>(`${BASE}/time-slots/${id}/toggle`),

  // ── Week View ───────────────────────────────────────────────────────────

  getWeekView: (filters: TimetableFilters) =>
    api.get<ApiSuccess<TimetableWeekView>>(`${BASE}/timetable`, { params: filters }),

  // ── Entries ─────────────────────────────────────────────────────────────

  createEntry: (data: StoreTimetableEntryPayload) =>
    api.post<ApiSuccess<TimetableEntry>>(`${BASE}/timetable`, data),

  getEntry: (id: number) =>
    api.get<ApiSuccess<TimetableEntry>>(`${BASE}/timetable/${id}`),

  updateEntry: (id: number, data: UpdateTimetableEntryPayload) =>
    api.put<ApiSuccess<TimetableEntry>>(`${BASE}/timetable/${id}`, data),

  deleteEntry: (id: number) =>
    api.delete<ApiSuccess<null>>(`${BASE}/timetable/${id}`),

  bulkStore: (data: BulkStoreTimetablePayload) =>
    api.post<ApiSuccess<{ count: number; entries: TimetableEntry[] }>>(
      `${BASE}/timetable/bulk`,
      data,
    ),

  // ── PDF ─────────────────────────────────────────────────────────────────

  downloadPdf: (params: { class_id: number; year_id: number }) =>
    api.get(`${BASE}/timetable/pdf`, { params, responseType: 'blob' }),

  // ── Conflict Check ──────────────────────────────────────────────────────

  checkConflicts: (data: CheckConflictsPayload) =>
    api.post<ApiSuccess<ConflictCheckResult>>(`${BASE}/timetable/conflicts`, data),

  // ── Overrides ───────────────────────────────────────────────────────────

  getOverrides: (entryId: number) =>
    api.get<ApiSuccess<TimetableOverride[]>>(`${BASE}/timetable/${entryId}/overrides`),

  createOverride: (entryId: number, data: StoreOverridePayload) =>
    api.post<ApiSuccess<TimetableOverride>>(`${BASE}/timetable/${entryId}/overrides`, data),

  deleteOverride: (overrideId: number) =>
    api.delete<ApiSuccess<null>>(`${BASE}/timetable/overrides/${overrideId}`),
}
