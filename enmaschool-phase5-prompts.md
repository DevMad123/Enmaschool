# ENMA SCHOOL — PROMPTS PHASE 5
## Enseignants & Affectations

---

> ## PÉRIMÈTRE DE LA PHASE 5
>
> **Objectif :** Gérer les enseignants, leurs matières de compétence,
> et leur affectation aux classes pour une année scolaire donnée.
>
> **Tables nouvelles :**
> | Table | Description |
> |-------|-------------|
> | `teachers` | Profil pédagogique de l'enseignant (lié à users) |
> | `teacher_subjects` | Matières qu'un enseignant est qualifié pour enseigner |
> | `teacher_classes` | Affectation d'un enseignant à une classe + matière |
>
> **Concepts clés :**
> - Un **teacher** est un `User` avec le rôle `teacher` qui a en plus un profil pédagogique
> - Un enseignant peut enseigner **plusieurs matières** dans **plusieurs classes**
> - Un enseignant peut être **professeur principal** d'une classe (déjà sur `classes.main_teacher_id`)
> - L'affectation (`teacher_classes`) relie : enseignant + classe + matière + année scolaire
> - Une matière dans une classe ne peut avoir qu'**un seul enseignant actif** à la fois
> - La charge horaire hebdomadaire est suivie par enseignant
>
> **HORS PÉRIMÈTRE Phase 5 :**
> - Emploi du temps détaillé (créneaux) → Phase 8
> - Saisie des notes → Phase 6
> - Présences → Phase 9
>
> **Dépendances requises :**
> - Phase 2 ✅ (classes, subjects, academic_years)
> - Phase 3 ✅ (users avec rôle teacher)
> - Phase 4 ✅ (students, enrollments)

---

## SESSION 5.1 — Migrations

```
## CONTEXTE PROJET — ENMA SCHOOL

Stack : PHP 8.3 / Laravel 12 / PostgreSQL 18
Multi-tenant : stancl/tenancy v3 (schema-per-tenant)

Phases terminées :
- Phase 0 : Auth, Users
- Phase 1 : SuperAdmin
- Phase 2 : Classes, Matières, Salles (class_subjects existant)
- Phase 3 : Rôles, Utilisateurs (users avec rôle teacher)
- Phase 4 : Élèves, Inscriptions

Tables existantes utiles :
  users(id, first_name, last_name, email, role, status, ...)
  classes(id, display_name, school_level_id, academic_year_id, main_teacher_id, ...)
  subjects(id, name, code, coefficient, ...)
  class_subjects(id, class_id, subject_id, hours_per_week, ...)
  academic_years(id, name, is_current, ...)

## CETTE SESSION — Phase 5 : Migrations

Toutes les migrations dans database/migrations/tenant/

## GÉNÈRE LES MIGRATIONS (dans l'ordre)

### 1. create_teachers_table

Objectif : profil pédagogique d'un enseignant.
Complémente le User (qui contient les infos d'identité et d'auth).

Colonnes :
  id
  user_id            (foreignId → users, unique, cascadeOnDelete)
                     NB : UNIQUE car un user = un seul profil enseignant
  employee_number    (string, nullable, unique)
                     numéro matricule employé (différent du matricule élève)
                     ex: "ENS-2024-0042"
  speciality         (string, nullable) — spécialité principale ex: "Mathématiques"
  diploma            (string, nullable) — diplôme le plus élevé ex: "Master CAPES"
  hire_date          (date, nullable) — date d'embauche
  contract_type      (enum: permanent/contract/part_time/interim)
  weekly_hours_max   (unsignedSmallInteger, default:18)
                     charge horaire max autorisée par semaine
  biography          (text, nullable) — courte bio affichée aux élèves (V2)
  is_active          (boolean, default:true)
  timestamps

  Index : user_id (unique), employee_number (unique), is_active

### 2. create_teacher_subjects_table

Objectif : matières qu'un enseignant est qualifié pour enseigner.
          Indépendant de l'année scolaire.

Colonnes :
  id
  teacher_id         (foreignId → teachers, cascadeOnDelete)
  subject_id         (foreignId → subjects, cascadeOnDelete)
  is_primary         (boolean, default:false)
                     true = matière principale de l'enseignant
  timestamps

  UNIQUE(teacher_id, subject_id)
  Index : teacher_id, subject_id

### 3. create_teacher_classes_table

Objectif : affectation d'un enseignant à une classe pour une matière
           sur une année scolaire précise.

Colonnes :
  id
  teacher_id         (foreignId → teachers, cascadeOnDelete)
  class_id           (foreignId → classes, cascadeOnDelete)
  subject_id         (foreignId → subjects, cascadeOnDelete)
  academic_year_id   (foreignId → academic_years, cascadeOnDelete)
  hours_per_week     (decimal 3,1, nullable)
                     heures/semaine pour CETTE affectation
                     (peut surcharger class_subjects.hours_per_week)
  is_active          (boolean, default:true)
  assigned_at        (date, nullable) — date d'affectation officielle
  assigned_by        (foreignId → users, nullOnDelete, nullable)
  notes              (text, nullable)
  timestamps

  UNIQUE(class_id, subject_id, academic_year_id)
  → Une matière dans une classe = UN SEUL enseignant par année

  Index :
    teacher_id, class_id, subject_id, academic_year_id
    UNIQUE(class_id, subject_id, academic_year_id)

  NB IMPORTANT : pas de soft_deletes sur cette table.
  Si on retire un enseignant → is_active = false.
  On conserve l'historique.

## RÈGLES MÉTIER (commentaires dans migrations)

1. Un user avec role=teacher DEVRAIT avoir un profil Teacher
   → créé automatiquement à la création du User teacher (via Observer)

2. La charge horaire effective d'un enseignant :
   → SUM(teacher_classes.hours_per_week) pour l'année courante
   → Ne doit pas dépasser teachers.weekly_hours_max
   → Validé dans le Service (warning, pas blocage dur)

3. UNIQUE(class_id, subject_id, academic_year_id) :
   → Une matière ne peut avoir qu'un seul enseignant actif par classe par an
   → Si on change d'enseignant : is_active = false sur l'ancienne affectation,
     nouvelle affectation créée

4. Un enseignant peut être professeur principal d'une seule classe par an
   → Géré via classes.main_teacher_id (déjà existant Phase 2)

## COMMANDES DE TEST

php artisan migrate --path=database/migrations/tenant
php artisan tinker
  >>> Schema::hasTable('teachers')
  >>> Schema::hasTable('teacher_subjects')
  >>> Schema::hasTable('teacher_classes')
  >>> Schema::getColumnListing('teacher_classes')
```

---

## SESSION 5.2 — Enums + Models + Services

```
## CONTEXTE PROJET — ENMA SCHOOL

Stack : PHP 8.3 / Laravel 12, strict_types=1, Enums PHP 8.1
Conventions : logique dans Services, Models pour relations & accessors

Phase 5 Session 1 terminée :
- Migrations : teachers, teacher_subjects, teacher_classes ✅

## GÉNÈRE LES ENUMS

### app/Enums/ContractType.php
cases : Permanent, Contract, PartTime, Interim
values: 'permanent', 'contract', 'part_time', 'interim'
méthode : label() → "Titulaire", "Contractuel", "Temps partiel", "Intérimaire"
méthode : color() → badge color
  Permanent → 'green', Contract → 'blue',
  PartTime → 'orange', Interim → 'gray'

## GÉNÈRE LES MODELS

### Teacher.php

$table = 'teachers'
$fillable : user_id, employee_number, speciality, diploma, hire_date,
            contract_type, weekly_hours_max, biography, is_active

Casts :
  contract_type → ContractType::class
  hire_date → 'date'
  is_active → 'boolean'
  weekly_hours_max → 'integer'

Relations :
  user()           → belongsTo User
  subjects()       → belongsToMany Subject via teacher_subjects
                     withPivot: is_primary
  primarySubject() → belongsToMany Subject via teacher_subjects
                     wherePivot('is_primary', true) → first()
  assignments()    → hasMany TeacherClass (FK: teacher_id)
  activeAssignments() → hasMany TeacherClass → where('is_active', true)
  classes()        → belongsToMany Classe via teacher_classes
                     withPivot: subject_id, hours_per_week, is_active

Accessors :
  getFullNameAttribute() : string → délègue à $this->user->full_name
  getEmailAttribute() : string → $this->user->email
  getAvatarUrlAttribute() : string|null → $this->user->avatar_url

  getWeeklyHoursAttribute() : float
    → somme des hours_per_week des assignments actifs de l'année courante
    → utilise Cache::remember("teacher_{$this->id}_weekly_hours", 300, ...)

  getWeeklyHoursRemainingAttribute() : float
    → weekly_hours_max - weekly_hours

  isOverloaded() : bool
    → weekly_hours > weekly_hours_max

Scopes :
  scopeActive($query)
  scopeBySubject($query, int $subjectId)
  scopeByClass($query, int $classeId, int $yearId)
  scopeWithHours($query, int $yearId)
    → withCount/sum des heures pour l'année donnée

boot() → creating :
  → générer employee_number si absent :
    "ENS-{YEAR}-{SEQ_4DIGITS}" ex: "ENS-2024-0042"

### TeacherSubject.php (pivot enrichi)
$table = 'teacher_subjects'
$fillable : teacher_id, subject_id, is_primary
Relations :
  teacher() → belongsTo Teacher
  subject()  → belongsTo Subject

### TeacherClass.php (affectation)
$table = 'teacher_classes'
$fillable : teacher_id, class_id, subject_id, academic_year_id,
            hours_per_week, is_active, assigned_at, assigned_by, notes

Casts :
  is_active → 'boolean'
  assigned_at → 'date'
  hours_per_week → 'float'

Relations :
  teacher()      → belongsTo Teacher
  classe()       → belongsTo Classe (FK: class_id)
  subject()      → belongsTo Subject
  academicYear() → belongsTo AcademicYear
  assignedBy()   → belongsTo User (FK: assigned_by)

Accessor :
  getEffectiveHoursAttribute() : float
    → hours_per_week ?? subject.class_subjects pivot hours_per_week ?? 0

Scope :
  scopeActive($query) → where('is_active', true)
  scopeForYear($query, int $yearId)
  scopeForTeacher($query, int $teacherId)
  scopeForClasse($query, int $classeId)

## MISE À JOUR DU MODEL User.php

Ajouter :
  teacherProfile() → hasOne Teacher
  isTeacher() : bool → $this->role === UserRole::Teacher

## OBSERVER : UserObserver.php

Enregistrer dans AppServiceProvider.php :
  User::observe(UserObserver::class);

Dans UserObserver :
  created(User $user) :
    → si $user->role === UserRole::Teacher :
      → créer automatiquement Teacher::create(['user_id' => $user->id])

  updated(User $user) :
    → si role change VERS teacher et pas de profil :
      → créer le profil Teacher
    → si role change DEPUIS teacher :
      → désactiver le profil : Teacher::where('user_id',...)->update(['is_active'=>false])

## GÉNÈRE LES SERVICES

### TeacherService.php

list(array $filters) : LengthAwarePaginator
  filtres : search (nom, email, employee_number),
            subject_id, contract_type, is_active,
            academic_year_id (pour les affectations),
            per_page (défaut: 25)
  → eager load : user, subjects, activeAssignments (count)

get(int $id) : Teacher
  → load : user, subjects, assignments.classe.level,
            assignments.subject, assignments.academicYear

create(array $data) : Teacher
  → $data peut contenir 'subject_ids' → sync les matières
  → NB : normalement créé auto par UserObserver

update(Teacher $teacher, array $data) : Teacher
  → mise à jour profil pédagogique

syncSubjects(Teacher $teacher, array $subjectIds, ?int $primarySubjectId = null) : void
  → sync() sur teacher_subjects
  → marquer is_primary sur le sujet principal

getWorkload(Teacher $teacher, int $yearId) : array
  → retourne :
    {
      total_hours: float,       // heures semaine actuelles
      max_hours: float,         // limite
      remaining_hours: float,   // restantes
      is_overloaded: bool,
      assignments: [            // détail par classe/matière
        { classe: string, subject: string, hours: float }
      ]
    }

getStats(int $yearId) : array
  → total enseignants actifs
  → répartition par contrat
  → enseignants sans affectation
  → enseignants surchargés

delete(Teacher $teacher) : void
  → vérifie pas d'affectations actives → warning
  → soft delete User associé (si souhaité)

### AssignmentService.php

listByClasse(int $classeId, int $yearId) : Collection
  → affectations d'une classe, eager load teacher.user + subject
  → compare avec class_subjects pour identifier les matières sans enseignant

listByTeacher(int $teacherId, int $yearId) : Collection
  → toutes les affectations d'un enseignant pour l'année
  → avec charge horaire totale

assign(array $data) : TeacherClass
  data : teacher_id, class_id, subject_id, academic_year_id,
         hours_per_week (nullable), assigned_at, notes

  Vérifications :
    1. L'enseignant est actif → exception sinon
    2. La matière est dans les compétences du teacher (teacher_subjects)
       → warning (pas blocage — un admin peut forcer)
    3. UNIQUE(class_id, subject_id, academic_year_id) :
       → si une affectation active existe → exception
         "Cette matière a déjà un enseignant dans cette classe"
    4. Charge horaire :
       → si teacher.weekly_hours + hours_per_week > teacher.weekly_hours_max
       → warning dans la réponse (pas blocage) :
         { warning: "L'enseignant dépasse sa charge maximale (20h/18h max)" }

  → Invalider cache weekly_hours du teacher

unassign(TeacherClass $assignment) : TeacherClass
  → is_active = false
  → Invalider cache weekly_hours

reassign(TeacherClass $oldAssignment, int $newTeacherId) : TeacherClass
  → unassign l'ancien
  → assign le nouveau (même class_id, subject_id, academic_year_id)
  → retourne la nouvelle affectation

bulkAssign(int $teacherId, array $assignments, int $yearId) : array
  → assigne plusieurs classes/matières à un enseignant en une seule requête
  → retourne : { assigned: int, skipped: int, warnings: [...] }

setMainTeacher(int $classeId, int $teacherId) : Classe
  → met à jour classes.main_teacher_id
  → vérifie que l'enseignant a au moins une affectation dans cette classe

getUnassignedSubjects(int $classeId, int $yearId) : Collection
  → retourne les class_subjects sans affectation teacher active
  → utile pour le dashboard "matières sans enseignant"

## COMMANDES DE TEST (tinker)

$teacher = App\Models\Teacher::with('user','subjects')->first();
$teacher->full_name         // → depuis user
$teacher->weekly_hours      // → heures actuelles (calculées)
$teacher->is_overloaded     // → bool

$service = app(App\Services\AssignmentService::class);
$service->assign([
  'teacher_id' => 1,
  'class_id' => 3,
  'subject_id' => 2,
  'academic_year_id' => 1,
  'hours_per_week' => 4.0,
]);

$service->getWorkload($teacher, 1);
// → { total_hours: 16.0, max_hours: 18.0, remaining: 2.0, is_overloaded: false }
```

---

## SESSION 5.3 — Controllers + Resources + Routes

```
## CONTEXTE PROJET — ENMA SCHOOL

Stack : PHP 8.3 / Laravel 12
Conventions : strict_types=1, Trait ApiResponse, Form Requests, Resources

Phase 5 Sessions 1 & 2 terminées : migrations, enums, models, services ✅

## GÉNÈRE LES API RESOURCES

### TeacherResource.php
{
  id,
  // Données user
  user_id,
  full_name,        // depuis user
  email,            // depuis user
  phone,            // depuis user
  avatar_url,       // depuis user
  status: user.status { value, label, color },

  // Profil pédagogique
  employee_number,
  speciality,
  diploma,
  hire_date (d/m/Y),
  contract_type: { value, label, color },
  weekly_hours_max,
  is_active,

  // Calculé
  weekly_hours: (float — chargé si demandé),
  weekly_hours_remaining: (float),
  is_overloaded: (bool),

  // Relations conditionnelles
  subjects: SubjectResource collection (whenLoaded),
  primary_subject: SubjectResource (whenLoaded),
  assignments: TeacherClassResource collection (whenLoaded),
  assignments_count: whenCounted,
  classes_count: whenCounted,
}

### TeacherListResource.php (version légère)
{
  id, full_name, email, avatar_url,
  employee_number, speciality,
  contract_type: { value, label, color },
  is_active,
  subjects_count: whenCounted,
  assignments_count: whenCounted,
  weekly_hours: (float, si chargé),
}

### TeacherClassResource.php (affectation)
{
  id,
  teacher: { id, full_name, email, avatar_url } (whenLoaded),
  classe: ClasseResource (whenLoaded),
  subject: SubjectResource (whenLoaded),
  academic_year: { id, name } (whenLoaded),
  hours_per_week,
  effective_hours,     // accessor
  is_active,
  assigned_at (d/m/Y),
  notes,
  // Warning de surcharge si présent
  warning: string|null,
}

### TeacherWorkloadResource.php
{
  teacher_id,
  total_hours: float,
  max_hours: float,
  remaining_hours: float,
  is_overloaded: bool,
  overload_hours: float,    // heures au-delà du max (0 si pas surchargé)
  assignments: [
    {
      classe: string,       // display_name
      subject: string,      // subject name
      hours: float,
      level_category: string,
    }
  ]
}

### ClassAssignmentsResource.php
{
  classe: ClasseResource,
  total_subjects: int,
  assigned_subjects: int,
  unassigned_subjects: int,
  completion_rate: float,   // % de matières avec enseignant
  assignments: [
    {
      subject: SubjectResource,
      teacher: { id, full_name, avatar_url } | null,
      assignment: TeacherClassResource | null,
      is_assigned: bool,
    }
  ]
}

## GÉNÈRE LES FORM REQUESTS

### StoreTeacherRequest / UpdateTeacherRequest
  (pour les infos pédagogiques — les infos d'identité sont gérées via UserController)
  employee_number : nullable, string, unique:teachers,employee_number (ignorer sur update)
  speciality      : nullable, string, max:200
  diploma         : nullable, string, max:200
  hire_date       : nullable, date
  contract_type   : nullable, in: ContractType cases
  weekly_hours_max: nullable, integer, min:1, max:40
  biography       : nullable, string, max:1000
  subject_ids     : nullable, array
  subject_ids.*   : exists:subjects,id
  primary_subject_id : nullable, exists:subjects,id,
                       must be in subject_ids if provided

### AssignTeacherRequest
  teacher_id      : required, exists:teachers,id
  class_id        : required, exists:classes,id
  subject_id      : required, exists:subjects,id
  academic_year_id: required, exists:academic_years,id
  hours_per_week  : nullable, numeric, min:0.5, max:40
  assigned_at     : nullable, date
  notes           : nullable, string, max:500

### BulkAssignRequest
  teacher_id      : required, exists:teachers,id
  academic_year_id: required, exists:academic_years,id
  assignments     : required, array, min:1
  assignments.*.class_id   : required, exists:classes,id
  assignments.*.subject_id : required, exists:subjects,id
  assignments.*.hours_per_week : nullable, numeric

### SetMainTeacherRequest
  teacher_id : required, exists:teachers,id

## GÉNÈRE LES CONTROLLERS

### TeacherController

index() → GET /school/teachers
  → permission: students.view (teachers visibles par tous les staff)
  → filtres : search, subject_id, contract_type, is_active, year_id
  → eager load : user, subjects (with count), activeAssignments (count)
  → retourne TeacherListResource paginé

store() → POST /school/teachers
  → permission: users.create
  → NB : normalement créé auto via UserObserver
          Cet endpoint permet création manuelle ou mise à jour du profil
  → StoreTeacherRequest
  → si subject_ids fournis → syncSubjects

show() → GET /school/teachers/{teacher}
  → load : user, subjects, assignments.classe, assignments.subject
  → retourne TeacherResource

update() → PUT /school/teachers/{teacher}
  → permission: users.edit
  → UpdateTeacherRequest
  → si subject_ids changent → syncSubjects

workload() → GET /school/teachers/{teacher}/workload?year_id=X
  → permission: users.view
  → retourne TeacherWorkloadResource

subjects() → GET /school/teachers/{teacher}/subjects
syncSubjects() → PUT /school/teachers/{teacher}/subjects
  → body: { subject_ids: [1,2,3], primary_subject_id: 1 }

assignments() → GET /school/teachers/{teacher}/assignments?year_id=X
  → affectations d'un enseignant pour une année

stats() → GET /school/teachers/stats?year_id=X
  → permission: users.view
  → statistiques globales des enseignants

### AssignmentController

// Gestion des affectations
index() → GET /school/assignments?year_id=X&classe_id=X&teacher_id=X
  → permission: classes.view
  → filtres combinables

store() → POST /school/assignments
  → permission: classes.manage
  → AssignTeacherRequest
  → peut retourner un warning de surcharge dans la réponse

bulkStore() → POST /school/assignments/bulk
  → permission: classes.manage
  → BulkAssignRequest

destroy() → DELETE /school/assignments/{assignment}
  → permission: classes.manage
  → is_active = false (soft deactivate, pas de suppression physique)

// Vue par classe
byClasse() → GET /school/classes/{classe}/assignments?year_id=X
  → permission: classes.view
  → retourne ClassAssignmentsResource (matières + enseignants ou null)
  → utile pour le ClasseDetailPage (Phase 2 mise à jour)

// Définir professeur principal
setMainTeacher() → PUT /school/classes/{classe}/main-teacher
  → permission: classes.manage
  → SetMainTeacherRequest
  → met à jour classes.main_teacher_id

unassign() → POST /school/assignments/{assignment}/unassign
  → alias propre pour is_active = false
  → retourne l'assignment mis à jour

## ROUTES (routes/tenant.php — ajouter au groupe existant)

Route::middleware(['auth:sanctum', 'tenant.active'])->group(function () {
  Route::prefix('school')->group(function () {

    // ── Enseignants ────────────────────────────────────
    Route::get('teachers/stats', [TeacherController::class, 'stats'])
         ->middleware('can:users.view');
    Route::apiResource('teachers', TeacherController::class);
    Route::get('teachers/{teacher}/workload', [TeacherController::class, 'workload'])
         ->middleware('can:users.view');
    Route::get('teachers/{teacher}/subjects', [TeacherController::class, 'subjects'])
         ->middleware('can:users.view');
    Route::put('teachers/{teacher}/subjects', [TeacherController::class, 'syncSubjects'])
         ->middleware('can:users.edit');
    Route::get('teachers/{teacher}/assignments', [TeacherController::class, 'assignments'])
         ->middleware('can:users.view');

    // ── Affectations ───────────────────────────────────
    Route::post('assignments/bulk', [AssignmentController::class, 'bulkStore'])
         ->middleware('can:classes.manage');
    Route::apiResource('assignments', AssignmentController::class)
         ->only(['index', 'store', 'destroy']);
    Route::post('assignments/{assignment}/unassign', [AssignmentController::class, 'unassign'])
         ->middleware('can:classes.manage');

    // ── Affectations par classe ────────────────────────
    Route::get('classes/{classe}/assignments', [AssignmentController::class, 'byClasse'])
         ->middleware('can:classes.view');
    Route::put('classes/{classe}/main-teacher', [AssignmentController::class, 'setMainTeacher'])
         ->middleware('can:classes.manage');
  });
});

## TESTS HOPPSCOTCH

// Profil enseignant (normalement auto-créé)
GET /api/school/teachers
→ liste paginée avec weekly_hours

// Mettre à jour le profil pédagogique
PUT /api/school/teachers/1
{
  "speciality": "Mathématiques & Physique",
  "contract_type": "permanent",
  "weekly_hours_max": 20,
  "subject_ids": [1, 2, 3],
  "primary_subject_id": 1
}

// Affecter un enseignant à une classe
POST /api/school/assignments
{
  "teacher_id": 1,
  "class_id": 5,
  "subject_id": 2,
  "academic_year_id": 1,
  "hours_per_week": 4.0
}
→ 201, ou warning si surcharge

// Affectation en masse
POST /api/school/assignments/bulk
{
  "teacher_id": 1,
  "academic_year_id": 1,
  "assignments": [
    { "class_id": 5, "subject_id": 1, "hours_per_week": 4 },
    { "class_id": 6, "subject_id": 1, "hours_per_week": 4 },
    { "class_id": 7, "subject_id": 1, "hours_per_week": 3 }
  ]
}
→ { "assigned": 3, "skipped": 0, "warnings": [] }

// Tableau de bord d'une classe
GET /api/school/classes/5/assignments?year_id=1
→ ClassAssignmentsResource : 8 matières, 6 assignées, 2 sans enseignant

// Charge horaire
GET /api/school/teachers/1/workload?year_id=1
→ { total_hours: 16.0, max_hours: 20.0, remaining: 4.0, is_overloaded: false }

// Définir professeur principal
PUT /api/school/classes/5/main-teacher
{ "teacher_id": 1 }
```

---

## SESSION 5.4 — Frontend : Types + API + Hooks

```
## CONTEXTE PROJET — ENMA SCHOOL

Stack : React 18 + TypeScript 5, TanStack Query v5, Zustand v4
Types existants : school.types.ts (Phase 2), users.types.ts (Phase 3)

Phase 5 Sessions 1-3 terminées (backend complet et testé)

## GÉNÈRE LES FICHIERS SUIVANTS

### src/modules/school/types/teachers.types.ts

export type ContractType = 'permanent' | 'contract' | 'part_time' | 'interim';

export const CONTRACT_TYPE_LABELS: Record<ContractType, string> = {
  permanent: 'Titulaire',
  contract: 'Contractuel',
  part_time: 'Temps partiel',
  interim: 'Intérimaire',
};

export const CONTRACT_TYPE_COLORS: Record<ContractType, string> = {
  permanent: 'green',
  contract: 'blue',
  part_time: 'orange',
  interim: 'gray',
};

export interface Teacher {
  id: number;
  user_id: number;
  // Depuis user
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  status: { value: string; label: string; color: string };
  // Profil pédagogique
  employee_number: string | null;
  speciality: string | null;
  diploma: string | null;
  hire_date: string | null;
  contract_type: { value: ContractType; label: string; color: string };
  weekly_hours_max: number;
  is_active: boolean;
  // Calculé
  weekly_hours?: number;
  weekly_hours_remaining?: number;
  is_overloaded?: boolean;
  // Relations
  subjects?: import('./school.types').Subject[];
  primary_subject?: import('./school.types').Subject | null;
  assignments?: TeacherAssignment[];
  assignments_count?: number;
  classes_count?: number;
}

export interface TeacherAssignment {
  id: number;
  teacher?: Pick<Teacher, 'id' | 'full_name' | 'email' | 'avatar_url'>;
  classe?: import('./school.types').Classe;
  subject?: import('./school.types').Subject;
  academic_year?: { id: number; name: string };
  hours_per_week: number | null;
  effective_hours: number;
  is_active: boolean;
  assigned_at: string | null;
  notes: string | null;
  warning?: string | null;
}

export interface TeacherWorkload {
  teacher_id: number;
  total_hours: number;
  max_hours: number;
  remaining_hours: number;
  is_overloaded: boolean;
  overload_hours: number;
  assignments: Array<{
    classe: string;
    subject: string;
    hours: number;
    level_category: string;
  }>;
}

export interface ClassAssignments {
  classe: import('./school.types').Classe;
  total_subjects: number;
  assigned_subjects: number;
  unassigned_subjects: number;
  completion_rate: number;
  assignments: Array<{
    subject: import('./school.types').Subject;
    teacher: Pick<Teacher, 'id' | 'full_name' | 'avatar_url'> | null;
    assignment: TeacherAssignment | null;
    is_assigned: boolean;
  }>;
}

export interface TeacherFormData {
  employee_number?: string;
  speciality?: string;
  diploma?: string;
  hire_date?: string | null;
  contract_type?: ContractType;
  weekly_hours_max?: number;
  biography?: string;
  subject_ids?: number[];
  primary_subject_id?: number | null;
}

export interface AssignmentFormData {
  teacher_id: number;
  class_id: number;
  subject_id: number;
  academic_year_id: number;
  hours_per_week?: number | null;
  assigned_at?: string;
  notes?: string;
}

export interface BulkAssignmentFormData {
  teacher_id: number;
  academic_year_id: number;
  assignments: Array<{
    class_id: number;
    subject_id: number;
    hours_per_week?: number | null;
  }>;
}

export interface TeacherStats {
  total: number;
  active: number;
  by_contract: Record<ContractType, number>;
  without_assignment: number;
  overloaded: number;
}

### src/modules/school/api/teachers.api.ts

import { apiClient } from '@/shared/lib/axios';

export const teachersApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<PaginatedResponse<Teacher>>('/school/teachers', { params }),
  getOne: (id: number) =>
    apiClient.get<ApiSuccess<Teacher>>(`/school/teachers/${id}`),
  getStats: (yearId: number) =>
    apiClient.get<ApiSuccess<TeacherStats>>('/school/teachers/stats', { params: { year_id: yearId } }),
  update: (id: number, data: TeacherFormData) =>
    apiClient.put<ApiSuccess<Teacher>>(`/school/teachers/${id}`, data),
  getWorkload: (id: number, yearId: number) =>
    apiClient.get<ApiSuccess<TeacherWorkload>>(`/school/teachers/${id}/workload`,
      { params: { year_id: yearId } }),
  getSubjects: (id: number) =>
    apiClient.get<ApiSuccess<Subject[]>>(`/school/teachers/${id}/subjects`),
  syncSubjects: (id: number, data: { subject_ids: number[]; primary_subject_id?: number | null }) =>
    apiClient.put(`/school/teachers/${id}/subjects`, data),
  getAssignments: (id: number, yearId: number) =>
    apiClient.get<ApiSuccess<TeacherAssignment[]>>(`/school/teachers/${id}/assignments`,
      { params: { year_id: yearId } }),
};

export const assignmentsApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<PaginatedResponse<TeacherAssignment>>('/school/assignments', { params }),
  create: (data: AssignmentFormData) =>
    apiClient.post<ApiSuccess<TeacherAssignment>>('/school/assignments', data),
  bulkCreate: (data: BulkAssignmentFormData) =>
    apiClient.post('/school/assignments/bulk', data),
  delete: (id: number) =>
    apiClient.delete(`/school/assignments/${id}`),
  unassign: (id: number) =>
    apiClient.post(`/school/assignments/${id}/unassign`),
  getByClasse: (classeId: number, yearId: number) =>
    apiClient.get<ApiSuccess<ClassAssignments>>(`/school/classes/${classeId}/assignments`,
      { params: { year_id: yearId } }),
  setMainTeacher: (classeId: number, teacherId: number) =>
    apiClient.put(`/school/classes/${classeId}/main-teacher`, { teacher_id: teacherId }),
};

### src/modules/school/hooks/useTeachers.ts

// Hooks TanStack Query

// Enseignants
useTeachers(filters)           → useQuery key: ['teachers', filters]
useTeacher(id)                 → useQuery key: ['teacher', id]
useTeacherStats(yearId)        → useQuery key: ['teacher-stats', yearId]
useUpdateTeacher()             → useMutation + invalidate ['teachers', id]
useTeacherWorkload(id, yearId) → useQuery key: ['teacher-workload', id, yearId]
useTeacherSubjects(id)         → useQuery key: ['teacher-subjects', id]
useSyncTeacherSubjects()       → useMutation + invalidate ['teacher-subjects', id]
useTeacherAssignments(id, yearId) → useQuery key: ['teacher-assignments', id, yearId]

// Affectations
useAssignments(filters)        → useQuery key: ['assignments', filters]
useClasseAssignments(classeId, yearId) → useQuery key: ['classe-assignments', classeId, yearId]
useAssignTeacher()             → useMutation + invalidate ['assignments', 'classe-assignments']
useBulkAssignTeacher()         → useMutation + invalidate ['assignments', 'teacher-assignments']
useUnassignTeacher()           → useMutation + invalidate ['assignments', 'classe-assignments']
useSetMainTeacher()            → useMutation + invalidate ['classes', classeId]

### src/modules/school/lib/teacherHelpers.ts

export function getContractTypeLabel(type: ContractType): string { ... }
export function getContractTypeColor(type: ContractType): string { ... }

export function formatWeeklyHours(hours: number): string {
  return `${hours}h/sem`;
}

export function getWorkloadPercentage(current: number, max: number): number {
  return Math.round((current / max) * 100);
}

export function getWorkloadColor(percentage: number): string {
  if (percentage >= 100) return 'red';
  if (percentage >= 80) return 'orange';
  return 'green';
}

export function getWorkloadLabel(current: number, max: number): string {
  return `${current}h / ${max}h par semaine`;
}

export function getAssignmentCompletionColor(rate: number): string {
  if (rate === 100) return 'green';
  if (rate >= 75) return 'blue';
  if (rate >= 50) return 'orange';
  return 'red';
}
```

---

## SESSION 5.5 — Frontend Pages

```
## CONTEXTE PROJET — ENMA SCHOOL

Stack : React 18 + TypeScript 5, Tailwind + shadcn/ui, TanStack Query v5
Types, API, Hooks créés en Session 5.4 ✅

## GÉNÈRE LES PAGES ET COMPOSANTS

### 1. TeachersPage.tsx — Page principale des enseignants

HEADER :
  Titre "Enseignants" | Stats inline : X enseignants | X sans affectation | X surchargés
  Bouton : [+ Ajouter un enseignant] → redirige vers création User (Phase 3)
           car Teacher est créé auto depuis UserObserver

FILTRES :
  - Recherche (nom, email, n° employé)
  - Matière (subject_id)
  - Type de contrat
  - Statut (actif/inactif)

TABLEAU — colonnes :
  Avatar + Nom | N° Employé | Spécialité | Matières | Charge (Xh/Xh) | Contrat | Statut | Actions

CHARGE HORAIRE VISUELLE :
  WorkloadBar (barre de progression colorée) sur chaque ligne
  vert < 80% | orange 80-99% | rouge ≥ 100%

ACTIONS (menu kebab) :
  Voir le profil | Modifier le profil pédagogique |
  Gérer les affectations | Voir la charge horaire

### 2. TeacherDetailPage.tsx — Profil complet de l'enseignant

URL : /school/teachers/:id

HEADER :
  Avatar + Nom + N° Employé + Type contrat (badge)
  Spécialité | Diplôme | Date d'embauche

ONGLETS :

  1. "Profil" — informations pédagogiques
     - Matières enseignées (badges cliquables)
     - Matière principale (étoile)
     - Bouton : [Modifier les matières]

  2. "Affectations {année}" — classes assignées pour l'année courante
     → sélecteur d'année en haut
     → liste des affectations : Classe | Matière | Heures/sem | Actions
     → Bouton : [+ Nouvelle affectation]
     → Total charge horaire avec WorkloadGauge

  3. "Charge horaire" — détail de la charge
     → WorkloadDetail : liste + graphique bar
     → Warning si surchargé : ⚠️ "Dépasse la limite de 18h/sem"

  4. "Informations" — données admin (n° employé, contrat, dates)
     → Éditable par school_admin

### 3. TeacherProfileModal.tsx — Modifier le profil pédagogique

FORMULAIRE :
  1. Spécialité, Diplôme
  2. Type de contrat (select)
  3. Charge max hebdo (number input)
  4. Date d'embauche
  5. Matières enseignées (multi-select avec étoile pour la principale)
     → SearchSelect des subjects disponibles
     → Tags des matières sélectionnées
     → Étoile pour marquer la principale

### 4. AssignTeacherModal.tsx — Affecter un enseignant

CONTEXTE : peut être ouvert depuis :
  - La page d'un enseignant (class_id à choisir)
  - La page d'une classe (teacher_id à choisir)
  - La page générale des affectations

FORMULAIRE :
  1. Année scolaire (défaut: courante)
  2. Classe (SearchSelect avec display_name)
  3. Matière (filtré selon les compétences de l'enseignant)
  4. Enseignant (SearchSelect, filtré par matière si matière sélectionnée)
     → afficher charge actuelle sous le nom : "12h / 18h"
  5. Heures/semaine (number, optionnel)
  6. Date d'affectation
  7. Notes (textarea)

ALERTE SURCHARGE (en temps réel) :
  Si l'ajout des heures dépasse la limite :
  ⚠️ "Jean Kouassi sera à 22h/sem (limite: 18h). Continuer quand même ?"
  → Bouton [Confirmer] / [Annuler]

### 5. BulkAssignModal.tsx — Affectations en masse

Pour affecter UN enseignant à plusieurs classes en même temps.

FORMULAIRE :
  1. Enseignant (SearchSelect)
  2. Année scolaire
  3. Tableau dynamique :
     | Classe | Matière | Heures/sem | [Supprimer] |
     [+ Ajouter une ligne]

  En bas : Total heures à affecter | Charge actuelle | Après affectation (coloré)
  Si total > max → warning en rouge

### 6. ClassAssignmentsTab.tsx — Onglet Affectations dans ClasseDetailPage

Mise à jour de la ClasseDetailPage (Phase 2) :
Remplacer le placeholder par ce composant.

AFFICHAGE :
  Tableau des matières de la classe :
  | Matière | Coeff | H/sem | Enseignant | Actions |

  Pour chaque matière :
  - Si enseignant assigné → avatar + nom + badge vert "Assigné"
                          → bouton [Changer] [Retirer]
  - Si pas d'enseignant  → badge rouge "Non assigné"
                          → bouton [Assigner]

  En bas :
  Taux de complétion : 6/8 matières assignées (75%)
  [Barre de progression verte]

  Bouton : [Définir le professeur principal]
  → Opens SetMainTeacherModal

### 7. WorkloadGauge.tsx — Jauge de charge horaire

Composant réutilisable (utilisé dans liste + detail + modal).
Props: { current: number; max: number; showLabel?: boolean; size?: 'sm'|'md'|'lg' }

Affichage :
  - Barre de progression circulaire ou linéaire selon `size`
  - Texte centré : "16h / 18h"
  - Couleur dynamique selon getWorkloadColor()
  - Si is_overloaded : icône ⚠️ + texte rouge

### 8. SubjectTeacherMatrix.tsx — Vue matricielle (optionnel, avancé)

Vue globale pour school_admin :
  Lignes = Classes (6ème 1, 6ème 2, CM1 A, ...)
  Colonnes = Matières
  Cellule = Enseignant assigné (initiales) ou ∅ (rouge)

Permet de voir d'un coup d'œil les trous dans les affectations.
Filtre par catégorie de niveau.

## COMPOSANTS À CRÉER

1. WorkloadBar.tsx
   Props: { current: number; max: number; compact?: boolean }
   → Barre horizontale avec texte "16h/18h" et couleur

2. WorkloadGauge.tsx (décrit ci-dessus)

3. ContractTypeBadge.tsx
   Props: { type: ContractType }

4. SubjectTagList.tsx
   Props: { subjects: Subject[]; primarySubjectId?: number; max?: number }
   → Liste de badges matière, la principale avec une étoile
   → Tronque si > max avec "+N autres"

5. AssignmentStatusBadge.tsx
   Props: { isAssigned: boolean }
   → "Assigné" (vert) ou "Non assigné" (rouge)

6. TeacherSearchSelect.tsx
   Props: { value: number|null; onChange: fn; filterBySubjectId?: number; yearId: number }
   → SearchSelect avec debounce
   → Affiche : "Jean Kouassi — 12h/18h"
   → Option désactivée si enseignant inactif

## NAVIGATION (mise à jour)

Ajouter dans navigation.ts :
  /school/teachers          → TeachersPage       (icône: GraduationCap)
  /school/teachers/:id      → TeacherDetailPage
  /school/assignments       → (page optionnelle — vue globale des affectations)

## RÈGLES UX

1. Le warning de surcharge est affiché dans le modal ET dans la réponse API
   → Ne bloque pas la soumission, mais demande confirmation

2. Les matières d'un enseignant sont filtrées dans les selects d'affectation
   → Si l'enseignant n'enseigne pas une matière, elle apparaît grisée
     mais reste sélectionnable (un admin peut forcer)

3. La ClasseDetailPage (Phase 2) doit être mise à jour pour intégrer
   l'onglet "Affectations" remplaçant l'ancien placeholder

4. Le taux de complétion d'une classe est affiché dans la liste des classes
   → mise à jour de ClasseCard (Phase 2) avec AssignmentCompletionBadge
```

---

## RÉCAPITULATIF PHASE 5

| Session | Contenu | Fichiers clés |
|---------|---------|---------------|
| 5.1 | Migrations | `teachers`, `teacher_subjects`, `teacher_classes` |
| 5.2 | Enums + Models + Observer + Services | `Teacher`, `TeacherClass`, `UserObserver`, `TeacherService`, `AssignmentService` |
| 5.3 | Controllers + Resources + Routes | `TeacherController`, `AssignmentController`, `ClassAssignmentsResource` |
| 5.4 | Frontend Types + API + Hooks | `teachers.types.ts`, `teachers.api.ts`, `useTeachers.ts` |
| 5.5 | Frontend Pages + Composants | `TeachersPage`, `TeacherDetailPage`, `ClassAssignmentsTab`, `WorkloadGauge` |

---

### Points d'attention critiques

1. **UserObserver** — création automatique du profil Teacher quand `user.role = teacher`
   → toujours synchronisé, jamais créé manuellement en production

2. **UNIQUE(class_id, subject_id, academic_year_id)** — une matière = un seul enseignant par classe par an
   → pour changer d'enseignant : `unassign` l'ancien PUIS `assign` le nouveau

3. **Cache weekly_hours** — invalider `Cache::forget("teacher_{id}_weekly_hours")`
   après chaque assign/unassign pour ne pas afficher des données périmées

4. **Warning surcharge** — ne bloque PAS la requête, retourne un warning dans la réponse
   → le frontend affiche une confirmation avant de re-soumettre

5. **Mise à jour ClasseDetailPage** — l'onglet "Affectations" prévu en Phase 2
   (placeholder) est maintenant implémenté dans cette phase
