# ENMA SCHOOL — PROMPTS PHASE 8
## Emploi du Temps

---

> ## PÉRIMÈTRE DE LA PHASE 8
>
> **Objectif :** Créer et gérer les emplois du temps des classes et des enseignants,
> avec gestion des créneaux horaires, des salles et des conflits.
>
> **Tables nouvelles :**
> | Table | Description |
> |-------|-------------|
> | `time_slots` | Définition des créneaux horaires de l'école (8h-9h, 9h-10h...) |
> | `timetable_entries` | Affectation d'un créneau : classe + matière + enseignant + salle |
> | `timetable_overrides` | Modification ponctuelle d'un créneau (annulation, remplacement) |
>
> **Concepts clés :**
> - Un **time_slot** définit les plages horaires standards de l'école
>   (ex: Lundi 08h00-09h00, Lundi 09h00-10h00, etc.)
> - Un **timetable_entry** place une matière dans un créneau pour une classe
>   avec un enseignant et une salle pour toute la durée de l'année
> - Un **timetable_override** gère les exceptions ponctuelles :
>   cours annulé, enseignant remplacé, salle changée, jour férié
> - La bibliothèque **FullCalendar** est déjà dans le stack (react)
> - Les **conflits** sont détectés automatiquement :
>   un enseignant ne peut pas être dans 2 classes en même temps
>   une salle ne peut pas accueillir 2 classes en même temps
>
> **Jours scolaires en Côte d'Ivoire :**
>   Lundi, Mardi, Mercredi, Jeudi, Vendredi (et parfois Samedi matin)
>
> **HORS PÉRIMÈTRE Phase 8 :**
> - Génération automatique d'emploi du temps (algorithme) → complexe, V2
> - Emploi du temps des examens → V2
>
> **Dépendances requises :**
> - Phase 2 ✅ (classes, subjects, rooms, school_settings)
> - Phase 5 ✅ (teacher_classes — affectations enseignant/classe/matière)

---

## SESSION 8.1 — Migrations

```
## CONTEXTE PROJET — ENMA SCHOOL

Stack : PHP 8.3 / Laravel 12 / PostgreSQL 18
Multi-tenant : stancl/tenancy v3 (schema-per-tenant)

Phases terminées :
- Phase 0-1 : Auth, SuperAdmin
- Phase 2 : classes, subjects, rooms, school_settings, academic_years, periods
- Phase 3 : users, rôles, permissions
- Phase 4 : students, enrollments
- Phase 5 : teachers, teacher_classes (affectations)
- Phase 6 : evaluations, grades, period_averages
- Phase 7 : report_cards, appréciations

Tables existantes utiles :
  classes(id, display_name, school_level_id, academic_year_id, capacity)
  subjects(id, name, code, coefficient)
  rooms(id, name, code, type, capacity)
  teachers(id, user_id, weekly_hours_max)
  teacher_classes(id, teacher_id, class_id, subject_id, academic_year_id, hours_per_week)
  academic_years(id, name, is_current)

## CETTE SESSION — Phase 8 : Migrations

Toutes les migrations dans database/migrations/tenant/

## GÉNÈRE LES MIGRATIONS (dans l'ordre)

### 1. create_time_slots_table

Objectif : définir les créneaux horaires standards de l'école.
           Ces créneaux sont configurés une fois et réutilisés pour
           tous les emplois du temps de l'année.

Colonnes :
  id
  name           (string) — ex: "1er cours", "2ème cours", "Récréation"
  day_of_week    (unsignedTinyInteger)
                 1=Lundi, 2=Mardi, 3=Mercredi, 4=Jeudi, 5=Vendredi, 6=Samedi
  start_time     (time) — ex: "08:00:00"
  end_time       (time) — ex: "09:00:00"
  duration_minutes (unsignedSmallInteger, généré/calculé) — ex: 60
  is_break       (boolean, default:false)
                 true = récréation/pause (pas de cours possible)
  order          (unsignedSmallInteger) — ordre d'affichage dans la journée
  is_active      (boolean, default:true)
  timestamps

  UNIQUE(day_of_week, start_time)
  Index : day_of_week, order, is_active

  NB : Pas de soft_deletes. Si un créneau est supprimé, les timetable_entries
       associées doivent être supprimées en cascade.

### 2. create_timetable_entries_table

Objectif : placement d'une matière dans un créneau pour une classe,
           valable pour toute l'année scolaire (récurrence hebdomadaire).

Colonnes :
  id
  academic_year_id (foreignId → academic_years, cascadeOnDelete)
  class_id         (foreignId → classes, cascadeOnDelete)
  time_slot_id     (foreignId → time_slots, cascadeOnDelete)
  subject_id       (foreignId → subjects, cascadeOnDelete)
  teacher_id       (foreignId → teachers, nullOnDelete, nullable)
  room_id          (foreignId → rooms, nullOnDelete, nullable)
  color            (string 7, nullable) — couleur hex pour affichage calendrier
                   Si null → utilise la couleur de la matière
  notes            (text, nullable) — remarques sur ce cours
  is_active        (boolean, default:true)
  created_by       (foreignId → users, nullOnDelete, nullable)
  timestamps

  -- Contrainte d'unicité : une classe ne peut avoir qu'un cours par créneau
  UNIQUE(class_id, time_slot_id, academic_year_id)

  -- Contraintes de conflits (validées en application, pas en DB) :
  -- 1. Un teacher ne peut pas avoir 2 entrées sur le même time_slot
  -- 2. Une room ne peut pas avoir 2 entrées sur le même time_slot

  Index :
    academic_year_id, class_id, time_slot_id,
    teacher_id, room_id, subject_id

### 3. create_timetable_overrides_table

Objectif : modification ponctuelle d'un créneau pour une date précise.
           Ex: cours annulé le 15/01, remplacement enseignant le 22/02.

Colonnes :
  id
  timetable_entry_id (foreignId → timetable_entries, cascadeOnDelete)
  date               (date) — date précise de la modification
  type               (enum: cancellation/substitution/room_change/rescheduled)
                     cancellation = cours annulé
                     substitution = changement d'enseignant
                     room_change  = changement de salle
                     rescheduled  = déplacé à un autre créneau
  substitute_teacher_id (foreignId → teachers, nullOnDelete, nullable)
                          pour type=substitution
  new_room_id           (foreignId → rooms, nullOnDelete, nullable)
                          pour type=room_change
  rescheduled_to_slot_id (foreignId → time_slots, nullOnDelete, nullable)
                          pour type=rescheduled
  reason             (string, nullable) — motif de la modification
  notified_at        (timestamp, nullable) — date d'envoi de la notification (Phase 11)
  created_by         (foreignId → users, nullOnDelete, nullable)
  timestamps

  UNIQUE(timetable_entry_id, date)
  Index : timetable_entry_id, date, type

## SEEDER : TimeSlotSeeder.php

Créer les créneaux horaires standards pour une école ivoirienne.

Schéma type (Lundi à Vendredi) :
  07h30 - 08h30 → "1er cours"    (60 min, is_break: false, order: 1)
  08h30 - 09h30 → "2ème cours"   (60 min, is_break: false, order: 2)
  09h30 - 10h30 → "3ème cours"   (60 min, is_break: false, order: 3)
  10h30 - 11h00 → "Récréation"   (30 min, is_break: true,  order: 4)
  11h00 - 12h00 → "4ème cours"   (60 min, is_break: false, order: 5)
  12h00 - 13h00 → "5ème cours"   (60 min, is_break: false, order: 6)
  13h00 - 15h00 → "Pause déj."   (120 min, is_break: true, order: 7)
  15h00 - 16h00 → "6ème cours"   (60 min, is_break: false, order: 8)
  16h00 - 17h00 → "7ème cours"   (60 min, is_break: false, order: 9)

Répéter pour chaque jour de la semaine (day_of_week: 1 à 5).
Total : 9 créneaux × 5 jours = 45 time_slots.

NB : Le seeder doit être configurable via school_settings :
     - heure début : school_settings.get('school_start_time', '07:30')
     - heure fin   : school_settings.get('school_end_time', '17:00')
     - durée cours : school_settings.get('class_duration_minutes', 60)
     Pour l'instant, utiliser les valeurs par défaut ci-dessus.

## COMMANDES DE TEST

php artisan migrate --path=database/migrations/tenant
php artisan db:seed --class=TimeSlotSeeder
php artisan tinker
  >>> App\Models\TimeSlot::count() // → 45
  >>> App\Models\TimeSlot::where('day_of_week', 1)->where('is_break', false)->count() // → 7
```

---

## SESSION 8.2 — Enums + Models + Services

```
## CONTEXTE PROJET — ENMA SCHOOL

Stack : PHP 8.3 / Laravel 12, strict_types=1, Enums PHP 8.1

Phase 8 Session 1 terminée :
- Migrations : time_slots, timetable_entries, timetable_overrides ✅
- TimeSlotSeeder : 45 créneaux (9/jour × 5 jours) ✅

## GÉNÈRE LES ENUMS

### app/Enums/DayOfWeek.php
cases : Monday=1, Tuesday=2, Wednesday=3, Thursday=4, Friday=5, Saturday=6
méthode : label() → "Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"
méthode : short() → "Lun","Mar","Mer","Jeu","Ven","Sam"
méthode : schoolDays() : array → [Monday, Tuesday, Wednesday, Thursday, Friday]
méthode : color() → couleur pour le header du calendrier

### app/Enums/OverrideType.php
cases : Cancellation, Substitution, RoomChange, Rescheduled
values: 'cancellation','substitution','room_change','rescheduled'
méthode : label() →
  cancellation → "Cours annulé"
  substitution → "Remplacement enseignant"
  room_change  → "Changement de salle"
  rescheduled  → "Cours déplacé"
méthode : color()
  cancellation → 'red', substitution → 'orange',
  room_change → 'blue', rescheduled → 'purple'
méthode : icon() → nom lucide-react icon

## GÉNÈRE LES MODELS

### TimeSlot.php

$fillable : name, day_of_week, start_time, end_time,
            duration_minutes, is_break, order, is_active

Casts :
  day_of_week → 'integer'
  is_break → 'boolean'
  is_active → 'boolean'

Relations :
  entries() → hasMany TimetableEntry

Accessors :
  getDayLabelAttribute() : string → DayOfWeek::from($this->day_of_week)->label()
  getDayShortAttribute() : string → DayOfWeek::from($this->day_of_week)->short()
  getTimeRangeAttribute() : string → "07h30-08h30"
  getDurationAttribute() : int
    → (strtotime($this->end_time) - strtotime($this->start_time)) / 60

Scopes :
  scopeActive($query) → where('is_active', true)
  scopeForDay($query, int $day) → where('day_of_week', $day)
  scopeCourses($query) → where('is_break', false)
  scopeBreaks($query) → where('is_break', true)

Méthode statique :
  getWeeklyGrid() : array
    → Retourne les créneaux organisés par jour :
      [1 => [slot1, slot2,...], 2 => [...], ...]
    → Utile pour le rendu du calendrier

### TimetableEntry.php

$fillable : academic_year_id, class_id, time_slot_id, subject_id,
            teacher_id, room_id, color, notes, is_active, created_by

Casts :
  is_active → 'boolean'

Relations :
  academicYear() → belongsTo AcademicYear
  classe()       → belongsTo Classe (FK: class_id)
  timeSlot()     → belongsTo TimeSlot
  subject()      → belongsTo Subject
  teacher()      → belongsTo Teacher (nullable)
  room()         → belongsTo Room (nullable)
  createdBy()    → belongsTo User
  overrides()    → hasMany TimetableOverride

Accessors :
  getEffectiveColorAttribute() : string
    → $this->color ?? $this->subject?->color ?? '#6366f1'
  getDisplayTitleAttribute() : string
    → "{subject->code} — {teacher->user->last_name ?? '—'}"

Méthodes :
  getOverrideForDate(Carbon $date) : ?TimetableOverride
    → $this->overrides()->whereDate('date', $date)->first()
  isActiveOnDate(Carbon $date) : bool
    → pas d'override de type cancellation pour cette date
  getEffectiveTeacherForDate(Carbon $date) : ?Teacher
    → si override substitution → substitute_teacher
    → sinon → $this->teacher
  getEffectiveRoomForDate(Carbon $date) : ?Room
    → si override room_change → new_room
    → sinon → $this->room

Scopes :
  scopeForYear($query, int $yearId)
  scopeForClass($query, int $classeId)
  scopeForTeacher($query, int $teacherId)
  scopeForRoom($query, int $roomId)
  scopeForDay($query, int $day) — via timeSlot join
  scopeActive($query) → where('is_active', true)

### TimetableOverride.php

$fillable : timetable_entry_id, date, type, substitute_teacher_id,
            new_room_id, rescheduled_to_slot_id, reason, notified_at, created_by

Casts :
  date → 'date'
  type → OverrideType::class
  notified_at → 'datetime'

Relations :
  entry()              → belongsTo TimetableEntry
  substituteTeacher()  → belongsTo Teacher (FK: substitute_teacher_id, nullable)
  newRoom()            → belongsTo Room (FK: new_room_id, nullable)
  rescheduledToSlot()  → belongsTo TimeSlot (FK: rescheduled_to_slot_id, nullable)
  createdBy()          → belongsTo User

## GÉNÈRE LES SERVICES

### TimetableService.php

// ── Gestion des créneaux horaires ─────────────────────────

getTimeSlots() : array
  → TimeSlot::active()->orderBy('day_of_week')->orderBy('order')->get()
  → Organisés en grille par jour via getWeeklyGrid()
  → Mis en cache : Cache::remember('time_slots_grid', 3600, ...)

// ── Gestion des entrées d'emploi du temps ─────────────────

getForClass(int $classeId, int $yearId) : Collection
  → Toutes les entrées pour une classe + année
  → eager load : timeSlot, subject, teacher.user, room
  → Organisées en grille : [day => [slot_id => entry|null]]

getForTeacher(int $teacherId, int $yearId) : Collection
  → Toutes les entrées d'un enseignant pour l'année
  → eager load : timeSlot, subject, classe, room

getForRoom(int $roomId, int $yearId) : Collection
  → Toutes les entrées dans une salle pour l'année

getWeekView(int $classeId, int $yearId, ?Carbon $date = null) : array
  → Vue semaine avec résolution des overrides pour la semaine donnée
  → Si date = null → semaine courante
  → Pour chaque entrée → résoudre les overrides de la semaine
  → Format : {
      week_start: date,
      week_end: date,
      days: [
        {
          date: date,
          day_of_week: int,
          day_label: string,
          slots: [
            {
              time_slot: TimeSlot,
              entry: TimetableEntry | null,
              override: TimetableOverride | null,
              effective_teacher: Teacher | null,
              effective_room: Room | null,
              is_cancelled: bool,
            }
          ]
        }
      ]
    }

addEntry(array $data, User $by) : TimetableEntry
  data : academic_year_id, class_id, time_slot_id, subject_id,
         teacher_id (nullable), room_id (nullable), color, notes
  Vérifications (dans l'ordre) :
    1. Le time_slot n'est pas une pause (is_break = false)
    2. La classe n'a pas déjà un cours sur ce créneau (UNIQUE)
    3. L'enseignant (si fourni) n'a pas déjà un cours sur ce créneau
       → ConflictException('teacher', [...conflicting entries...])
    4. La salle (si fournie) n'est pas déjà occupée sur ce créneau
       → ConflictException('room', [...conflicting entries...])
    5. L'enseignant est bien affecté à cette classe/matière (warning si non)
  → Créer l'entrée, invalider cache

updateEntry(TimetableEntry $entry, array $data) : TimetableEntry
  → Mêmes vérifications qu'à la création
  → Invalider cache

deleteEntry(TimetableEntry $entry) : void
  → Supprimer les overrides associés
  → Supprimer l'entrée

bulkAdd(int $classeId, int $yearId, array $entries) : array
  → Ajouter plusieurs entrées en une transaction
  → Retourner : { added: int, conflicts: [...] }
  → En cas de conflit partiel → ajouter ce qui peut l'être,
    retourner la liste des conflits à l'utilisateur

// ── Vérification des conflits ─────────────────────────────

checkConflicts(array $data) : array
  → Vérifier AVANT d'ajouter si des conflits existent
  → Retourner la liste des conflits :
    {
      teacher_conflict: TimetableEntry | null,
      room_conflict: TimetableEntry | null,
      class_conflict: TimetableEntry | null,  // toujours null si UNIQUE respecté
    }
  → Utilisé pour le feedback temps réel dans le formulaire

getTeacherConflicts(int $teacherId, int $yearId) : Collection
  → Tous les créneaux où l'enseignant est en double
  → Normalement vide si le Service fonctionne bien

getRoomConflicts(int $roomId, int $yearId) : Collection
  → Tous les créneaux où la salle est en double

// ── Overrides (modifications ponctuelles) ─────────────────

addOverride(TimetableEntry $entry, array $data, User $by) : TimetableOverride
  data : date, type, reason,
         substitute_teacher_id (si type=substitution),
         new_room_id (si type=room_change),
         rescheduled_to_slot_id (si type=rescheduled)
  Vérifications :
    → La date correspond bien au bon jour de la semaine du time_slot
    → Pas de doublon (UNIQUE entry+date)
    → Si substitution : vérifier que le remplaçant n'a pas de conflit ce jour

removeOverride(TimetableOverride $override) : void

getOverridesForWeek(int $yearId, Carbon $weekStart) : Collection
  → Tous les overrides de la semaine pour TOUTES les classes

// ── Statistiques ──────────────────────────────────────────

getClassOccupancyRate(int $classeId, int $yearId) : array
  → Nombre de créneaux utilisés / total créneaux disponibles
  → Par jour et global
  → Ex: { total_slots: 35, used: 28, rate: 80.0, by_day: {...} }

getTeacherScheduleSummary(int $teacherId, int $yearId) : array
  → Récapitulatif emploi du temps enseignant :
    heures/semaine par classe, jours travaillés, créneaux libres

getRoomOccupancyRate(int $roomId, int $yearId) : array
  → Taux d'occupation d'une salle

## EXCEPTION : TimetableConflictException.php

class TimetableConflictException extends \RuntimeException {
  public function __construct(
    public readonly string $conflictType,  // 'teacher' | 'room' | 'class'
    public readonly TimetableEntry $conflictingEntry,
    public readonly string $message = ''
  ) {
    parent::__construct($message ?: "Conflit d'emploi du temps détecté");
  }
}

## COMMANDES DE TEST (tinker)

$service = app(App\Services\TimetableService::class);

// Vérifier les conflits avant ajout
$conflicts = $service->checkConflicts([
  'class_id' => 1, 'time_slot_id' => 3,
  'academic_year_id' => 1, 'subject_id' => 1,
  'teacher_id' => 1, 'room_id' => 2
]);
// → { teacher_conflict: null, room_conflict: null, class_conflict: null }

// Ajouter une entrée
$entry = $service->addEntry([...], $user);

// Vue semaine
$week = $service->getWeekView(classeId: 1, yearId: 1);
// → 5 jours, chacun avec ses créneaux

// Ajouter un override (cours annulé)
$service->addOverride($entry, [
  'date' => '2025-01-15',
  'type' => 'cancellation',
  'reason' => 'Réunion pédagogique'
], $user);
```

---

## SESSION 8.3 — Controllers + Resources + Routes

```
## CONTEXTE PROJET — ENMA SCHOOL

Stack : PHP 8.3 / Laravel 12
Conventions : strict_types=1, Trait ApiResponse, Form Requests, Resources

Phase 8 Sessions 1 & 2 terminées ✅

## GÉNÈRE LES API RESOURCES

### TimeSlotResource.php
{
  id, name,
  day_of_week: int,
  day_label: string,     // "Lundi"
  day_short: string,     // "Lun"
  start_time: "07:30",
  end_time: "08:30",
  time_range: "07h30-08h30",
  duration_minutes: int,
  is_break: bool,
  order: int,
  is_active: bool,
}

### TimetableEntryResource.php
{
  id,
  academic_year_id,
  effective_color: string,     // couleur effective (entry.color ?? subject.color)
  display_title: string,       // "MATH — KOUASSI"
  notes: string|null,
  is_active: bool,
  // Relations
  time_slot: TimeSlotResource (whenLoaded),
  classe: { id, display_name, level_label } (whenLoaded),
  subject: SubjectResource (whenLoaded),
  teacher: { id, full_name, avatar_url } | null (whenLoaded),
  room: { id, name, code } | null (whenLoaded),
  created_at,
}

### TimetableWeekViewResource.php
{
  week_start: string,   // "2025-01-13"
  week_end: string,     // "2025-01-17"
  days: [
    {
      date: string,
      day_of_week: int,
      day_label: string,
      day_short: string,
      is_today: bool,
      slots: [
        {
          time_slot: TimeSlotResource,
          entry: TimetableEntryResource | null,
          override: TimetableOverrideResource | null,
          effective_teacher: { id, full_name, avatar_url } | null,
          effective_room: { id, name, code } | null,
          is_cancelled: bool,
          is_modified: bool,  // true si override de n'importe quel type
        }
      ]
    }
  ]
}

### TimetableOverrideResource.php
{
  id,
  date: string,
  type: { value, label, color, icon },
  reason: string | null,
  substitute_teacher: { id, full_name } | null (whenLoaded),
  new_room: { id, name, code } | null (whenLoaded),
  rescheduled_to_slot: TimeSlotResource | null (whenLoaded),
  created_by: { id, full_name } (whenLoaded),
  created_at,
}

### ConflictCheckResource.php
{
  has_conflict: bool,
  teacher_conflict: TimetableEntryResource | null,
  room_conflict: TimetableEntryResource | null,
  class_conflict: TimetableEntryResource | null,
}

## GÉNÈRE LES FORM REQUESTS

### StoreTimetableEntryRequest
  academic_year_id : required, exists:academic_years,id
  class_id         : required, exists:classes,id
  time_slot_id     : required, exists:time_slots,id
                     + vérifier que is_break = false
  subject_id       : required, exists:subjects,id
  teacher_id       : nullable, exists:teachers,id
  room_id          : nullable, exists:rooms,id
  color            : nullable, string, regex:/^#[0-9A-Fa-f]{6}$/
  notes            : nullable, string, max:300
  Messages :
    "Ce créneau est une pause (récréation)"
    "Cette classe a déjà un cours sur ce créneau"

### BulkStoreTimetableRequest
  academic_year_id : required
  class_id         : required
  entries          : required, array, min:1
  entries.*.time_slot_id : required, exists:time_slots,id
  entries.*.subject_id   : required, exists:subjects,id
  entries.*.teacher_id   : nullable, exists:teachers,id
  entries.*.room_id      : nullable, exists:rooms,id

### StoreOverrideRequest
  date             : required, date, after_or_equal:today
  type             : required, in: OverrideType cases
  reason           : nullable, string, max:300
  substitute_teacher_id : required_if:type,substitution, exists:teachers,id
  new_room_id      : required_if:type,room_change, exists:rooms,id
  rescheduled_to_slot_id : required_if:type,rescheduled, exists:time_slots,id
  Messages :
    "La date ne correspond pas au jour de ce créneau"
    "Un override existe déjà pour cette date"

### CheckConflictsRequest
  academic_year_id : required
  class_id         : required
  time_slot_id     : required
  teacher_id       : nullable
  room_id          : nullable
  exclude_entry_id : nullable — pour ignorer l'entrée courante lors d'une édition

## GÉNÈRE LES CONTROLLERS

### TimeSlotController

index() → GET /school/time-slots
  → permission: timetable.view
  → retourne tous les créneaux organisés par jour
  → mis en cache côté frontend (staleTime: Infinity)

grid() → GET /school/time-slots/grid
  → retourne la grille complète : { day_of_week: [slot,...] }
  → structure optimisée pour l'affichage du planning

### TimetableController

// Vue par classe
classView() → GET /school/timetable/class/{classe}
  params: year_id, week (date ISO optionnel)
  → permission: timetable.view
  → TimetableWeekViewResource

// Vue par enseignant
teacherView() → GET /school/timetable/teacher/{teacher}
  params: year_id, week
  → permission: timetable.view
  → TimetableWeekViewResource

// Vue par salle
roomView() → GET /school/timetable/room/{room}
  params: year_id, week
  → permission: timetable.view
  → TimetableWeekViewResource

// Entrées (CRUD)
index() → GET /school/timetable/entries
  params: class_id, teacher_id, room_id, year_id, day_of_week
  → permission: timetable.view

store() → POST /school/timetable/entries
  → permission: timetable.manage
  → StoreTimetableEntryRequest
  → peut lever TimetableConflictException → 409 avec détails du conflit

bulkStore() → POST /school/timetable/entries/bulk
  → permission: timetable.manage
  → BulkStoreTimetableRequest
  → retourne : { added: int, conflicts: [{...}] }

update() → PUT /school/timetable/entries/{entry}
  → permission: timetable.manage

destroy() → DELETE /school/timetable/entries/{entry}
  → permission: timetable.manage

// Vérification des conflits (avant soumission)
checkConflicts() → POST /school/timetable/check-conflicts
  → permission: timetable.view
  → CheckConflictsRequest
  → ConflictCheckResource — utilisé pour le feedback temps réel

// Overrides
storeOverride() → POST /school/timetable/entries/{entry}/overrides
  → permission: timetable.manage
  → StoreOverrideRequest

destroyOverride() → DELETE /school/timetable/overrides/{override}
  → permission: timetable.manage

weekOverrides() → GET /school/timetable/overrides
  params: year_id, week_start
  → permission: timetable.view
  → tous les overrides de la semaine

// Stats
classOccupancy() → GET /school/timetable/class/{classe}/occupancy
  → permission: timetable.view

## ROUTES

Route::middleware(['auth:sanctum', 'tenant.active',
                   'module:timetable'])->group(function () {
  Route::prefix('school')->group(function () {

    // ── Créneaux ───────────────────────────────────────
    Route::get('time-slots', [TimeSlotController::class, 'index'])
         ->middleware('can:timetable.view');
    Route::get('time-slots/grid', [TimeSlotController::class, 'grid'])
         ->middleware('can:timetable.view');

    // ── Vues emploi du temps ───────────────────────────
    Route::get('timetable/class/{classe}', [TimetableController::class, 'classView'])
         ->middleware('can:timetable.view');
    Route::get('timetable/teacher/{teacher}', [TimetableController::class, 'teacherView'])
         ->middleware('can:timetable.view');
    Route::get('timetable/room/{room}', [TimetableController::class, 'roomView'])
         ->middleware('can:timetable.view');
    Route::get('timetable/class/{classe}/occupancy', [TimetableController::class, 'classOccupancy'])
         ->middleware('can:timetable.view');

    // ── Entrées ────────────────────────────────────────
    Route::post('timetable/check-conflicts', [TimetableController::class, 'checkConflicts'])
         ->middleware('can:timetable.view');
    Route::post('timetable/entries/bulk', [TimetableController::class, 'bulkStore'])
         ->middleware('can:timetable.manage');
    Route::get('timetable/entries', [TimetableController::class, 'index'])
         ->middleware('can:timetable.view');
    Route::post('timetable/entries', [TimetableController::class, 'store'])
         ->middleware('can:timetable.manage');
    Route::put('timetable/entries/{entry}', [TimetableController::class, 'update'])
         ->middleware('can:timetable.manage');
    Route::delete('timetable/entries/{entry}', [TimetableController::class, 'destroy'])
         ->middleware('can:timetable.manage');

    // ── Overrides ──────────────────────────────────────
    Route::get('timetable/overrides', [TimetableController::class, 'weekOverrides'])
         ->middleware('can:timetable.view');
    Route::post('timetable/entries/{entry}/overrides',
         [TimetableController::class, 'storeOverride'])
         ->middleware('can:timetable.manage');
    Route::delete('timetable/overrides/{override}',
         [TimetableController::class, 'destroyOverride'])
         ->middleware('can:timetable.manage');
  });
});

## TESTS HOPPSCOTCH

// Vérifier un créneau avant ajout
POST /api/school/timetable/check-conflicts
{ "academic_year_id":1,"class_id":1,"time_slot_id":3,
  "teacher_id":1,"room_id":2 }
→ { has_conflict:false, teacher_conflict:null, room_conflict:null }

// Ajouter un cours
POST /api/school/timetable/entries
{ "academic_year_id":1,"class_id":1,"time_slot_id":3,
  "subject_id":1,"teacher_id":1,"room_id":2 }
→ 201, TimetableEntryResource

// Tenter un conflit
POST /api/school/timetable/entries
{ "academic_year_id":1,"class_id":2,"time_slot_id":3,
  "subject_id":2,"teacher_id":1,"room_id":3 }
→ 409 { "conflict_type":"teacher",
         "conflicting_entry": { ...entrée existante... } }

// Vue semaine d'une classe
GET /api/school/timetable/class/1?year_id=1&week=2025-01-13
→ TimetableWeekViewResource (5 jours × 9 créneaux)

// Ajouter un cours annulé
POST /api/school/timetable/entries/1/overrides
{ "date":"2025-01-15","type":"cancellation","reason":"Réunion pédagogique" }
→ 201, TimetableOverrideResource

// Ajouter un remplacement
POST /api/school/timetable/entries/1/overrides
{ "date":"2025-01-22","type":"substitution",
  "substitute_teacher_id":3,"reason":"Maladie" }
→ 201

// Ajout en masse
POST /api/school/timetable/entries/bulk
{
  "academic_year_id":1,"class_id":1,
  "entries": [
    {"time_slot_id":1,"subject_id":1,"teacher_id":1,"room_id":2},
    {"time_slot_id":2,"subject_id":2,"teacher_id":2,"room_id":2},
    {"time_slot_id":5,"subject_id":3,"teacher_id":1,"room_id":4}
  ]
}
→ { "added":3,"conflicts":[] }
```

---

## SESSION 8.4 — Frontend : Types + API + Hooks

```
## CONTEXTE PROJET — ENMA SCHOOL

Stack : React 18 + TypeScript 5, TanStack Query v5
FullCalendar : déjà dans le stack (react)

Phase 8 Sessions 1-3 terminées ✅

## GÉNÈRE LES FICHIERS SUIVANTS

### src/modules/school/types/timetable.types.ts

export type DayOfWeek = 1 | 2 | 3 | 4 | 5 | 6;
export type OverrideType = 'cancellation' | 'substitution' | 'room_change' | 'rescheduled';

export const DAY_LABELS: Record<DayOfWeek, string> = {
  1: 'Lundi', 2: 'Mardi', 3: 'Mercredi',
  4: 'Jeudi', 5: 'Vendredi', 6: 'Samedi',
};
export const DAY_SHORT: Record<DayOfWeek, string> = {
  1: 'Lun', 2: 'Mar', 3: 'Mer',
  4: 'Jeu', 5: 'Ven', 6: 'Sam',
};
export const OVERRIDE_TYPE_LABELS: Record<OverrideType, string> = {
  cancellation: 'Cours annulé',
  substitution: 'Remplacement enseignant',
  room_change: 'Changement de salle',
  rescheduled: 'Cours déplacé',
};
export const OVERRIDE_TYPE_COLORS: Record<OverrideType, string> = {
  cancellation: 'red', substitution: 'orange',
  room_change: 'blue', rescheduled: 'purple',
};

export interface TimeSlot {
  id: number;
  name: string;
  day_of_week: DayOfWeek;
  day_label: string;
  day_short: string;
  start_time: string;   // "07:30"
  end_time: string;     // "08:30"
  time_range: string;   // "07h30-08h30"
  duration_minutes: number;
  is_break: boolean;
  order: number;
  is_active: boolean;
}

export interface TimetableEntry {
  id: number;
  academic_year_id: number;
  effective_color: string;
  display_title: string;
  notes: string | null;
  is_active: boolean;
  time_slot?: TimeSlot;
  classe?: { id: number; display_name: string; level_label: string };
  subject?: Subject;
  teacher?: { id: number; full_name: string; avatar_url: string | null } | null;
  room?: { id: number; name: string; code: string | null } | null;
  created_at: string;
}

export interface TimetableOverride {
  id: number;
  date: string;
  type: { value: OverrideType; label: string; color: string; icon: string };
  reason: string | null;
  substitute_teacher?: { id: number; full_name: string } | null;
  new_room?: { id: number; name: string; code: string | null } | null;
  rescheduled_to_slot?: TimeSlot | null;
  created_by?: { id: number; full_name: string };
  created_at: string;
}

export interface TimetableSlotView {
  time_slot: TimeSlot;
  entry: TimetableEntry | null;
  override: TimetableOverride | null;
  effective_teacher: { id: number; full_name: string; avatar_url: string|null } | null;
  effective_room: { id: number; name: string; code: string|null } | null;
  is_cancelled: boolean;
  is_modified: boolean;
}

export interface TimetableDayView {
  date: string;
  day_of_week: DayOfWeek;
  day_label: string;
  day_short: string;
  is_today: boolean;
  slots: TimetableSlotView[];
}

export interface TimetableWeekView {
  week_start: string;
  week_end: string;
  days: TimetableDayView[];
}

export interface ConflictCheck {
  has_conflict: boolean;
  teacher_conflict: TimetableEntry | null;
  room_conflict: TimetableEntry | null;
  class_conflict: TimetableEntry | null;
}

export interface TimetableEntryFormData {
  academic_year_id: number;
  class_id: number;
  time_slot_id: number;
  subject_id: number;
  teacher_id?: number | null;
  room_id?: number | null;
  color?: string | null;
  notes?: string;
}

export interface OverrideFormData {
  date: string;
  type: OverrideType;
  reason?: string;
  substitute_teacher_id?: number;
  new_room_id?: number;
  rescheduled_to_slot_id?: number;
}

// Pour FullCalendar
export interface FullCalendarEvent {
  id: string;
  title: string;
  start: string;     // ISO datetime
  end: string;       // ISO datetime
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  extendedProps: {
    entry: TimetableEntry;
    override: TimetableOverride | null;
    is_cancelled: boolean;
  };
}

### src/modules/school/api/timetable.api.ts

import { apiClient } from '@/shared/lib/axios';

export const timeSlotsApi = {
  getAll: () =>
    apiClient.get<ApiSuccess<TimeSlot[]>>('/school/time-slots'),
  getGrid: () =>
    apiClient.get<ApiSuccess<Record<DayOfWeek, TimeSlot[]>>>('/school/time-slots/grid'),
};

export const timetableApi = {
  getClassView: (classeId: number, params: { year_id: number; week?: string }) =>
    apiClient.get<ApiSuccess<TimetableWeekView>>(
      `/school/timetable/class/${classeId}`, { params }),
  getTeacherView: (teacherId: number, params: { year_id: number; week?: string }) =>
    apiClient.get<ApiSuccess<TimetableWeekView>>(
      `/school/timetable/teacher/${teacherId}`, { params }),
  getRoomView: (roomId: number, params: { year_id: number; week?: string }) =>
    apiClient.get<ApiSuccess<TimetableWeekView>>(
      `/school/timetable/room/${roomId}`, { params }),

  getEntries: (params?: Record<string, unknown>) =>
    apiClient.get<PaginatedResponse<TimetableEntry>>('/school/timetable/entries', { params }),
  checkConflicts: (data: Partial<TimetableEntryFormData> & { exclude_entry_id?: number }) =>
    apiClient.post<ApiSuccess<ConflictCheck>>('/school/timetable/check-conflicts', data),
  addEntry: (data: TimetableEntryFormData) =>
    apiClient.post<ApiSuccess<TimetableEntry>>('/school/timetable/entries', data),
  bulkAddEntries: (data: { academic_year_id: number; class_id: number; entries: Partial<TimetableEntryFormData>[] }) =>
    apiClient.post<ApiSuccess<{ added: number; conflicts: ConflictCheck[] }>>
      ('/school/timetable/entries/bulk', data),
  updateEntry: (id: number, data: Partial<TimetableEntryFormData>) =>
    apiClient.put<ApiSuccess<TimetableEntry>>(`/school/timetable/entries/${id}`, data),
  deleteEntry: (id: number) =>
    apiClient.delete(`/school/timetable/entries/${id}`),

  addOverride: (entryId: number, data: OverrideFormData) =>
    apiClient.post<ApiSuccess<TimetableOverride>>(
      `/school/timetable/entries/${entryId}/overrides`, data),
  deleteOverride: (overrideId: number) =>
    apiClient.delete(`/school/timetable/overrides/${overrideId}`),
  getWeekOverrides: (params: { year_id: number; week_start: string }) =>
    apiClient.get<ApiSuccess<TimetableOverride[]>>('/school/timetable/overrides', { params }),

  getClassOccupancy: (classeId: number, yearId: number) =>
    apiClient.get(`/school/timetable/class/${classeId}/occupancy`,
      { params: { year_id: yearId } }),
};

### src/modules/school/hooks/useTimetable.ts

// Créneaux horaires
useTimeSlots()          → useQuery key:['time-slots'], staleTime: Infinity
useTimeSlotsGrid()      → useQuery key:['time-slots-grid'], staleTime: Infinity

// Vues emploi du temps
useClassTimetable(classeId, yearId, week)
  → useQuery key: ['timetable-class', classeId, yearId, week]
  → staleTime: 60 secondes
useTeacherTimetable(teacherId, yearId, week)
  → useQuery key: ['timetable-teacher', teacherId, yearId, week]
useRoomTimetable(roomId, yearId, week)
  → useQuery key: ['timetable-room', roomId, yearId, week]

// CRUD entrées
useCheckConflicts()     → useMutation (pas de cache à invalider)
useAddTimetableEntry()  → useMutation + invalidate ['timetable-class', ...]
useBulkAddEntries()     → useMutation + invalidate timetable views
useUpdateTimetableEntry() → useMutation + invalidate timetable views
useDeleteTimetableEntry() → useMutation + invalidate timetable views

// Overrides
useAddOverride()        → useMutation + invalidate timetable views
useDeleteOverride()     → useMutation + invalidate timetable views
useWeekOverrides(yearId, weekStart)
  → useQuery key: ['week-overrides', yearId, weekStart]

### src/modules/school/lib/timetableHelpers.ts

import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';

// Convertir TimetableWeekView en événements FullCalendar
export function toFullCalendarEvents(
  weekView: TimetableWeekView,
  yearStr: string   // ex: "2025"
): FullCalendarEvent[] {
  const events: FullCalendarEvent[] = [];
  for (const day of weekView.days) {
    for (const slot of day.slots) {
      if (!slot.entry || slot.time_slot.is_break) continue;
      events.push({
        id: `${slot.entry.id}-${day.date}`,
        title: slot.is_cancelled
          ? `🚫 ${slot.entry.subject?.name}`
          : slot.entry.display_title,
        start: `${day.date}T${slot.time_slot.start_time}`,
        end: `${day.date}T${slot.time_slot.end_time}`,
        backgroundColor: slot.is_cancelled
          ? '#ef4444'
          : slot.entry.effective_color,
        borderColor: slot.is_cancelled ? '#b91c1c' : slot.entry.effective_color,
        textColor: '#ffffff',
        extendedProps: {
          entry: slot.entry,
          override: slot.override,
          is_cancelled: slot.is_cancelled,
        },
      });
    }
  }
  return events;
}

// Grille statique (sans FullCalendar) : matrice jour × créneau
export function buildGridMatrix(
  weekView: TimetableWeekView,
  timeSlots: TimeSlot[]
): Record<number, Record<number, TimetableSlotView | null>> {
  // clé: time_slot_id → { day_of_week: slot | null }
  const matrix: Record<number, Record<number, TimetableSlotView | null>> = {};
  for (const slot of timeSlots) {
    matrix[slot.id] = {};
    for (const day of weekView.days) {
      const found = day.slots.find(s => s.time_slot.id === slot.id);
      matrix[slot.id][day.day_of_week] = found ?? null;
    }
  }
  return matrix;
}

export function getWeekDates(date?: Date): { start: string; end: string } {
  const d = date ?? new Date();
  const start = startOfWeek(d, { weekStartsOn: 1 }); // Lundi
  const end = addDays(start, 4); // Vendredi
  return {
    start: format(start, 'yyyy-MM-dd'),
    end: format(end, 'yyyy-MM-dd'),
  };
}

export function formatTimeSlotHour(time: string): string {
  // "08:00:00" → "08h00"
  return time.substring(0, 5).replace(':', 'h');
}

export function getSlotColor(
  slot: TimetableSlotView,
  theme: 'light' | 'dark' = 'light'
): string {
  if (slot.is_cancelled) return '#ef4444';
  if (slot.is_modified) return '#f59e0b';
  return slot.entry?.effective_color ?? '#e5e7eb';
}
```

---

## SESSION 8.5 — Frontend Pages

```
## CONTEXTE PROJET — ENMA SCHOOL

Stack : React 18 + TypeScript 5, Tailwind + shadcn/ui
FullCalendar : @fullcalendar/react + @fullcalendar/timegrid + @fullcalendar/interaction
TanStack Query v5, Zustand v4

Types, API, Hooks créés en Session 8.4 ✅

## GÉNÈRE LES PAGES ET COMPOSANTS

### 1. TimetablePage.tsx — Page principale de l'emploi du temps

URL : /school/timetable

HEADER :
  Titre "Emploi du Temps"
  Onglets : [Vue Classe] [Vue Enseignant] [Vue Salle]
  Boutons : [← Semaine préc.] [Semaine en cours] [Semaine suiv. →]
             [+ Ajouter un cours] [Paramètres créneaux]

SÉLECTEURS (selon l'onglet actif) :
  Vue Classe    → Select Classe (avec display_name)
  Vue Enseignant → Select Enseignant
  Vue Salle     → Select Salle

AFFICHAGE :
  Deux modes disponibles (toggle bouton) :
  [📅 Calendrier]  ← FullCalendar timeGridWeek
  [📊 Grille]      ← Vue tabulaire maison (matrice jours × créneaux)

### 2. TimetableCalendarView.tsx — Vue FullCalendar

Utilise @fullcalendar/react en mode timeGridWeek.

Configuration :
  - initialView: 'timeGridWeek'
  - locale: fr
  - slotMinTime: '07:00:00'
  - slotMaxTime: '18:00:00'
  - slotDuration: '01:00:00'  (1 heure)
  - weekends: false           (Lundi → Vendredi)
  - allDaySlot: false
  - nowIndicator: true
  - headerToolbar: false      (navigation gérée par notre composant parent)
  - events: → toFullCalendarEvents(weekView)
  - eventClick: → ouvre TimetableEntryDetailModal
  - dateClick: → ouvre AddEntryModal (si timetable.manage)
  - eventDrop: → (drag & drop) déclenche updateEntry (si timetable.manage)

RENDU PERSONNALISÉ DES ÉVÉNEMENTS :
  Chaque événement affiche :
  - Matière (code)
  - Enseignant (initiales ou nom court)
  - Salle (code)
  - Badge ANNULÉ si is_cancelled (fond rouge)
  - Badge MODIFIÉ si is_modified (bordure orange)

### 3. TimetableGridView.tsx — Vue Grille (alternative à FullCalendar)

Vue tabulaire classique : lignes = créneaux, colonnes = jours.
Plus lisible sur petit écran ou pour l'impression.

Structure :
  ┌──────────────┬──────────────┬──────────────┬──────────────┬──────────────┬──────────────┐
  │   Horaire    │    LUNDI     │    MARDI     │   MERCREDI   │    JEUDI     │   VENDREDI   │
  ├──────────────┼──────────────┼──────────────┼──────────────┼──────────────┼──────────────┤
  │ 07h30-08h30  │ [MATH]       │ [FR]         │ [HIST]       │ [MATH]       │ [SC.NAT]     │
  │              │  Kouassi     │  Bamba       │  Traoré      │  Kouassi     │  Diallo      │
  │              │  Salle A     │  Salle B     │  Salle A     │  Salle A     │  Labo        │
  ├──────────────┼──────────────┼──────────────┼──────────────┼──────────────┼──────────────┤
  │ 08h30-09h30  │ [PHYS]       │ [MATH]       │ [EPS]        │ ...          │ ...          │
  ├──────────────┼──────────────┼──────────────┼──────────────┼──────────────┼──────────────┤
  │ 09h30-10h30  │ ░ RÉCRÉATION ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
  ├──────────────┼──────────────┼──────────────┼──────────────┼──────────────┼──────────────┤
  │ ...          │ ...          │ ...          │ ...          │ ...          │ ...          │
  └──────────────┴──────────────┴──────────────┴──────────────┴──────────────┴──────────────┘

  Chaque cellule de cours :
  - Fond coloré selon la matière
  - Clic → TimetableEntryDetailModal
  - Si annulé → fond rouge rayé
  - Si modifié → bordure orange pointillée

  Cellule pause → fond gris, span full-width, non cliquable

### 4. AddTimetableEntryModal.tsx — Ajouter un cours

FORMULAIRE :
  1. Classe (pré-rempli si vue classe active)
  2. Créneau horaire (select groupé par jour)
     → Créneaux déjà occupés affichés en gris
  3. Matière (filtré selon class_subjects de la classe)
  4. Enseignant (filtré selon teacher_classes — affectations de la matière/classe)
     → Afficher charge actuelle : "Kouassi — 14h/18h"
  5. Salle (select avec type et capacité)
     → Salles déjà occupées sur ce créneau affichées en gris
  6. Couleur personnalisée (ColorPicker — optionnel)
  7. Notes (optionnel)

DÉTECTION DE CONFLIT EN TEMPS RÉEL :
  Après sélection du créneau + enseignant/salle → appel
  POST /school/timetable/check-conflicts (debounce 500ms)
  → Si has_conflict = true :
    ⚠️ "Jean Kouassi a déjà un cours sur ce créneau : 6ème 2 — Mathématiques"
    → Bouton [Forcer quand même] (school_admin seulement)

### 5. TimetableEntryDetailModal.tsx — Détail d'un cours

Affiche les détails d'un créneau cliqué.

CONTENU :
  - Matière + Classe + Créneau horaire
  - Enseignant (avec avatar) + Salle
  - Notes éventuelles
  - Si override actif ce jour → badge MODIFIÉ/ANNULÉ avec le motif

ACTIONS :
  [✏️ Modifier] [📅 Ajouter une exception] [🗑️ Supprimer]
  → Modifier → ouvre AddTimetableEntryModal en mode édition
  → Exception → ouvre AddOverrideModal

### 6. AddOverrideModal.tsx — Modification ponctuelle

Permet de signaler une exception pour une date précise.

FORMULAIRE :
  1. Type d'exception (radio avec icônes) :
     🚫 Cours annulé
     👤 Remplacement enseignant
     🏫 Changement de salle
     🔄 Cours déplacé

  2. Date (date picker — uniquement le bon jour de semaine)

  3. Champs conditionnels selon le type :
     - Remplacement → Select enseignant (avec vérif conflit)
     - Salle        → Select salle (avec vérif dispo)
     - Déplacé      → Select nouveau créneau

  4. Motif (textarea optionnel)

### 7. TimetableClassDetailTab.tsx — Onglet dans ClasseDetailPage

Mise à jour de ClasseDetailPage (Phase 2) :
Remplace le placeholder "Emploi du temps — Disponible Phase 8".

Affiche la TimetableGridView pour la classe courante
(semaine courante par défaut).
Bouton [Gérer l'emploi du temps →] → redirige vers TimetablePage filtrée.

### 8. TeacherTimetableTab.tsx — Onglet dans TeacherDetailPage

Mise à jour de TeacherDetailPage (Phase 5) :
Affiche le planning hebdomadaire de l'enseignant.
Charge horaire visuelle en bas (WorkloadBar).

## COMPOSANTS À CRÉER

1. TimetableCell.tsx
   Props: { slot: TimetableSlotView; onClick: fn; editable?: boolean }
   → Cellule de la grille avec couleur, titre, enseignant, salle
   → États : normal / annulé (rouge) / modifié (orange) / vide (gris pointillé)

2. TimeSlotLabel.tsx
   Props: { timeSlot: TimeSlot }
   → Affiche "07h30 → 08h30" + durée

3. DayHeader.tsx
   Props: { day: TimetableDayView }
   → Entête de colonne : "LUNDI 13 Jan" avec badge "Aujourd'hui" si is_today

4. OverrideTypeBadge.tsx
   Props: { type: OverrideType }
   → Badge coloré avec icône

5. ConflictAlert.tsx
   Props: { conflict: ConflictCheck }
   → Alerte rouge avec détails du conflit détecté

6. WeekNavigator.tsx
   Props: { currentWeek: string; onChange: fn }
   → Boutons ← | Semaine du 13 au 17 Jan 2025 | →
   → Bouton "Aujourd'hui"

7. OccupancyRateCard.tsx
   Props: { rate: number; used: number; total: number }
   → Card avec barre de progression et stats

## NAVIGATION (mise à jour)

Ajouter dans navigation.ts :
  /school/timetable         → TimetablePage       (icône: CalendarDays — déjà prévu)

## RÈGLES UX IMPORTANTES

1. Détection de conflit EN TEMPS RÉEL dans le formulaire
   → debounce 500ms après changement enseignant/salle/créneau
   → Alerte visible AVANT la soumission

2. Les créneaux déjà occupés dans les selects
   → Affichés mais grisés + tooltip "Déjà occupé"
   → Un school_admin peut forcer malgré le warning

3. Drag & Drop dans FullCalendar :
   → Déplacer un cours = updateEntry avec le nouveau time_slot_id
   → Vérifier les conflits AVANT de confirmer le drop
   → Si conflit → annuler le drag et afficher l'alerte

4. Navigation semaine :
   → Synchronisée entre la vue Calendrier et la vue Grille
   → Persistée dans l'URL (?week=2025-01-13) pour partage

5. Impression :
   → La vue Grille est optimisée pour l'impression (bouton 🖨️)
   → CSS @media print caché les boutons d'action
```

---

## RÉCAPITULATIF PHASE 8

| Session | Contenu | Fichiers clés |
|---------|---------|---------------|
| 8.1 | Migrations + Seeder | `time_slots`, `timetable_entries`, `timetable_overrides`, `TimeSlotSeeder` |
| 8.2 | Enums + Models + Services + Exception | `TimeSlot`, `TimetableEntry`, `TimetableOverride`, `TimetableService`, `TimetableConflictException` |
| 8.3 | Controllers + Resources + Routes | `TimeSlotController`, `TimetableController`, `TimetableWeekViewResource`, `ConflictCheckResource` |
| 8.4 | Frontend Types + API + Hooks + Helpers | `timetable.types.ts`, `timetable.api.ts`, `useTimetable.ts`, `timetableHelpers.ts` |
| 8.5 | Frontend Pages + Composants | `TimetablePage` (2 vues), `TimetableCalendarView` (FullCalendar), `TimetableGridView`, `AddOverrideModal`, mise à jour `ClasseDetailPage` & `TeacherDetailPage` |

---

### Points d'attention critiques

1. **Détection de conflits côté serveur ET frontend** — le backend lève une
   `TimetableConflictException` (409), le frontend vérifie en temps réel
   avant soumission via `checkConflicts()`

2. **TimeSlotSeeder** — les créneaux doivent correspondre aux horaires configurés
   dans `school_settings`. Le seeder utilise les valeurs par défaut
   mais doit être ré-exécutable (idempotent via `updateOrCreate`)

3. **Overrides = exceptions ponctuelles** — la date doit correspondre au bon jour
   de semaine du time_slot (un cours du Lundi ne peut être overridé qu'un Lundi)

4. **FullCalendar configuration** — désactiver les weekends, aligner
   les `slotMinTime/slotMaxTime` sur les créneaux du seeder

5. **Mises à jour Phase 2 et 5** — `ClasseDetailPage` et `TeacherDetailPage`
   ont des placeholders "Phase 8" à remplacer par les nouveaux composants

6. **Module guard** — les routes sont protégées par `middleware('module:timetable')`
   → vérifier que le module est activé pour le tenant avant d'accéder aux routes
