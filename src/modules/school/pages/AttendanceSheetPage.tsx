import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ClipboardCheck, Users, CheckCheck, RotateCcw, Save } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner'
import { useSchoolStore } from '../store/schoolStore'
import { useAcademicYears } from '../hooks/useAcademicYears'
import { useClasses } from '../hooks/useClasses'
import { useTimeSlots } from '../hooks/useTimetable'
import { useAttendanceSheet, useRecordAttendance } from '../hooks/useAttendance'
import { AttendanceStatusButton } from '../components/AttendanceStatusButton'
import { AttendanceSummaryBar } from '../components/AttendanceSummaryBar'
import { AutoSaveIndicator } from '../components/AutoSaveIndicator'
import type { AttendanceRecord, AttendanceStatus, AttendanceSheetStudent } from '../types/attendance.types'
import { STATUS_KEYBOARD_MAP } from '../lib/attendanceHelpers'
import { WORKING_DAYS, formatSlotRange } from '../lib/timetableHelpers'

const ALL_STATUSES: AttendanceStatus[] = ['present', 'absent', 'late', 'excused']

export function AttendanceSheetPage() {
  const { currentYearId } = useSchoolStore()
  const [searchParams]   = useSearchParams()

  const [selectedYearId,  setSelectedYearId]  = useState<number | null>(null)
  const [selectedClassId, setSelectedClassId] = useState<number>(0)
  const [selectedDate,    setSelectedDate]    = useState<string>(() => new Date().toISOString().slice(0, 10))
  const [selectedEntryId, setSelectedEntryId] = useState<number | null>(null)

  // Records being edited locally
  const [localRecords, setLocalRecords] = useState<Map<number, AttendanceRecord>>(new Map())
  const [focusedRow,   setFocusedRow]   = useState<number>(-1)
  const [saveStatus,   setSaveStatus]   = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (currentYearId && selectedYearId === null) setSelectedYearId(currentYearId)
  }, [currentYearId])

  // Pre-fill from query params (e.g., from TimetablePage)
  useEffect(() => {
    const entryId = searchParams.get('entry_id')
    const classId = searchParams.get('class_id')
    const date    = searchParams.get('date')
    if (entryId) setSelectedEntryId(Number(entryId))
    if (classId) setSelectedClassId(Number(classId))
    if (date)    setSelectedDate(date)
  }, [searchParams])

  const { data: yearsData }   = useAcademicYears()
  const years                 = yearsData?.data ?? []
  const yearId                = selectedYearId ?? 0

  const { data: classesData } = useClasses({ academic_year_id: yearId || undefined })
  const classes               = classesData?.data ?? []

  // Time slots for the selected date's day
  const { data: slotsData }   = useTimeSlots({ active_only: true, no_breaks: true })
  const allSlots              = slotsData ?? []
  const dateDay               = selectedDate ? new Date(selectedDate).getDay() : 0
  // Convert JS day (0=Sun) to ISO day (1=Mon … 6=Sat)
  const isoDay                = dateDay === 0 ? 7 : dateDay
  const daySlots              = allSlots.filter((s) => s.day_of_week.value === isoDay)

  const { data: sheet, isLoading } = useAttendanceSheet(
    selectedEntryId ?? undefined,
    selectedClassId,
    selectedDate,
  )

  const recordMutation = useRecordAttendance()

  // Sync sheet → local records on load
  useEffect(() => {
    if (!sheet) return
    const map = new Map<number, AttendanceRecord>()
    for (const row of sheet.students) {
      if (row.attendance) {
        map.set(row.enrollment_id, {
          enrollment_id: row.enrollment_id,
          status:        row.attendance.status.value,
          minutes_late:  row.attendance.minutes_late ?? undefined,
          note:          row.attendance.note ?? undefined,
        })
      }
    }
    setLocalRecords(map)
    setSaveStatus('idle')
  }, [sheet])

  const scheduleAutoSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    setSaveStatus('saving')
    saveTimerRef.current = setTimeout(() => {
      triggerSave()
    }, 800)
  }, [selectedEntryId, selectedClassId, selectedDate, localRecords])

  const triggerSave = useCallback(() => {
    if (!selectedClassId || !selectedDate || localRecords.size === 0) return

    setSaveStatus('saving')
    recordMutation.mutate(
      {
        entry_id: selectedEntryId ?? null,
        date:     selectedDate,
        records:  Array.from(localRecords.values()),
      },
      {
        onSuccess: () => setSaveStatus('saved'),
        onError:   () => setSaveStatus('error'),
      }
    )
  }, [selectedEntryId, selectedClassId, selectedDate, localRecords, recordMutation])

  const setStatus = (enrollmentId: number, status: AttendanceStatus) => {
    setLocalRecords((prev) => {
      const next = new Map(prev)
      const existing = next.get(enrollmentId)
      next.set(enrollmentId, {
        ...existing,
        enrollment_id: enrollmentId,
        status,
        minutes_late: status === 'late' ? (existing?.minutes_late ?? undefined) : undefined,
      })
      return next
    })
    scheduleAutoSave()
  }

  const setMinutesLate = (enrollmentId: number, minutes: number) => {
    setLocalRecords((prev) => {
      const next = new Map(prev)
      const existing = next.get(enrollmentId)
      if (existing) next.set(enrollmentId, { ...existing, minutes_late: minutes || undefined })
      return next
    })
    scheduleAutoSave()
  }

  const markAllPresent = () => {
    if (!sheet) return
    const map = new Map<number, AttendanceRecord>()
    for (const row of sheet.students) {
      map.set(row.enrollment_id, { enrollment_id: row.enrollment_id, status: 'present' })
    }
    setLocalRecords(map)
    scheduleAutoSave()
  }

  const resetAll = () => {
    setLocalRecords(new Map())
    setSaveStatus('idle')
  }

  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!sheet || sheet.students.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setFocusedRow((r) => Math.min(r + 1, sheet.students.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setFocusedRow((r) => Math.max(r - 1, 0))
    } else if (focusedRow >= 0) {
      const status = STATUS_KEYBOARD_MAP[e.key.toLowerCase()]
      if (status) {
        const row = sheet.students[focusedRow]
        setStatus(row.enrollment_id, status)
      }
    }
  }, [sheet, focusedRow, setStatus])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const students = sheet?.students ?? []
  const summary  = sheet?.summary

  const livePresent = Array.from(localRecords.values()).filter((r) => r.status === 'present' || r.status === 'late').length
  const liveAbsent  = Array.from(localRecords.values()).filter((r) => r.status === 'absent').length
  const liveExcused = Array.from(localRecords.values()).filter((r) => r.status === 'excused').length
  const liveLate    = Array.from(localRecords.values()).filter((r) => r.status === 'late').length
  const liveTotal   = students.length
  const liveRate    = liveTotal > 0 ? Math.round((livePresent / liveTotal) * 1000) / 10 : 0

  const liveSummary = {
    present: livePresent - liveLate,
    absent: liveAbsent,
    late: liveLate,
    excused: liveExcused,
    total: liveTotal,
    attendance_rate: liveRate,
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
            <ClipboardCheck className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Feuille d'appel</h1>
            <p className="text-sm text-slate-500">Saisie des présences par cours</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AutoSaveIndicator status={saveStatus} />
          <Button variant="outline" onClick={resetAll} className="gap-1.5" size="sm">
            <RotateCcw className="h-4 w-4" />
            Réinitialiser
          </Button>
          <Button variant="outline" onClick={markAllPresent} className="gap-1.5 text-green-700 border-green-200 hover:bg-green-50" size="sm" disabled={!sheet}>
            <CheckCheck className="h-4 w-4" />
            Tous présents
          </Button>
          <Button onClick={triggerSave} disabled={!selectedClassId || localRecords.size === 0 || recordMutation.isPending} className="gap-1.5" size="sm">
            <Save className="h-4 w-4" />
            {recordMutation.isPending ? 'Enregistrement…' : 'Valider l\'appel'}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500">Année scolaire</label>
          <select
            value={selectedYearId ?? ''}
            onChange={(e) => setSelectedYearId(Number(e.target.value) || null)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm min-w-[180px]"
          >
            <option value="">Sélectionner</option>
            {years.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500">Classe</label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(Number(e.target.value))}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm min-w-[180px]"
          >
            <option value={0}>Sélectionner</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.display_name}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500">Date</label>
          <input
            type="date"
            value={selectedDate}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
          />
        </div>
        {daySlots.length > 0 && (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500">Cours</label>
            <select
              value={selectedEntryId ?? ''}
              onChange={(e) => setSelectedEntryId(Number(e.target.value) || null)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm min-w-[200px]"
            >
              <option value="">Journée entière</option>
              {daySlots.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — {formatSlotRange(s)}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Sheet */}
      {!selectedClassId || !selectedDate ? (
        <div className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 p-16 text-center">
          <ClipboardCheck className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">Sélectionnez une classe et une date pour afficher la feuille d'appel.</p>
        </div>
      ) : isLoading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
          {/* Status badge */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 bg-slate-50">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700">
                {students.length} élève{students.length > 1 ? 's' : ''}
              </span>
            </div>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              localRecords.size > 0
                ? 'bg-green-100 text-green-700'
                : 'bg-orange-100 text-orange-700'
            }`}>
              {localRecords.size > 0 ? 'Appel en cours' : 'Appel non effectué'}
            </span>
          </div>

          {/* Keyboard hint */}
          <div className="px-4 py-1.5 bg-indigo-50 border-b border-indigo-100 text-xs text-indigo-600">
            Raccourcis : <kbd className="px-1 rounded bg-white border border-indigo-200">↑↓</kbd> Naviguer &nbsp;
            <kbd className="px-1 rounded bg-white border border-indigo-200">P</kbd> Présent &nbsp;
            <kbd className="px-1 rounded bg-white border border-indigo-200">A</kbd> Absent &nbsp;
            <kbd className="px-1 rounded bg-white border border-indigo-200">R</kbd> Retard &nbsp;
            <kbd className="px-1 rounded bg-white border border-indigo-200">J</kbd> Justifié
          </div>

          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 w-8">#</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Élève</th>
                <th className="text-center px-2 py-2.5 text-xs font-medium text-green-700">P</th>
                <th className="text-center px-2 py-2.5 text-xs font-medium text-red-700">A</th>
                <th className="text-center px-2 py-2.5 text-xs font-medium text-orange-600">R</th>
                <th className="text-center px-2 py-2.5 text-xs font-medium text-blue-600">AJ</th>
                <th className="text-center px-3 py-2.5 text-xs font-medium text-slate-500">Min. retard</th>
                <th className="px-3 py-2.5 text-xs font-medium text-slate-500">Note</th>
              </tr>
            </thead>
            <tbody>
              {students.map((row: AttendanceSheetStudent, idx: number) => {
                const record = localRecords.get(row.enrollment_id)
                const isFocused = idx === focusedRow

                return (
                  <tr
                    key={row.enrollment_id}
                    className={`border-b border-slate-100 last:border-0 cursor-pointer ${
                      isFocused ? 'bg-indigo-50' : 'hover:bg-slate-50/70'
                    }`}
                    onClick={() => setFocusedRow(idx)}
                  >
                    <td className="px-4 py-2 text-xs text-slate-400">{idx + 1}</td>
                    <td className="px-4 py-2">
                      <span className="font-medium text-slate-900">{row.student.last_name}</span>
                      {' '}
                      <span className="text-slate-600">{row.student.first_name}</span>
                    </td>
                    {ALL_STATUSES.map((s) => (
                      <td key={s} className="text-center px-2 py-2">
                        <AttendanceStatusButton
                          status={s}
                          selected={record?.status === s}
                          onClick={() => setStatus(row.enrollment_id, s)}
                        />
                      </td>
                    ))}
                    <td className="text-center px-3 py-2">
                      {record?.status === 'late' ? (
                        <input
                          type="number"
                          min={1}
                          max={120}
                          value={record.minutes_late ?? ''}
                          onChange={(e) => setMinutesLate(row.enrollment_id, Number(e.target.value))}
                          onClick={(e) => e.stopPropagation()}
                          className="w-16 rounded border border-orange-300 px-2 py-0.5 text-center text-xs"
                          placeholder="min"
                        />
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={record?.note ?? ''}
                        onChange={(e) => {
                          setLocalRecords((prev) => {
                            const next = new Map(prev)
                            const ex = next.get(row.enrollment_id)
                            if (ex) next.set(row.enrollment_id, { ...ex, note: e.target.value || undefined })
                            return next
                          })
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full rounded border border-slate-200 px-2 py-0.5 text-xs placeholder:text-slate-300"
                        placeholder="Remarque…"
                        maxLength={300}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {/* Summary footer */}
          <div className="px-4 py-3 border-t border-slate-200 bg-slate-50">
            <AttendanceSummaryBar summary={liveSummary} />
          </div>
        </div>
      )}
    </div>
  )
}
