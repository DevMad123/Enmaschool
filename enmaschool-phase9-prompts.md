# ENMA SCHOOL — PROMPTS PHASE 9
## Présences & Absences

---

> ## PÉRIMÈTRE DE LA PHASE 9
>
> **Objectif :** Gérer les présences et absences des élèves par cours,
> par journée et par période, avec justification, statistiques
> et mise à jour automatique des bulletins (Phase 7).
>
> **Tables nouvelles :**
> | Table | Description |
> |-------|-------------|
> | `attendances` | Présence/absence d'un élève pour un créneau donné |
> | `absence_justifications` | Justification d'une absence (document, motif) |
>
> **Concepts clés :**
> - Une **attendance** est liée à un élève + un créneau (`timetable_entry`) + une date
> - Le statut peut être : `present`, `absent`, `late`, `excused`
>   (`excused` = absent justifié)
> - La saisie peut se faire **par cours** (via timetable_entry)
>   ou **par demi-journée / journée entière**
> - Une **justification** peut être soumise après coup pour transformer
>   un `absent` en `excused`
> - Les statistiques d'absences alimentent le **bulletin** (Phase 7)
>   via les champs `absences_justified` et `absences_unjustified`
> - L'enseignant fait l'appel depuis **sa vue emploi du temps** (Phase 8)
>
> **Statuts de présence :**
> | Statut | Description | Impact moyenne |
> |--------|-------------|----------------|
> | `present` | Présent | — |
> | `absent` | Absent non justifié | Peut impacter les notes |
> | `late` | En retard | — |
> | `excused` | Absent justifié | Traité différemment selon config |
>
> **HORS PÉRIMÈTRE Phase 9 :**
> - Notification parents en temps réel → Phase 11
> - Rapport d'absences exportable → Phase 12
>
> **Dépendances requises :**
> - Phase 4 ✅ (students, enrollments)
> - Phase 5 ✅ (teachers, teacher_classes)
> - Phase 7 ✅ (report_cards — champs absences à mettre à jour)
> - Phase 8 ✅ (timetable_entries, time_slots)

---

## SESSION 9.1 — Migrations

```
## CONTEXTE PROJET — ENMA SCHOOL

Stack : PHP 8.3 / Laravel 12 / PostgreSQL 18
Multi-tenant : stancl/tenancy v3 (schema-per-tenant)

Phases terminées :
- Phase 0-1 : Auth, SuperAdmin
- Phase 2 : classes, subjects, rooms, periods, academic_years
- Phase 3 : users, rôles, permissions
- Phase 4 : students, enrollments
- Phase 5 : teachers, teacher_classes
- Phase 6 : evaluations, grades, period_averages
- Phase 7 : report_cards, report_card_appreciations
- Phase 8 : time_slots, timetable_entries, timetable_overrides

Tables existantes utiles :
  students(id, matricule, first_name, last_name, ...)
  enrollments(id, student_id, classe_id, academic_year_id, is_active)
  timetable_entries(id, class_id, time_slot_id, subject_id, teacher_id, room_id, academic_year_id)
  time_slots(id, day_of_week, start_time, end_time, is_break, order)
  periods(id, academic_year_id, name, type, order, start_date, end_date, is_closed)
  academic_years(id, name, is_current)
  report_cards(id, enrollment_id, absences_justified, absences_unjustified, ...)

## CETTE SESSION — Phase 9 : Migrations

Toutes les migrations dans database/migrations/tenant/

## GÉNÈRE LES MIGRATIONS (dans l'ordre)

### 1. create_attendances_table

Objectif : enregistrer la présence ou absence d'un élève
           pour un créneau de cours précis à une date donnée.

Colonnes :
  id
  enrollment_id       (foreignId → enrollments, cascadeOnDelete)
                      NB : relie automatiquement à student + class + year
  timetable_entry_id  (foreignId → timetable_entries, nullOnDelete, nullable)
                      NULL si saisie hors emploi du temps (journée entière)
  date                (date) — date du cours / de l'absence
  period_id           (foreignId → periods, nullOnDelete, nullable)
                      déduit automatiquement de la date + academic_year
  status              (enum: present/absent/late/excused)
  minutes_late        (unsignedSmallInteger, nullable)
                      rempli si status = late (nb de minutes de retard)
  recorded_by         (foreignId → users, nullOnDelete, nullable)
                      utilisateur qui a saisi la présence
  recorded_at         (timestamp, nullable)
  note                (string, nullable, max:300) — remarque de l'enseignant
  timestamps

  UNIQUE(enrollment_id, timetable_entry_id, date)
  NB : si timetable_entry_id = NULL (saisie journée entière) :
       ajouter un index partiel :
       CREATE UNIQUE INDEX attendances_daily_unique
       ON attendances(enrollment_id, date)
       WHERE timetable_entry_id IS NULL;

  Index : enrollment_id, timetable_entry_id, date, period_id, status

### 2. create_absence_justifications_table

Objectif : justification d'une ou plusieurs absences consécutives.
           Soumise par l'admin/staff après coup.

Colonnes :
  id
  enrollment_id       (foreignId → enrollments, cascadeOnDelete)
  date_from           (date) — début de la période d'absence
  date_to             (date) — fin de la période d'absence
  reason              (string, max:500) — motif de l'absence
  document_path       (string, nullable) — chemin vers le document justificatif
                      (certificat médical, etc.)
  status              (enum: pending/approved/rejected)
                      pending  = en attente de validation
                      approved = validée → les absences deviennent 'excused'
                      rejected = rejetée → les absences restent 'absent'
  reviewed_by         (foreignId → users, nullOnDelete, nullable)
  reviewed_at         (timestamp, nullable)
  review_note         (text, nullable) — commentaire du validateur
  submitted_by        (foreignId → users, nullOnDelete, nullable)
  timestamps

  Index : enrollment_id, date_from, date_to, status

## RÈGLES MÉTIER (commentaires dans migrations)

1. UNIQUE(enrollment_id, timetable_entry_id, date) :
   → Un seul enregistrement de présence par élève par cours par date
   → Mise à jour via updateOrCreate (pas d'insert doublon)

2. Quand une justification est approuvée :
   → Mettre à jour le status de toutes les attendances 'absent'
     de l'élève dans la plage date_from → date_to
     vers 'excused'
   → Cela déclenche la mise à jour des compteurs sur report_cards

3. Le period_id est déduit automatiquement dans le Service :
   → Period::where('start_date', '<=', $date)
              ->where('end_date', '>=', $date)
              ->first()

## COMMANDES DE TEST

php artisan migrate --path=database/migrations/tenant
php artisan tinker
  >>> Schema::hasTable('attendances')
  >>> Schema::hasTable('absence_justifications')
  >>> Schema::getColumnListing('attendances')
```

---

## SESSION 9.2 — Enums + Models + Services

```
## CONTEXTE PROJET — ENMA SCHOOL

Stack : PHP 8.3 / Laravel 12, strict_types=1, Enums PHP 8.1

Phase 9 Session 1 terminée :
- Migrations : attendances, absence_justifications ✅

## GÉNÈRE LES ENUMS

### app/Enums/AttendanceStatus.php
cases : Present, Absent, Late, Excused
values: 'present', 'absent', 'late', 'excused'
méthode : label() →
  present → "Présent", absent → "Absent",
  late → "En retard", excused → "Absent justifié"
méthode : short() → "P", "A", "R", "AJ"
méthode : color() →
  present → 'green', absent → 'red',
  late → 'orange', excused → 'blue'
méthode : isAbsent() : bool → in [Absent, Excused]
méthode : isPresent() : bool → in [Present, Late]
méthode : countsAsAbsent() : bool → true seulement pour Absent (non justifié)
méthode : countsAsExcused() : bool → true seulement pour Excused

### app/Enums/JustificationStatus.php
cases : Pending, Approved, Rejected
values: 'pending', 'approved', 'rejected'
méthode : label() → "En attente", "Approuvée", "Rejetée"
méthode : color() → 'orange', 'green', 'red'

## GÉNÈRE LES MODELS

### Attendance.php

$fillable : enrollment_id, timetable_entry_id, date, period_id,
            status, minutes_late, recorded_by, recorded_at, note

Casts :
  date → 'date'
  status → AttendanceStatus::class
  recorded_at → 'datetime'

Relations :
  enrollment()      → belongsTo Enrollment
  timetableEntry()  → belongsTo TimetableEntry (nullable)
  period()          → belongsTo Period (nullable)
  recordedBy()      → belongsTo User

Accessors :
  getStudentAttribute() : Student → $this->enrollment->student
  getIsAbsentAttribute() : bool → $this->status->isAbsent()
  getIsPresentAttribute() : bool → $this->status->isPresent()

Scopes :
  scopeForEnrollment($query, int $enrollmentId)
  scopeForClass($query, int $classeId)
    → via join enrollments on enrollments.id = attendances.enrollment_id
    → where enrollments.classe_id = $classeId
  scopeForDate($query, Carbon|string $date)
  scopeForPeriod($query, int $periodId)
  scopeForEntry($query, int $entryId)
  scopeAbsent($query) → whereIn('status', ['absent', 'excused'])
  scopeUnjustified($query) → where('status', 'absent')
  scopeJustified($query) → where('status', 'excused')
  scopePresent($query) → whereIn('status', ['present', 'late'])
  scopeBetweenDates($query, string $from, string $to)

### AbsenceJustification.php

$fillable : enrollment_id, date_from, date_to, reason, document_path,
            status, reviewed_by, reviewed_at, review_note, submitted_by

Casts :
  date_from → 'date'
  date_to → 'date'
  status → JustificationStatus::class
  reviewed_at → 'datetime'

Relations :
  enrollment()  → belongsTo Enrollment
  reviewedBy()  → belongsTo User
  submittedBy() → belongsTo User
  attendances() → hasMany Attendance (via enrollment_id + date range)
    → custom relation :
      return $this->hasMany(Attendance::class, 'enrollment_id', 'enrollment_id')
                  ->whereBetween('date', [$this->date_from, $this->date_to]);

Scopes :
  scopePending($query) → where('status', 'pending')
  scopeApproved($query)
  scopeForEnrollment($query, int $enrollmentId)

## GÉNÈRE LES SERVICES

### AttendanceService.php

// ── Saisie des présences ───────────────────────────────────

recordForEntry(TimetableEntry $entry, Carbon $date, array $records, User $by) : array
  records = [
    ['enrollment_id' => X, 'status' => 'present'],
    ['enrollment_id' => Y, 'status' => 'absent', 'note' => 'Sans raison'],
    ['enrollment_id' => Z, 'status' => 'late', 'minutes_late' => 15],
  ]
  → Vérifier que la date correspond au bon jour de semaine du time_slot
  → Déduire le period_id depuis la date
  → Pour chaque record : updateOrCreate(['enrollment_id','timetable_entry_id','date'])
  → Invalider cache des stats de la classe
  → Retourner : { recorded: int, errors: [...] }

recordForDay(int $classeId, Carbon $date, array $records, User $by) : array
  → Saisie journée entière (timetable_entry_id = NULL)
  → Même logique que recordForEntry mais sans entry

getForEntry(TimetableEntry $entry, Carbon $date) : Collection
  → Toutes les présences pour ce créneau à cette date
  → eager load : enrollment.student

getForClass(int $classeId, Carbon $date) : array
  → Présences de TOUS les élèves d'une classe pour une date
  → Organisées par timetable_entry (cours du jour)
  → Format :
    [
      {
        time_slot: TimeSlot,
        timetable_entry: TimetableEntry,
        attendances: [
          { student: Student, status: '...', is_recorded: bool }
        ],
        summary: { present: int, absent: int, late: int, excused: int, total: int }
      }
    ]

getSheetForEntry(TimetableEntry $entry, Carbon $date) : array
  → Feuille d'appel pour un créneau précis
  → Tous les élèves inscrits + leur statut (null si pas encore saisi)
  → Trié par nom de famille
  → Format :
    {
      entry: TimetableEntry,
      date: string,
      is_recorded: bool,          // true si au moins une présence saisie
      students: [
        {
          enrollment_id: int,
          student: Student,
          attendance: Attendance | null,  // null = pas encore saisi
          status: AttendanceStatus | null,
        }
      ]
    }

// ── Statistiques ───────────────────────────────────────────

getStudentStats(int $enrollmentId, ?int $periodId = null, ?int $yearId = null) : array
  → Statistiques d'absences d'un élève :
    {
      total_courses: int,        // nb total de créneaux
      present: int,
      absent: int,               // non justifiés
      late: int,
      excused: int,              // justifiés
      total_absent_hours: float, // total heures d'absence (justif + non)
      absent_hours: float,       // heures non justifiées
      excused_hours: float,      // heures justifiées
      attendance_rate: float,    // % de présence (0-100)
    }

getClassStats(int $classeId, Carbon $date) : array
  → Statistiques pour une classe pour une date donnée ou une période

getPeriodStats(int $classeId, int $periodId) : array
  → Statistiques pour toute la période
  → Par élève : { student, attendance_rate, absent_hours, excused_hours }
  → Triées par taux d'absence décroissant (les plus absents en premier)

updateReportCardAbsences(int $enrollmentId, int $reportCardId) : void
  → Recalcule absences_justified et absences_unjustified sur report_cards
  → Utilise getStudentStats() pour la période du bulletin
  → Met à jour ReportCard::update([...])

// ── Justifications ─────────────────────────────────────────

submitJustification(array $data, User $submittedBy) : AbsenceJustification
  data : enrollment_id, date_from, date_to, reason, document (UploadedFile nullable)
  → Upload du document si fourni → storage/app/tenant_{slug}/justifications/
  → Créer la justification en status=pending

approveJustification(AbsenceJustification $justif, User $reviewer, string $note = '') : AbsenceJustification
  → status = approved, reviewed_by, reviewed_at = now()
  → Mettre à jour toutes les attendances 'absent' de l'élève
    dans la plage date_from → date_to → status = 'excused'
  → Dispatch UpdateReportCardAbsencesJob (mise à jour bulletins)

rejectJustification(AbsenceJustification $justif, User $reviewer, string $note) : AbsenceJustification
  → status = rejected, review_note = $note

## JOB : UpdateReportCardAbsencesJob.php

Queue : 'attendances'
Payload : enrollment_id, report_card_ids (array)

handle() :
  → Pour chaque report_card_id :
    app(AttendanceService::class)->updateReportCardAbsences($enrollmentId, $rcId)

## COMMANDES DE TEST (tinker)

$service = app(App\Services\AttendanceService::class);

// Récupérer la feuille d'appel
$sheet = $service->getSheetForEntry($timetableEntry, Carbon::today());
$sheet['students'] // → liste élèves avec status null (pas encore saisi)

// Saisir les présences
$service->recordForEntry($entry, Carbon::today(), [
  ['enrollment_id' => 1, 'status' => 'present'],
  ['enrollment_id' => 2, 'status' => 'absent', 'note' => 'Sans motif'],
  ['enrollment_id' => 3, 'status' => 'late', 'minutes_late' => 10],
], $user);

// Stats d'un élève
$stats = $service->getStudentStats(enrollmentId: 1, periodId: 1);
// → { total_courses: 45, present: 40, absent: 3, late: 2, excused: 0,
//     absent_hours: 3.0, attendance_rate: 93.3 }

// Approuver une justification
$justif = AbsenceJustification::find(1);
$service->approveJustification($justif, $user, 'Certificat médical valide');
// → toutes les absences de la période → status = 'excused'
```

---

## SESSION 9.3 — Controllers + Resources + Routes

```
## CONTEXTE PROJET — ENMA SCHOOL

Stack : PHP 8.3 / Laravel 12
Conventions : strict_types=1, Trait ApiResponse, Form Requests, Resources

Phase 9 Sessions 1 & 2 terminées ✅

## GÉNÈRE LES API RESOURCES

### AttendanceResource.php
{
  id,
  date (d/m/Y),
  status: { value, label, short, color },
  minutes_late: int | null,
  note: string | null,
  is_absent: bool,
  is_present: bool,
  recorded_at: string | null,
  recorded_by: { id, full_name } | null (whenLoaded),
  enrollment: { id, student: StudentListResource } (whenLoaded),
  timetable_entry: {
    id, subject: { name, code, color },
    time_slot: { time_range, day_label }
  } | null (whenLoaded),
  period: { id, name } | null (whenLoaded),
}

### AttendanceSheetResource.php
{
  entry: TimetableEntryResource | null,
  date: string,
  is_recorded: bool,
  summary: {
    present: int, absent: int, late: int, excused: int,
    total: int, attendance_rate: float,
  },
  students: [
    {
      enrollment_id: int,
      student: StudentListResource,
      attendance: AttendanceResource | null,
      status: string | null,          // null = pas encore saisi
      status_label: string | null,
      status_color: string | null,
    }
  ]
}

### StudentAttendanceStatsResource.php
{
  enrollment_id: int,
  student: StudentListResource (whenLoaded),
  period: { id, name } | null (whenLoaded),
  total_courses: int,
  present: int,
  absent: int,
  late: int,
  excused: int,
  total_absent_hours: float,
  absent_hours: float,
  excused_hours: float,
  attendance_rate: float,    // % de présence (0-100)
  is_at_risk: bool,          // true si attendance_rate < seuil configuré (ex: 80%)
}

### ClassAttendanceStatsResource.php
{
  classe: { id, display_name },
  period: { id, name } | null,
  date: string | null,
  summary: {
    total_students: int,
    avg_attendance_rate: float,
    students_at_risk: int,   // sous le seuil d'alerte
  },
  students: StudentAttendanceStatsResource[]
}

### AbsenceJustificationResource.php
{
  id,
  date_from (d/m/Y), date_to (d/m/Y),
  days_count: int,    // nombre de jours couverts
  reason: string,
  document_url: string | null,
  status: { value, label, color },
  review_note: string | null,
  reviewed_at: string | null,
  reviewed_by: { id, full_name } | null (whenLoaded),
  submitted_by: { id, full_name } | null (whenLoaded),
  enrollment: { id, student: StudentListResource } (whenLoaded),
  affected_attendances_count: int,
  created_at: string,
}

## GÉNÈRE LES FORM REQUESTS

### RecordAttendanceRequest
  entry_id         : nullable, exists:timetable_entries,id
  date             : required, date, before_or_equal:today
  records          : required, array, min:1
  records.*.enrollment_id : required, exists:enrollments,id
  records.*.status        : required, in: AttendanceStatus cases
  records.*.minutes_late  : required_if:records.*.status,late,
                            integer, min:1, max:120
  records.*.note          : nullable, string, max:300
  Messages :
    "La date ne correspond pas au jour de ce créneau"
    "Cet élève n'est pas inscrit dans cette classe"

### SubmitJustificationRequest
  enrollment_id    : required, exists:enrollments,id
  date_from        : required, date
  date_to          : required, date, after_or_equal:date_from
  reason           : required, string, max:500
  document         : nullable, file, mimes:pdf,jpg,jpeg,png, max:5120
  Messages :
    "La date de fin doit être après la date de début"

### ReviewJustificationRequest
  action           : required, in:approve,reject
  review_note      : required_if:action,reject, string, max:500

## GÉNÈRE LES CONTROLLERS

### AttendanceController

// Feuille d'appel
sheet() → GET /school/attendance/sheet
  params: entry_id (nullable), class_id, date
  → permission: attendance.view
  → Si entry_id fourni → getSheetForEntry()
  → Sinon → getForClass() (toute la journée)
  → AttendanceSheetResource

record() → POST /school/attendance/record
  → permission: attendance.input
  → RecordAttendanceRequest
  → Vérifier que l'enseignant est affecté à ce cours (si rôle teacher)
    school_admin/director → peut tout saisir
  → recordForEntry() ou recordForDay()
  → Retourne AttendanceSheetResource mis à jour

// Stats
studentStats() → GET /school/attendance/student/{enrollment}
  params: period_id, academic_year_id
  → permission: attendance.view
  → StudentAttendanceStatsResource

classStats() → GET /school/attendance/class/{classe}
  params: period_id, date, academic_year_id
  → permission: attendance.view
  → ClassAttendanceStatsResource

// Historique d'un élève
studentHistory() → GET /school/attendance/student/{enrollment}/history
  params: date_from, date_to, status, per_page
  → AttendanceResource paginé

// Vue calendrier d'une classe
classCalendar() → GET /school/attendance/class/{classe}/calendar
  params: year_id, month (YYYY-MM)
  → permission: attendance.view
  → Pour chaque jour du mois : taux de présence de la classe
  → Format :
    [
      { date: "2025-01-13", attendance_rate: 95.2, recorded: true },
      { date: "2025-01-14", attendance_rate: 87.5, recorded: true },
      { date: "2025-01-15", attendance_rate: null, recorded: false },
    ]

### JustificationController

index() → GET /school/justifications
  params: status, enrollment_id, class_id, date_from, date_to, per_page
  → permission: attendance.view
  → AbsenceJustificationResource paginé

store() → POST /school/justifications
  → permission: attendance.input (staff/admin)
  → SubmitJustificationRequest
  → Upload document si présent

show() → GET /school/justifications/{justification}

review() → POST /school/justifications/{justification}/review
  → permission: attendance.reports (director/admin)
  → ReviewJustificationRequest
  → approve ou reject

destroy() → DELETE /school/justifications/{justification}
  → permission: attendance.reports
  → Seulement si status = pending

## ROUTES

Route::middleware(['auth:sanctum', 'tenant.active',
                   'module:attendance'])->group(function () {
  Route::prefix('school')->group(function () {

    // ── Présences ──────────────────────────────────────
    Route::get('attendance/sheet', [AttendanceController::class, 'sheet'])
         ->middleware('can:attendance.view');
    Route::post('attendance/record', [AttendanceController::class, 'record'])
         ->middleware('can:attendance.input');

    Route::get('attendance/student/{enrollment}',
         [AttendanceController::class, 'studentStats'])
         ->middleware('can:attendance.view');
    Route::get('attendance/student/{enrollment}/history',
         [AttendanceController::class, 'studentHistory'])
         ->middleware('can:attendance.view');
    Route::get('attendance/class/{classe}',
         [AttendanceController::class, 'classStats'])
         ->middleware('can:attendance.view');
    Route::get('attendance/class/{classe}/calendar',
         [AttendanceController::class, 'classCalendar'])
         ->middleware('can:attendance.view');

    // ── Justifications ─────────────────────────────────
    Route::apiResource('justifications', JustificationController::class)
         ->only(['index','store','show','destroy']);
    Route::post('justifications/{justification}/review',
         [JustificationController::class, 'review'])
         ->middleware('can:attendance.reports');
  });
});

## TESTS HOPPSCOTCH

// Récupérer la feuille d'appel d'un cours
GET /api/school/attendance/sheet?entry_id=1&date=2025-01-13
→ AttendanceSheetResource : 35 élèves, statuts null (pas encore saisi)

// Saisir les présences
POST /api/school/attendance/record
{
  "entry_id": 1,
  "date": "2025-01-13",
  "records": [
    {"enrollment_id": 1, "status": "present"},
    {"enrollment_id": 2, "status": "absent", "note": "Non présent à l'appel"},
    {"enrollment_id": 3, "status": "late", "minutes_late": 12},
    {"enrollment_id": 4, "status": "present"}
  ]
}
→ { recorded: 4, errors: [] }
→ AttendanceSheetResource mis à jour

// Stats d'un élève
GET /api/school/attendance/student/1?period_id=1
→ { total_courses: 45, present: 40, absent: 3, late: 2, excused: 0,
    attendance_rate: 93.3, is_at_risk: false }

// Stats de la classe
GET /api/school/attendance/class/1?period_id=1
→ { summary: { avg_attendance_rate: 91.5, students_at_risk: 3 },
    students: [...35 élèves triés par taux d'absence...] }

// Soumettre une justification
POST /api/school/justifications
{
  "enrollment_id": 2,
  "date_from": "2025-01-13",
  "date_to": "2025-01-15",
  "reason": "Maladie — certificat médical joint"
}
→ 201, JustificationResource en status 'pending'

// Approuver une justification
POST /api/school/justifications/1/review
{ "action": "approve", "review_note": "Certificat médical valide" }
→ 200, statuts des absences → 'excused'

// Calendrier mensuel d'une classe
GET /api/school/attendance/class/1/calendar?year_id=1&month=2025-01
→ [{ date:"2025-01-13", attendance_rate:95.2, recorded:true }, ...]
```

---

## SESSION 9.4 — Frontend : Types + API + Hooks

```
## CONTEXTE PROJET — ENMA SCHOOL

Stack : React 18 + TypeScript 5, TanStack Query v5, Zustand v4
Types existants : school.types.ts, students.types.ts, timetable.types.ts

Phase 9 Sessions 1-3 terminées ✅

## GÉNÈRE LES FICHIERS SUIVANTS

### src/modules/school/types/attendance.types.ts

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';
export type JustificationStatus = 'pending' | 'approved' | 'rejected';

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: 'Présent',
  absent: 'Absent',
  late: 'En retard',
  excused: 'Absent justifié',
};

export const ATTENDANCE_STATUS_SHORT: Record<AttendanceStatus, string> = {
  present: 'P', absent: 'A', late: 'R', excused: 'AJ',
};

export const ATTENDANCE_STATUS_COLORS: Record<AttendanceStatus, string> = {
  present: 'green', absent: 'red', late: 'orange', excused: 'blue',
};

export const ATTENDANCE_STATUS_BG: Record<AttendanceStatus, string> = {
  present: '#dcfce7', absent: '#fee2e2',
  late: '#ffedd5', excused: '#dbeafe',
};

export interface Attendance {
  id: number;
  date: string;
  status: {
    value: AttendanceStatus;
    label: string;
    short: string;
    color: string;
  };
  minutes_late: number | null;
  note: string | null;
  is_absent: boolean;
  is_present: boolean;
  recorded_at: string | null;
  recorded_by?: { id: number; full_name: string } | null;
  enrollment?: { id: number; student: StudentListItem };
  timetable_entry?: {
    id: number;
    subject: { name: string; code: string; color: string };
    time_slot: { time_range: string; day_label: string };
  } | null;
  period?: { id: number; name: string } | null;
}

export interface AttendanceSheetStudent {
  enrollment_id: number;
  student: StudentListItem;
  attendance: Attendance | null;
  status: AttendanceStatus | null;
  status_label: string | null;
  status_color: string | null;
}

export interface AttendanceSheet {
  entry?: TimetableEntry | null;
  date: string;
  is_recorded: boolean;
  summary: {
    present: number;
    absent: number;
    late: number;
    excused: number;
    total: number;
    attendance_rate: number;
  };
  students: AttendanceSheetStudent[];
}

export interface StudentAttendanceStats {
  enrollment_id: number;
  student?: StudentListItem;
  period?: { id: number; name: string } | null;
  total_courses: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  total_absent_hours: number;
  absent_hours: number;
  excused_hours: number;
  attendance_rate: number;
  is_at_risk: boolean;
}

export interface ClassAttendanceStats {
  classe: { id: number; display_name: string };
  period?: { id: number; name: string } | null;
  date?: string | null;
  summary: {
    total_students: number;
    avg_attendance_rate: number;
    students_at_risk: number;
  };
  students: StudentAttendanceStats[];
}

export interface CalendarDay {
  date: string;
  attendance_rate: number | null;
  recorded: boolean;
}

export interface AbsenceJustification {
  id: number;
  date_from: string;
  date_to: string;
  days_count: number;
  reason: string;
  document_url: string | null;
  status: { value: JustificationStatus; label: string; color: string };
  review_note: string | null;
  reviewed_at: string | null;
  reviewed_by?: { id: number; full_name: string } | null;
  submitted_by?: { id: number; full_name: string } | null;
  enrollment?: { id: number; student: StudentListItem };
  affected_attendances_count: number;
  created_at: string;
}

// Pour la saisie du formulaire d'appel
export interface AttendanceRecord {
  enrollment_id: number;
  status: AttendanceStatus;
  minutes_late?: number;
  note?: string;
}

export interface RecordAttendanceData {
  entry_id?: number | null;
  date: string;
  records: AttendanceRecord[];
}

### src/modules/school/api/attendance.api.ts

import { apiClient } from '@/shared/lib/axios';

export const attendanceApi = {
  getSheet: (params: { entry_id?: number; class_id: number; date: string }) =>
    apiClient.get<ApiSuccess<AttendanceSheet>>('/school/attendance/sheet', { params }),

  record: (data: RecordAttendanceData) =>
    apiClient.post<ApiSuccess<{ recorded: number; errors: unknown[] }>>(
      '/school/attendance/record', data),

  getStudentStats: (enrollmentId: number, params?: { period_id?: number; academic_year_id?: number }) =>
    apiClient.get<ApiSuccess<StudentAttendanceStats>>(
      `/school/attendance/student/${enrollmentId}`, { params }),

  getStudentHistory: (enrollmentId: number, params?: Record<string, unknown>) =>
    apiClient.get<PaginatedResponse<Attendance>>(
      `/school/attendance/student/${enrollmentId}/history`, { params }),

  getClassStats: (classeId: number, params?: { period_id?: number; date?: string; academic_year_id?: number }) =>
    apiClient.get<ApiSuccess<ClassAttendanceStats>>(
      `/school/attendance/class/${classeId}`, { params }),

  getClassCalendar: (classeId: number, params: { year_id: number; month: string }) =>
    apiClient.get<ApiSuccess<CalendarDay[]>>(
      `/school/attendance/class/${classeId}/calendar`, { params }),
};

export const justificationsApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<PaginatedResponse<AbsenceJustification>>('/school/justifications', { params }),

  getOne: (id: number) =>
    apiClient.get<ApiSuccess<AbsenceJustification>>(`/school/justifications/${id}`),

  submit: (formData: FormData) =>
    apiClient.post<ApiSuccess<AbsenceJustification>>('/school/justifications', formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }),

  review: (id: number, data: { action: 'approve' | 'reject'; review_note?: string }) =>
    apiClient.post<ApiSuccess<AbsenceJustification>>(
      `/school/justifications/${id}/review`, data),

  delete: (id: number) =>
    apiClient.delete(`/school/justifications/${id}`),
};

### src/modules/school/hooks/useAttendance.ts

// Feuilles d'appel
useAttendanceSheet(entryId, classeId, date)
  → useQuery key: ['attendance-sheet', entryId, classeId, date]
  → staleTime: 30 secondes (données quasi temps réel)

useRecordAttendance()
  → useMutation + invalidate ['attendance-sheet', 'student-attendance-stats']

// Stats
useStudentAttendanceStats(enrollmentId, periodId)
  → useQuery key: ['student-attendance-stats', enrollmentId, periodId]

useStudentAttendanceHistory(enrollmentId, filters)
  → useQuery key: ['student-attendance-history', enrollmentId, filters]

useClassAttendanceStats(classeId, periodId)
  → useQuery key: ['class-attendance-stats', classeId, periodId]

useClassAttendanceCalendar(classeId, yearId, month)
  → useQuery key: ['attendance-calendar', classeId, yearId, month]

// Justifications
useJustifications(filters)
  → useQuery key: ['justifications', filters]

useSubmitJustification()
  → useMutation + invalidate ['justifications', 'student-attendance-stats']

useReviewJustification()
  → useMutation + invalidate ['justifications', 'student-attendance-stats']

useDeleteJustification()
  → useMutation + invalidate ['justifications']

### src/modules/school/lib/attendanceHelpers.ts

export function getStatusColor(status: AttendanceStatus): string { ... }
export function getStatusBg(status: AttendanceStatus): string { ... }
export function getStatusShort(status: AttendanceStatus): string { ... }
export function getStatusLabel(status: AttendanceStatus): string { ... }

export function getAttendanceRateColor(rate: number, threshold = 80): string {
  if (rate >= threshold) return 'green';
  if (rate >= threshold * 0.9) return 'orange';
  return 'red';
}

export function isAtRiskThreshold(rate: number, threshold = 80): boolean {
  return rate < threshold;
}

export function formatAbsenceHours(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  return `${hours.toFixed(1)}h`;
}

export function getJustificationStatusColor(status: JustificationStatus): string {
  const colors = { pending: 'orange', approved: 'green', rejected: 'red' };
  return colors[status];
}

// Pour la saisie rapide clavier dans la feuille d'appel
export const STATUS_KEYBOARD_MAP: Record<string, AttendanceStatus> = {
  'p': 'present', 'a': 'absent', 'r': 'late', 'j': 'excused',
};
```

---

## SESSION 9.5 — Frontend Pages

```
## CONTEXTE PROJET — ENMA SCHOOL

Stack : React 18 + TypeScript 5, Tailwind + shadcn/ui, TanStack Query v5
Types, API, Hooks créés en Session 9.4 ✅

## GÉNÈRE LES PAGES ET COMPOSANTS

### 1. AttendancePage.tsx — Page principale des présences

URL : /school/attendance

HEADER :
  Titre "Présences & Absences"
  Onglets : [📋 Feuille d'appel] [📊 Statistiques] [📁 Justifications]
  Sélecteurs : Année scolaire | Classe | Date (date picker)

### 2. AttendanceSheetPage.tsx — Feuille d'appel

URL : /school/attendance/sheet

C'est la PAGE CENTRALE de la Phase 9 — utilisée par l'enseignant
pour faire l'appel au début de chaque cours.

HEADER :
  Classe : "6ème 1" | Cours : "Mathématiques — 07h30-08h30"
  Date : Lundi 13 Janvier 2025
  Sélecteur de cours du jour (si plusieurs cours)
  Bouton : [✅ Valider l'appel]
  Badge : "Appel effectué" (vert) ou "Appel en attente" (orange)

ACTIONS RAPIDES (au-dessus du tableau) :
  [Tous présents] → marque tout le monde présent en un clic
  [Réinitialiser]

TABLEAU DE SAISIE :

  ┌───┬──────────────────────┬──────┬──────┬──────┬──────┬─────────────┐
  │ # │ Élève                │  P   │  A   │  R   │  AJ  │  Retard/Min │
  ├───┼──────────────────────┼──────┼──────┼──────┼──────┼─────────────┤
  │ 1 │ BAMBA Aminata        │  ●   │      │      │      │     —       │
  │ 2 │ COULIBALY Jean-Marc  │      │  ●   │      │      │     —       │
  │ 3 │ DABO Marie-Louise    │      │      │  ●   │      │    [15]     │
  │ 4 │ FADIGA Oumar         │  ●   │      │      │      │     —       │
  └───┴──────────────────────┴──────┴──────┴──────┴──────┴─────────────┘

  INTERACTIONS :
  - Clic sur un bouton radio (P/A/R/AJ) → sélectionne le statut
  - Si R (Retard) → input numérique "Minutes" apparaît
  - Navigation clavier : flèches haut/bas changent d'élève,
    P/A/R/J (keyboard shortcuts) changent le statut
  - Sauvegarde automatique après chaque changement (debounce 800ms)
  - AutoSaveIndicator en haut à droite

RÉSUMÉ EN BAS :
  Présents: 28 | Absents: 4 | En retard: 2 | Justifiés: 1 | Total: 35
  Taux de présence : 91.4%

### 3. ClassAttendanceStatsPage.tsx — Statistiques de la classe

URL : /school/attendance/class/:id

FILTRES : Période | Date | Année scolaire

TABLEAU DES ÉLÈVES :
  Colonnes : Élève | Présences | Absences | Retards | Justifiés | Taux | Alerte

  Chaque ligne :
  - Barre de progression colorée (taux de présence)
  - Badge 🔴 "À risque" si taux < seuil (ex: 80%)
  - Clic → StudentAttendanceDetailModal

RÉSUMÉ CLASSE :
  Taux moyen : 91.5% | Élèves à risque : 3/35

GRAPHIQUE (Recharts) :
  - BarChart : absences par matière (quels cours sont les plus manqués)
  - LineChart : évolution du taux de présence dans le temps

### 4. StudentAttendanceTab.tsx — Onglet Présences dans StudentDetailPage

Mise à jour de StudentDetailPage (Phase 4) :
Remplace le placeholder "Présences — Disponible Phase 9".

AFFICHAGE :
  Stats globales : Taux de présence | Heures d'absence | Justifiées / Non justifiées

  CALENDRIER MENSUEL :
    Vue mini-calendrier coloré (vert/orange/rouge/bleu par jour)
    Légende : Présent / Absent / En retard / Justifié

  HISTORIQUE DES ABSENCES :
    Tableau paginé : Date | Cours | Statut | Enseignant | Note
    Actions : [Justifier] (si absent non justifié)

  JUSTIFICATIONS :
    Liste des justifications soumises avec statut (En attente / Approuvée / Rejetée)

### 5. JustificationsPage.tsx — Gestion des justifications

URL : /school/attendance/justifications

FILTRES : Statut (Toutes / En attente / Approuvées / Rejetées) | Classe | Dates

TABLEAU :
  Élève | Classe | Période | Motif | Statut | Soumis le | Actions

ACTIONS :
  En attente → [✅ Approuver] [❌ Rejeter]
  Approuvée  → affichage seul
  Rejetée    → [Relancer]

### 6. SubmitJustificationModal.tsx — Soumettre une justification

FORMULAIRE :
  1. Élève (pré-rempli si ouvert depuis le dossier)
  2. Période d'absence : Date début → Date fin
     → Afficher automatiquement les absences trouvées dans cette période :
       "3 absences non justifiées trouvées (13/01, 14/01, 15/01)"
  3. Motif (textarea)
  4. Document justificatif (upload PDF/image, optionnel)
     → Zone drag & drop

### 7. AttendanceCalendarWidget.tsx — Widget calendrier mensuel

Composant réutilisable pour la vue mensuelle.
Props: { days: CalendarDay[]; month: string }

Affiche un mini-calendrier avec :
  - Fond vert si recorded + attendance_rate >= 90%
  - Fond orange si recorded + attendance_rate 70-90%
  - Fond rouge si recorded + attendance_rate < 70%
  - Fond gris si not recorded
  - Fond blanc si week-end / jour non scolaire
  - Tooltip au survol : "Taux: 91.4% — 2 absents"

### 8. QuickAttendanceSidebar.tsx — Panneau rapide depuis l'emploi du temps

Composant intégré dans TimetablePage (Phase 8).
Affiché quand l'enseignant clique sur un cours du jour dans son planning.

CONTENU :
  Titre : "Appel — 6ème 1 — Maths — 07h30"
  Mini-feuille d'appel rapide (compact)
  Bouton [Voir l'appel complet →]

## COMPOSANTS À CRÉER

1. AttendanceStatusButton.tsx
   Props: { status: AttendanceStatus | null; selected: boolean; onClick: fn }
   → Bouton radio stylisé : "P" (vert) | "A" (rouge) | "R" (orange) | "AJ" (bleu)

2. AttendanceStatusBadge.tsx
   Props: { status: AttendanceStatus | null }
   → Badge ou point coloré selon le statut

3. AttendanceRateBar.tsx
   Props: { rate: number; threshold?: number; showLabel?: boolean }
   → Barre de progression avec couleur et étiquette "91.4%"
   → Rouge si sous le seuil

4. AttendanceRateDonut.tsx
   Props: { stats: StudentAttendanceStats }
   → Donut chart Recharts : P / A / R / AJ

5. JustificationStatusBadge.tsx
   Props: { status: JustificationStatus }
   → "En attente" (orange) | "Approuvée" (vert) | "Rejetée" (rouge)

6. AbsenceRiskBadge.tsx
   Props: { rate: number; threshold?: number }
   → Badge "⚠️ À risque" rouge si rate < threshold

7. AttendanceSummaryBar.tsx
   Props: { summary: AttendanceSheet['summary'] }
   → Barre segmentée : Présents (vert) / Retards (orange) / Absents (rouge) / Justifiés (bleu)
   → Ex: "28 | 2 | 3 | 1 — Taux: 91.4%"

## NAVIGATION (mise à jour)

Ajouter dans navigation.ts :
  /school/attendance                    → AttendancePage     (icône: ClipboardCheck)
  /school/attendance/sheet              → AttendanceSheetPage
  /school/attendance/class/:id          → ClassAttendanceStatsPage
  /school/attendance/justifications     → JustificationsPage

## INTÉGRATION AVEC LES AUTRES PHASES

### Mise à jour TimetablePage (Phase 8)
  → Ajouter bouton [📋 Faire l'appel] sur chaque cours du jour
  → Redirige vers AttendanceSheetPage avec entry_id pré-rempli
  → Ou ouvre QuickAttendanceSidebar

### Mise à jour StudentDetailPage (Phase 4)
  → Onglet "Présences" remplace le placeholder

### Mise à jour ReportCardEditorPage (Phase 7)
  → Dans la card "Absences" → charger automatiquement les stats
    via useStudentAttendanceStats(enrollmentId, periodId)
  → Pré-remplir absences_justified et absences_unjustified
  → Bouton [↻ Recalculer depuis les présences]

## RÈGLES UX IMPORTANTES

1. Navigation clavier dans la feuille d'appel :
   → Flèche bas/haut = élève suivant/précédent
   → P = Présent, A = Absent, R = Retard, J = Justifié
   → Tab = champ retard si R sélectionné
   → Entrée = confirme et passe au suivant

2. [Tous présents] en un clic :
   → Pratique pour les classes avec peu d'absences
   → Suivi des exceptions individuelles

3. Sauvegarde auto après chaque changement (debounce 800ms)
   → Pas de bouton "Enregistrer"
   → AutoSaveIndicator discret

4. Alerte visuelle pour les élèves à risque :
   → Badge rouge dans tous les tableaux
   → Threshold configurable dans school_settings

5. La justification affiche les absences impactées AVANT validation
   → "Cette justification couvrir 3 absences non justifiées"
```

---

## RÉCAPITULATIF PHASE 9

| Session | Contenu | Fichiers clés |
|---------|---------|---------------|
| 9.1 | Migrations | `attendances`, `absence_justifications` |
| 9.2 | Enums + Models + Services + Job | `Attendance`, `AbsenceJustification`, `AttendanceService`, `UpdateReportCardAbsencesJob` |
| 9.3 | Controllers + Resources + Routes | `AttendanceController`, `JustificationController`, `AttendanceSheetResource`, `ClassAttendanceStatsResource` |
| 9.4 | Frontend Types + API + Hooks | `attendance.types.ts`, `attendance.api.ts`, `useAttendance.ts`, `attendanceHelpers.ts` |
| 9.5 | Frontend Pages + Composants | `AttendanceSheetPage` (feuille d'appel avec navigation clavier), `StudentAttendanceTab`, `JustificationsPage`, `AttendanceCalendarWidget` |

---

### Points d'attention critiques

1. **UNIQUE(enrollment_id, timetable_entry_id, date)** — utiliser
   `updateOrCreate` pour la saisie (jamais d'insert brut), gérer
   le cas `timetable_entry_id = NULL` avec un index partiel PostgreSQL

2. **Lien avec les bulletins (Phase 7)** — `UpdateReportCardAbsencesJob`
   dispatché après chaque approbation de justification pour mettre à jour
   les champs `absences_justified/unjustified` sur les `report_cards`

3. **Seuil d'alerte configurable** — lire depuis `SchoolSetting::get('attendance_risk_threshold', 80)`
   pour le badge "À risque" (ne pas hardcoder 80%)

4. **Navigation clavier** — la feuille d'appel doit supporter la saisie
   entièrement au clavier (P/A/R/J) pour les enseignants qui font
   l'appel rapidement sur tablette ou laptop

5. **Intégration Phase 7 et Phase 8** — mettre à jour `ReportCardEditorPage`
   pour charger automatiquement les stats de présence, et `TimetablePage`
   pour ouvrir la feuille d'appel depuis l'emploi du temps
