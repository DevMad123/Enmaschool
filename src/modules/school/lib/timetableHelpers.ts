import {
  DAY_LABELS,
  DAY_SHORT,
  OVERRIDE_TYPE_LABELS,
  OVERRIDE_TYPE_COLORS,
} from '../types/timetable.types'
import type {
  DayOfWeek,
  OverrideType,
  TimeSlot,
  TimetableEntry,
  TimetableWeekView,
} from '../types/timetable.types'

export function getDayLabel(day: DayOfWeek): string {
  return DAY_LABELS[day] ?? String(day)
}

export function getDayShort(day: DayOfWeek): string {
  return DAY_SHORT[day] ?? String(day)
}

export function getOverrideTypeLabel(type: OverrideType): string {
  return OVERRIDE_TYPE_LABELS[type] ?? type
}

export function getOverrideTypeColor(type: OverrideType): string {
  return OVERRIDE_TYPE_COLORS[type] ?? 'gray'
}

export function formatTime(time: string): string {
  // "07:30:00" → "07h30"
  const parts = time.split(':')
  if (parts.length < 2) return time
  return `${parts[0]}h${parts[1]}`
}

export function formatSlotRange(slot: TimeSlot): string {
  return `${formatTime(slot.start_time)} - ${formatTime(slot.end_time)}`
}

/**
 * Groups time slots by day_of_week into a Map<DayOfWeek, TimeSlot[]>.
 */
export function groupSlotsByDay(slots: TimeSlot[]): Map<DayOfWeek, TimeSlot[]> {
  const map = new Map<DayOfWeek, TimeSlot[]>()
  for (const slot of slots) {
    const day = slot.day_of_week.value
    if (!map.has(day)) map.set(day, [])
    map.get(day)!.push(slot)
  }
  return map
}

/**
 * Returns the entry for a given class/day/slot from the week view.
 */
export function findEntry(
  weekView: TimetableWeekView | undefined,
  day: DayOfWeek,
  slotId: number,
): TimetableEntry | undefined {
  if (!weekView) return undefined
  const dayEntries = weekView.entries[String(day)] ?? []
  return dayEntries.find((e) => e.time_slot_id === slotId)
}

/**
 * Converts a TimetableEntry to a FullCalendar event object for timeGridWeek view.
 * `weekStart` is a Monday-based date string "YYYY-MM-DD".
 */
export function entryToCalendarEvent(
  entry: TimetableEntry,
  weekStart: string,
): Record<string, unknown> {
  const slot = entry.time_slot
  if (!slot) return {}

  const day = slot.day_of_week.value // 1=Mon … 6=Sat
  // FullCalendar uses 0=Sun, so Mon=1, Tue=2, etc.
  const fcDow = day // already aligned

  const startDate = addDays(weekStart, day - 1) // 1=Mon → +0, 2=Tue → +1 …
  const endDate   = startDate

  return {
    id:              String(entry.id),
    title:           entry.subject?.name ?? '',
    start:           `${startDate}T${slot.start_time}`,
    end:             `${endDate}T${slot.end_time}`,
    backgroundColor: entry.color ?? '#3B82F6',
    borderColor:     entry.color ?? '#3B82F6',
    extendedProps:   { entry, fcDow },
  }
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]!
}

/**
 * Returns the ISO date string for the Monday of the current week.
 */
export function getCurrentWeekMonday(): string {
  const today = new Date()
  const dow   = today.getDay() // 0=Sun
  const diff  = dow === 0 ? -6 : 1 - dow
  const monday = new Date(today)
  monday.setDate(today.getDate() + diff)
  return monday.toISOString().split('T')[0]!
}

/**
 * Returns working days (Mon–Fri by default).
 */
export const WORKING_DAYS: DayOfWeek[] = [1, 2, 3, 4, 5, 6]
