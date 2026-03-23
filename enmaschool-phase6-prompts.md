# ENMA SCHOOL — PROMPTS PHASE 6
## Notes & Évaluations

---

> ## PÉRIMÈTRE DE LA PHASE 6
>
> **Objectif :** Permettre aux enseignants de saisir les notes des élèves
> par évaluation, par matière et par période, avec calcul automatique
> des moyennes par matière, par période et générale.
>
> **Tables nouvelles :**
> | Table | Description |
> |-------|-------------|
> | `evaluations` | Définition d'un devoir/examen (type, date, barème) |
> | `grades` | Note d'un élève pour une évaluation |
> | `period_averages` | Moyennes calculées par élève/matière/période (cache) |
> | `subject_averages` | Moyenne annuelle par élève/matière (cache) |
>
> **Concepts clés :**
> - Une **evaluation** appartient à une classe + matière + période
> - Une **grade** rattache un élève à une évaluation avec sa note
> - Les **moyennes** sont calculées et mises en cache dans des tables dédiées
>   pour éviter de recalculer en temps réel à chaque bulletin
> - Le **coefficient** d'une évaluation pondère son poids dans la moyenne
> - Une note absente ≠ note de 0 (gestion des absences à l'évaluation)
> - La **validation** d'une période verrouille les notes (plus de modification)
>
> **Système de notation ivoirien :**
> - Barème standard : sur 20
> - Moyenne de passage : 10/20 (configurable dans school_settings)
> - Types d'évaluation : Devoir de classe (DC), Devoir maison (DM),
>   Composition (COMP), Examen (EXAM), Interrogation (INTERRO), TP
>
> **HORS PÉRIMÈTRE Phase 6 :**
> - Génération des bulletins PDF → Phase 7
> - Calcul de la moyenne générale pour la promotion → Phase 7
>
> **Dépendances requises :**
> - Phase 2 ✅ (classes, subjects, class_subjects, periods, academic_years)
> - Phase 4 ✅ (students, enrollments)
> - Phase 5 ✅ (teacher_classes — qui peut saisir quoi)

---

## SESSION 6.1 — Migrations

```
## CONTEXTE PROJET — ENMA SCHOOL

Stack : PHP 8.3 / Laravel 12 / PostgreSQL 18
Multi-tenant : stancl/tenancy v3 (schema-per-tenant)

Phases terminées :
- Phase 0-1 : Auth, SuperAdmin
- Phase 2 : Classes, Matières, Périodes, school_settings
- Phase 3 : Utilisateurs, Rôles
- Phase 4 : Élèves, Inscriptions (enrollments)
- Phase 5 : Enseignants, Affectations (teacher_classes)

Tables existantes utiles :
  classes(id, display_name, school_level_id, academic_year_id, capacity, ...)
  subjects(id, name, code, coefficient, ...)
  class_subjects(id, class_id, subject_id, coefficient_override, hours_per_week)
  periods(id, academic_year_id, name, type, order, is_current, is_closed)
  academic_years(id, name, is_current, passing_average, period_type, ...)
  students(id, matricule, first_name, last_name, ...)
  enrollments(id, student_id, classe_id, academic_year_id, is_active, ...)
  teacher_classes(id, teacher_id, class_id, subject_id, academic_year_id, is_active)

## CETTE SESSION — Phase 6 : Migrations

Toutes les migrations dans database/migrations/tenant/

## GÉNÈRE LES MIGRATIONS (dans l'ordre)

### 1. create_evaluations_table

Objectif : définir une évaluation (devoir, compo, examen...)
           pour une classe, une matière et une période données.

Colonnes :
  id
  class_id           (foreignId → classes, cascadeOnDelete)
  subject_id         (foreignId → subjects, cascadeOnDelete)
  period_id          (foreignId → periods, cascadeOnDelete)
  academic_year_id   (foreignId → academic_years, cascadeOnDelete)
                     NB : redondant avec period.academic_year_id mais utile pour les requêtes directes
  teacher_id         (foreignId → teachers, nullOnDelete, nullable)
                     enseignant qui a créé l'évaluation
  title              (string) — ex: "DC1 Mathématiques", "Composition 1er trimestre"
  type               (enum: dc/dm/composition/exam/interrogation/tp/other)
  date               (date) — date de l'évaluation
  max_score          (decimal 5,2, default:20.00) — barème (sur 20, sur 100, etc.)
  coefficient        (decimal 3,1, default:1.0) — poids dans la moyenne de la matière
  is_published       (boolean, default:false)
                     true = notes visibles aux élèves/parents (V2)
  is_locked          (boolean, default:false)
                     true = plus de modification possible (verrouillé par admin)
  description        (text, nullable) — instructions ou remarques
  created_by         (foreignId → users, nullOnDelete, nullable)
  timestamps, softDeletes()

  Index : class_id, subject_id, period_id, academic_year_id, date, type

### 2. create_grades_table

Objectif : note d'un élève pour une évaluation précise.

Colonnes :
  id
  evaluation_id      (foreignId → evaluations, cascadeOnDelete)
  student_id         (foreignId → students, cascadeOnDelete)
  enrollment_id      (foreignId → enrollments, cascadeOnDelete)
                     NB : lien vers l'inscription pour l'année scolaire
  score              (decimal 5,2, nullable)
                     NULL = absent à l'évaluation (≠ 0)
  is_absent          (boolean, default:false)
                     true = absent justifié (score peut rester null)
  absence_justified  (boolean, default:false)
                     true = absence justifiée (compte différemment selon config)
  comment            (text, nullable) — commentaire de l'enseignant sur la note
  entered_by         (foreignId → users, nullOnDelete, nullable)
  entered_at         (timestamp, nullable)
  updated_by         (foreignId → users, nullOnDelete, nullable)
  timestamps

  UNIQUE(evaluation_id, student_id)
  Index : evaluation_id, student_id, enrollment_id, score

  NB : pas de softDeletes — une note est un document officiel.
       Modification possible tant que la période n'est pas clôturée.

### 3. create_period_averages_table

Objectif : cache des moyennes par élève, matière et période.
           Recalculé à chaque saisie de note ou à la demande.
           Sert de base pour les bulletins.

Colonnes :
  id
  enrollment_id      (foreignId → enrollments, cascadeOnDelete)
  student_id         (foreignId → students, cascadeOnDelete)
  class_id           (foreignId → classes, cascadeOnDelete)
  subject_id         (foreignId → subjects, cascadeOnDelete)
  period_id          (foreignId → periods, cascadeOnDelete)
  academic_year_id   (foreignId → academic_years, cascadeOnDelete)

  average            (decimal 5,2, nullable) — moyenne de la période (sur 20)
  weighted_average   (decimal 5,2, nullable) — moyenne × coefficient matière
  coefficient        (decimal 3,1) — coefficient effectif de la matière
  evaluations_count  (unsignedSmallInteger, default:0) — nb d'évaluations
  absences_count     (unsignedSmallInteger, default:0) — nb d'absences
  rank               (unsignedSmallInteger, nullable) — rang dans la classe
  class_average      (decimal 5,2, nullable) — moyenne de la classe pour cette matière
  min_score          (decimal 5,2, nullable) — note la plus basse de la classe
  max_score          (decimal 5,2, nullable) — note la plus haute de la classe

  is_final           (boolean, default:false) — validé définitivement
  calculated_at      (timestamp) — date du dernier calcul
  timestamps

  UNIQUE(enrollment_id, subject_id, period_id)
  Index : enrollment_id, student_id, class_id, subject_id, period_id

### 4. create_subject_averages_table

Objectif : cache de la moyenne annuelle par élève et matière.
           Calculé à partir des period_averages.

Colonnes :
  id
  enrollment_id      (foreignId → enrollments, cascadeOnDelete)
  student_id         (foreignId → students, cascadeOnDelete)
  class_id           (foreignId → classes, cascadeOnDelete)
  subject_id         (foreignId → subjects, cascadeOnDelete)
  academic_year_id   (foreignId → academic_years, cascadeOnDelete)

  annual_average     (decimal 5,2, nullable) — moyenne annuelle (sur 20)
  weighted_average   (decimal 5,2, nullable) — moyenne × coefficient
  coefficient        (decimal 3,1)
  is_passing         (boolean, nullable) — true si >= passing_average
  rank               (unsignedSmallInteger, nullable)
  class_average      (decimal 5,2, nullable)
  period_averages    (jsonb) — snapshot des moyennes par période
                     ex: {"1": 14.5, "2": 12.0, "3": 15.5}
  calculated_at      (timestamp)
  timestamps

  UNIQUE(enrollment_id, subject_id, academic_year_id)
  Index : enrollment_id, student_id, class_id, subject_id, academic_year_id

## COMMANDES DE TEST

php artisan migrate --path=database/migrations/tenant
php artisan tinker
  >>> Schema::hasTable('evaluations')
  >>> Schema::hasTable('grades')
  >>> Schema::hasTable('period_averages')
  >>> Schema::hasTable('subject_averages')
  >>> Schema::getColumnListing('grades')
```

---

## SESSION 6.2 — Enums + Models + Services

```
## CONTEXTE PROJET — ENMA SCHOOL

Stack : PHP 8.3 / Laravel 12, strict_types=1, Enums PHP 8.1

Phase 6 Session 1 terminée :
- Migrations : evaluations, grades, period_averages, subject_averages ✅

## GÉNÈRE LES ENUMS

### app/Enums/EvaluationType.php
cases : Dc, Dm, Composition, Exam, Interrogation, Tp, Other
values: 'dc', 'dm', 'composition', 'exam', 'interrogation', 'tp', 'other'
méthode : label() →
  dc → "Devoir de Classe", dm → "Devoir Maison",
  composition → "Composition", exam → "Examen",
  interrogation → "Interrogation", tp → "Travaux Pratiques",
  other → "Autre"
méthode : short() →
  dc → "DC", dm → "DM", composition → "COMP",
  exam → "EXAM", interrogation → "INTERRO", tp → "TP", other → "AUTRE"
méthode : color() → couleur badge
méthode : countsForAverage() : bool
  → true pour tous sauf 'other' (selon la config de l'école)
méthode : defaultCoefficient() : float
  dc → 1.0, dm → 0.5, composition → 2.0,
  exam → 3.0, interrogation → 0.5, tp → 1.0, other → 1.0

## GÉNÈRE LES MODELS

### Evaluation.php

$fillable : class_id, subject_id, period_id, academic_year_id, teacher_id,
            title, type, date, max_score, coefficient,
            is_published, is_locked, description, created_by

Casts :
  type → EvaluationType::class
  date → 'date'
  max_score → 'decimal:2'
  coefficient → 'decimal:1'
  is_published → 'boolean'
  is_locked → 'boolean'

Relations :
  classe()       → belongsTo Classe (FK: class_id)
  subject()      → belongsTo Subject
  period()       → belongsTo Period
  academicYear() → belongsTo AcademicYear
  teacher()      → belongsTo Teacher
  createdBy()    → belongsTo User
  grades()       → hasMany Grade

Accessors :
  getGradesCountAttribute() : int → $this->grades()->count()
  getAverageScoreAttribute() : float|null
    → moyenne de toutes les notes (score non null) de cette évaluation

Méthodes :
  isEditable() : bool
    → !is_locked && !period->is_closed
  canBeEditedBy(User $user) : bool
    → is_locked = false ET (user est le teacher créateur OU user est school_admin/director)

Scopes :
  scopeForClass($query, int $classeId)
  scopeForPeriod($query, int $periodId)
  scopeForSubject($query, int $subjectId)
  scopeForTeacher($query, int $teacherId)
  scopePublished($query)
  scopeUnlocked($query)

softDeletes()

### Grade.php

$fillable : evaluation_id, student_id, enrollment_id, score,
            is_absent, absence_justified, comment, entered_by, entered_at, updated_by

Casts :
  score → 'decimal:2' (nullable)
  is_absent → 'boolean'
  absence_justified → 'boolean'
  entered_at → 'datetime'

Relations :
  evaluation() → belongsTo Evaluation
  student()    → belongsTo Student
  enrollment() → belongsTo Enrollment
  enteredBy()  → belongsTo User (FK: entered_by)
  updatedBy()  → belongsTo User (FK: updated_by)

Accessors :
  getScoreOn20Attribute() : float|null
    → si max_score == 20 → score
    → sinon → score * 20 / evaluation.max_score (normalisation)
  getIsPassingAttribute() : bool|null
    → score_on_20 >= passing_average (depuis school_settings)
    → null si absent

Scopes :
  scopeForEvaluation($query, int $evalId)
  scopeForStudent($query, int $studentId)
  scopePresent($query) → whereNull ou where('is_absent', false)
  scopeAbsent($query)

### PeriodAverage.php

$fillable : enrollment_id, student_id, class_id, subject_id, period_id,
            academic_year_id, average, weighted_average, coefficient,
            evaluations_count, absences_count, rank, class_average,
            min_score, max_score, is_final, calculated_at

Casts :
  average → 'decimal:2'
  weighted_average → 'decimal:2'
  coefficient → 'decimal:1'
  class_average → 'decimal:2'
  is_final → 'boolean'
  calculated_at → 'datetime'

Relations :
  enrollment()   → belongsTo Enrollment
  student()      → belongsTo Student
  classe()       → belongsTo Classe (FK: class_id)
  subject()      → belongsTo Subject
  period()       → belongsTo Period
  academicYear() → belongsTo AcademicYear

Accessor :
  getIsPassingAttribute() : bool|null
    → average >= SchoolSetting::get('passing_average', 10.0)

### SubjectAverage.php

$fillable : enrollment_id, student_id, class_id, subject_id, academic_year_id,
            annual_average, weighted_average, coefficient, is_passing,
            rank, class_average, period_averages, calculated_at

Casts :
  annual_average → 'decimal:2'
  weighted_average → 'decimal:2'
  is_passing → 'boolean'
  period_averages → 'array' (jsonb)
  calculated_at → 'datetime'

Relations : (mêmes que PeriodAverage sans period)

## GÉNÈRE LES SERVICES

### EvaluationService.php

list(array $filters) : LengthAwarePaginator
  filtres : class_id, subject_id, period_id, academic_year_id,
            teacher_id, type, date_from, date_to, per_page
  → eager load : subject, period, teacher.user, grades (count)

create(array $data, User $createdBy) : Evaluation
  → vérifier que period n'est pas clôturée
  → vérifier que l'enseignant est affecté à cette classe/matière
    (sinon warning si school_admin force)
  → créer automatiquement les grades vides pour tous les élèves inscrits :
    Grade::insert([...]) en bulk

update(Evaluation $evaluation, array $data) : Evaluation
  → vérifier evaluation->isEditable()

lock(Evaluation $evaluation) : Evaluation
  → is_locked = true (seul school_admin/director)

publish(Evaluation $evaluation) : Evaluation
  → is_published = true

delete(Evaluation $evaluation) : void
  → vérifier isEditable()
  → soft delete (cascade grades)

### GradeService.php

getForEvaluation(Evaluation $evaluation) : Collection
  → toutes les grades de l'évaluation avec student info
  → triées par student.last_name, first_name
  → eager load : student, enteredBy

saveGrade(Evaluation $evaluation, int $studentId, array $data, User $enteredBy) : Grade
  data : score (nullable), is_absent, absence_justified, comment
  → vérifier evaluation->isEditable()
  → vérifier que l'étudiant est inscrit dans la classe
  → updateOrCreate(['evaluation_id', 'student_id'], [...])
  → entered_at = now(), entered_by = $enteredBy->id
  → dispatch job RecalculatePeriodAverageJob(student_id, subject_id, period_id)

bulkSave(Evaluation $evaluation, array $gradesData, User $enteredBy) : array
  gradesData = [
    ['student_id' => X, 'score' => 15.5, 'is_absent' => false, 'comment' => ''],
    ['student_id' => Y, 'score' => null, 'is_absent' => true, ...],
    ...
  ]
  → traitement en transaction
  → updateOrCreate pour chaque grade
  → dispatch RecalculatePeriodAverageJob une seule fois par matière/période
  → retourner : { saved: int, errors: [...] }

getGradesSheet(int $classeId, int $subjectId, int $periodId) : array
  → retourne le tableau de saisie complet :
    {
      evaluations: [...],       // évaluations de cette matière/période
      students: [               // liste des élèves inscrits
        {
          student: {...},
          grades: {             // grades indexées par evaluation_id
            "1": { score: 15.5, is_absent: false },
            "2": { score: null, is_absent: true },
          }
        }
      ],
      period_averages: {...}    // moyennes actuelles par étudiant
    }

### AverageCalculatorService.php

NB : Ce service est le cœur du système de notes.
     Il calcule et stocke les moyennes en cache dans les tables dédiées.

calculatePeriodAverage(int $studentId, int $subjectId, int $periodId) : PeriodAverage
  Algorithme :
  1. Récupérer toutes les grades de l'étudiant pour cette matière/période
     → via Evaluation::forSubject()->forPeriod() JOIN grades
  2. Pour chaque évaluation avec une note (score non null) :
     → score_on_20 = score * 20 / evaluation.max_score
     → contribution = score_on_20 * evaluation.coefficient
  3. average = SUM(contribution) / SUM(coefficient des évaluations notées)
  4. Si aucune note → average = null
  5. Récupérer coefficient de la matière (ClassSubject::getEffectiveCoefficient)
  6. weighted_average = average * coefficient_matiere
  7. Calculer statistiques de la classe (class_average, min, max)
  8. Calculer le rang de l'élève dans la classe pour cette matière/période
  9. updateOrCreate dans period_averages

calculateAllPeriodAverages(int $classeId, int $periodId) : void
  → pour tous les élèves inscrits dans la classe
  → pour toutes les matières de la classe
  → dispatch multiple CalculatePeriodAverageJob (queue)

calculateSubjectAnnualAverage(int $studentId, int $subjectId, int $yearId) : SubjectAverage
  Algorithme :
  1. Récupérer toutes les period_averages de l'étudiant pour cette matière
  2. Calculer la moyenne des moyennes de période
     → pour trimestres : moyenne arithmétique des 3 périodes
     → pour semestres : moyenne arithmétique des 2 périodes
     NB : les périodes clôturées sont incluses, les périodes vides sont ignorées
  3. Stocker dans subject_averages avec snapshot period_averages jsonb

calculateGeneralAverage(int $studentId, int $yearId) : float|null
  → SUM(subject.weighted_average) / SUM(subject.coefficient)
  → utilisé pour le bulletin (Phase 7)

recalculateClassRanks(int $classeId, int $periodId) : void
  → recalculer les rangs de tous les élèves pour toutes les matières
  → appelé après chaque batch de notes

## JOBS (Queue)

### RecalculatePeriodAverageJob.php

Queue : 'averages'
Payload : student_id, subject_id, period_id, class_id

handle() :
  → app(AverageCalculatorService::class)->calculatePeriodAverage(...)
  → app(AverageCalculatorService::class)->calculateSubjectAnnualAverage(...)
  → Broadcast event GradesUpdated (WebSocket — Phase 11)

NB : Ce job est dispatché après chaque sauvegarde de note.
     Il est unique par (student_id, subject_id, period_id) pour éviter
     les calculs en double (withoutOverlapping() si Horizon disponible)

## COMMANDES DE TEST (tinker)

// Créer une évaluation
$service = app(App\Services\EvaluationService::class);
$eval = $service->create([
  'class_id' => 1, 'subject_id' => 1, 'period_id' => 1,
  'academic_year_id' => 1, 'title' => 'DC1 Maths',
  'type' => 'dc', 'date' => '2024-10-15',
  'max_score' => 20, 'coefficient' => 1.0,
], $user);
// → crée les grades vides pour tous les élèves inscrits

// Saisir les notes en bulk
$gradeService = app(App\Services\GradeService::class);
$gradeService->bulkSave($eval, [
  ['student_id' => 1, 'score' => 15.5],
  ['student_id' => 2, 'score' => 12.0],
  ['student_id' => 3, 'score' => null, 'is_absent' => true],
], $user);

// Calculer la moyenne
$calcService = app(App\Services\AverageCalculatorService::class);
$avg = $calcService->calculatePeriodAverage(1, 1, 1);
$avg->average // → 13.75 (ex)
$avg->rank    // → 2 (dans la classe)
```

---

## SESSION 6.3 — Controllers + Resources + Routes

```
## CONTEXTE PROJET — ENMA SCHOOL

Stack : PHP 8.3 / Laravel 12
Conventions : strict_types=1, Trait ApiResponse, Form Requests, Resources

Phase 6 Sessions 1 & 2 terminées ✅

## GÉNÈRE LES API RESOURCES

### EvaluationResource.php
{
  id, title,
  type: { value, label, short, color },
  date (d/m/Y),
  max_score, coefficient,
  is_published, is_locked,
  description,
  is_editable: bool,     // accessor
  grades_count: whenCounted,
  average_score: (float|null, whenLoaded),
  // Relations
  classe: { id, display_name } (whenLoaded),
  subject: SubjectResource (whenLoaded),
  period: { id, name, type } (whenLoaded),
  teacher: { id, full_name } (whenLoaded),
  created_at,
}

### GradeResource.php
{
  id,
  score (float|null),
  score_on_20 (float|null),   // normalisé sur 20
  is_absent, absence_justified,
  comment,
  is_passing (bool|null),
  entered_at,
  entered_by: { id, full_name } (whenLoaded),
  student: StudentListResource (whenLoaded),
  evaluation: { id, title, max_score, coefficient } (whenLoaded),
}

### GradesSheetResource.php
{
  classe: { id, display_name },
  subject: SubjectResource,
  period: { id, name, order },
  evaluations: EvaluationResource[],
  students: [
    {
      student: StudentListResource,
      enrollment_id: int,
      grades: {
        "{evaluation_id}": {
          score: float|null,
          score_on_20: float|null,
          is_absent: bool,
          absence_justified: bool,
          comment: string|null,
        }
      },
      period_average: float|null,   // moyenne actuelle
      absences_count: int,
    }
  ],
  class_stats: {
    average: float|null,
    min: float|null,
    max: float|null,
    passing_count: int,
    total_count: int,
    passing_rate: float,
  }
}

### PeriodAverageResource.php
{
  id,
  average (float|null),
  weighted_average (float|null),
  coefficient,
  evaluations_count,
  absences_count,
  rank (int|null),
  class_average (float|null),
  min_score (float|null),
  max_score (float|null),
  is_passing (bool|null),
  is_final,
  calculated_at,
  subject: SubjectResource (whenLoaded),
  period: { id, name } (whenLoaded),
  student: StudentListResource (whenLoaded),
}

### StudentGradesSummaryResource.php
{
  student: StudentListResource,
  enrollment_id: int,
  period_averages: [     // par période
    {
      period: { id, name, order },
      averages: [        // par matière
        {
          subject: SubjectResource,
          average: float|null,
          rank: int|null,
          is_passing: bool|null,
        }
      ],
      general_average: float|null,   // moyenne générale de la période
      general_rank: int|null,
    }
  ],
  annual_averages: [     // par matière, annuel
    {
      subject: SubjectResource,
      annual_average: float|null,
      is_passing: bool|null,
    }
  ],
  general_annual_average: float|null,
}

## GÉNÈRE LES FORM REQUESTS

### StoreEvaluationRequest
  class_id         : required, exists:classes,id
  subject_id       : required, exists:subjects,id
  period_id        : required, exists:periods,id
                     + vérifie que la période n'est pas clôturée
  academic_year_id : required, exists:academic_years,id
  title            : required, string, max:200
  type             : required, in: EvaluationType cases
  date             : required, date
  max_score        : required, numeric, min:1, max:100
  coefficient      : nullable, numeric, min:0.5, max:5.0
  description      : nullable, string, max:1000
  Messages : "La période est clôturée — impossible d'ajouter des évaluations"

### BulkSaveGradesRequest
  evaluation_id    : required, exists:evaluations,id
  grades           : required, array
  grades.*.student_id       : required, exists:students,id
  grades.*.score            : nullable, numeric, min:0,
                              max: evaluation.max_score
  grades.*.is_absent        : boolean
  grades.*.absence_justified: boolean
  grades.*.comment          : nullable, string, max:500
  Messages :
    "La note {X} dépasse le barème maximum de {Y}"
    "L'évaluation est verrouillée"
    "La période est clôturée"

## GÉNÈRE LES CONTROLLERS

### EvaluationController

index() → GET /school/evaluations
  filtres : class_id, subject_id, period_id, year_id, teacher_id, type
  → permission: grades.view
  → EvaluationResource paginé

store() → POST /school/evaluations
  → permission: grades.input
  → vérifier que l'user peut créer des évaluations pour cette classe/matière :
    teacher → seulement ses affectations
    school_admin/director → toutes les classes
  → créer les grades vides pour tous les élèves inscrits

show() → GET /school/evaluations/{evaluation}
  → load grades avec students

update() → PUT /school/evaluations/{evaluation}
  → permission: grades.input + isEditable()

lock() → POST /school/evaluations/{evaluation}/lock
  → permission: grades.validate

publish() → POST /school/evaluations/{evaluation}/publish
  → permission: grades.validate

destroy() → DELETE /school/evaluations/{evaluation}
  → permission: grades.delete + isEditable()

### GradeController

sheet() → GET /school/grades/sheet
  params: class_id, subject_id, period_id
  → permission: grades.view + vérifier accès (teacher = ses classes)
  → retourne GradesSheetResource (tableau de saisie complet)

bulkSave() → POST /school/grades/bulk
  → permission: grades.input
  → BulkSaveGradesRequest
  → vérifier accès (teacher = ses affectations seulement)
  → dispatch RecalculatePeriodAverageJob

saveOne() → PUT /school/grades/{grade}
  → permission: grades.input
  → sauvegarde une seule note (pratique pour mise à jour rapide)

// Récapitulatifs
studentSummary() → GET /school/grades/student/{student}
  params: academic_year_id
  → permission: grades.view
  → retourne StudentGradesSummaryResource

classSummary() → GET /school/grades/class/{classe}
  params: period_id, academic_year_id
  → permission: grades.view
  → retourne les moyennes de tous les élèves de la classe pour la période

periodAverages() → GET /school/period-averages
  params: class_id, period_id, subject_id, student_id
  → permission: grades.view
  → PeriodAverageResource collection

recalculate() → POST /school/grades/recalculate
  params: class_id, period_id
  → permission: grades.validate
  → dispatch calculateAllPeriodAverages en queue
  → retourne { message: "Recalcul lancé en arrière-plan" }

## ROUTES

Route::middleware(['auth:sanctum', 'tenant.active'])->group(function () {
  Route::prefix('school')->group(function () {

    // ── Évaluations ────────────────────────────────────
    Route::apiResource('evaluations', EvaluationController::class);
    Route::post('evaluations/{evaluation}/lock', [EvaluationController::class, 'lock'])
         ->middleware('can:grades.validate');
    Route::post('evaluations/{evaluation}/publish', [EvaluationController::class, 'publish'])
         ->middleware('can:grades.validate');

    // ── Notes ──────────────────────────────────────────
    Route::get('grades/sheet', [GradeController::class, 'sheet'])
         ->middleware('can:grades.view');
    Route::post('grades/bulk', [GradeController::class, 'bulkSave'])
         ->middleware('can:grades.input');
    Route::put('grades/{grade}', [GradeController::class, 'saveOne'])
         ->middleware('can:grades.input');
    Route::post('grades/recalculate', [GradeController::class, 'recalculate'])
         ->middleware('can:grades.validate');
    Route::get('grades/student/{student}', [GradeController::class, 'studentSummary'])
         ->middleware('can:grades.view');
    Route::get('grades/class/{classe}', [GradeController::class, 'classSummary'])
         ->middleware('can:grades.view');

    // ── Moyennes ───────────────────────────────────────
    Route::get('period-averages', [GradeController::class, 'periodAverages'])
         ->middleware('can:grades.view');
  });
});

## TESTS HOPPSCOTCH

// Créer une évaluation
POST /api/school/evaluations
{
  "class_id": 1, "subject_id": 1, "period_id": 1,
  "academic_year_id": 1, "title": "DC1 Mathématiques",
  "type": "dc", "date": "2024-10-15",
  "max_score": 20, "coefficient": 1.0
}
→ 201, évaluation + grades vides créées automatiquement

// Récupérer le tableau de saisie
GET /api/school/grades/sheet?class_id=1&subject_id=1&period_id=1
→ GradesSheetResource avec tous les élèves et leurs notes

// Saisir les notes en masse
POST /api/school/grades/bulk
{
  "evaluation_id": 1,
  "grades": [
    {"student_id": 1, "score": 15.5},
    {"student_id": 2, "score": 8.0},
    {"student_id": 3, "score": null, "is_absent": true}
  ]
}
→ { "saved": 3, "errors": [] }

// Récapitulatif d'un élève
GET /api/school/grades/student/1?academic_year_id=1
→ StudentGradesSummaryResource avec toutes les moyennes

// Verrouiller une évaluation
POST /api/school/evaluations/1/lock
→ { "is_locked": true }

// Recalculer
POST /api/school/grades/recalculate?class_id=1&period_id=1
→ { "message": "Recalcul lancé en arrière-plan" }
```

---

## SESSION 6.4 — Frontend : Types + API + Hooks

```
## CONTEXTE PROJET — ENMA SCHOOL

Stack : React 18 + TypeScript 5, TanStack Query v5, Zustand v4
Types existants : school.types.ts, students.types.ts, teachers.types.ts

Phase 6 Sessions 1-3 terminées ✅

## GÉNÈRE LES FICHIERS SUIVANTS

### src/modules/school/types/grades.types.ts

export type EvaluationType =
  'dc' | 'dm' | 'composition' | 'exam' | 'interrogation' | 'tp' | 'other';

export const EVALUATION_TYPE_LABELS: Record<EvaluationType, string> = {
  dc: 'Devoir de Classe', dm: 'Devoir Maison',
  composition: 'Composition', exam: 'Examen',
  interrogation: 'Interrogation', tp: 'Travaux Pratiques', other: 'Autre',
};

export const EVALUATION_TYPE_SHORT: Record<EvaluationType, string> = {
  dc: 'DC', dm: 'DM', composition: 'COMP',
  exam: 'EXAM', interrogation: 'INTERRO', tp: 'TP', other: 'AUTRE',
};

export const EVALUATION_TYPE_COLORS: Record<EvaluationType, string> = {
  dc: 'blue', dm: 'purple', composition: 'orange',
  exam: 'red', interrogation: 'green', tp: 'cyan', other: 'gray',
};

export interface Evaluation {
  id: number;
  title: string;
  type: { value: EvaluationType; label: string; short: string; color: string };
  date: string;
  max_score: number;
  coefficient: number;
  is_published: boolean;
  is_locked: boolean;
  is_editable: boolean;
  description: string | null;
  grades_count?: number;
  average_score?: number | null;
  classe?: { id: number; display_name: string };
  subject?: Subject;
  period?: { id: number; name: string; type: string };
  teacher?: { id: number; full_name: string };
  created_at: string;
}

export interface Grade {
  id: number;
  score: number | null;
  score_on_20: number | null;
  is_absent: boolean;
  absence_justified: boolean;
  comment: string | null;
  is_passing: boolean | null;
  entered_at: string | null;
  entered_by?: { id: number; full_name: string };
  student?: StudentListItem;
  evaluation?: Pick<Evaluation, 'id' | 'title' | 'max_score' | 'coefficient'>;
}

// Ligne dans le tableau de saisie
export interface GradeSheetRow {
  student: StudentListItem;
  enrollment_id: number;
  grades: Record<string, {   // clé = evaluation_id.toString()
    score: number | null;
    score_on_20: number | null;
    is_absent: boolean;
    absence_justified: boolean;
    comment: string | null;
  }>;
  period_average: number | null;
  absences_count: number;
}

export interface GradesSheet {
  classe: { id: number; display_name: string };
  subject: Subject;
  period: { id: number; name: string; order: number };
  evaluations: Evaluation[];
  students: GradeSheetRow[];
  class_stats: {
    average: number | null;
    min: number | null;
    max: number | null;
    passing_count: number;
    total_count: number;
    passing_rate: number;
  };
}

export interface PeriodAverage {
  id: number;
  average: number | null;
  weighted_average: number | null;
  coefficient: number;
  evaluations_count: number;
  absences_count: number;
  rank: number | null;
  class_average: number | null;
  min_score: number | null;
  max_score: number | null;
  is_passing: boolean | null;
  is_final: boolean;
  calculated_at: string;
  subject?: Subject;
  period?: { id: number; name: string };
  student?: StudentListItem;
}

export interface StudentGradesSummary {
  student: StudentListItem;
  enrollment_id: number;
  period_averages: Array<{
    period: { id: number; name: string; order: number };
    averages: Array<{
      subject: Subject;
      average: number | null;
      rank: number | null;
      is_passing: boolean | null;
    }>;
    general_average: number | null;
    general_rank: number | null;
  }>;
  annual_averages: Array<{
    subject: Subject;
    annual_average: number | null;
    is_passing: boolean | null;
  }>;
  general_annual_average: number | null;
}

// Pour la saisie en masse
export interface BulkGradeEntry {
  student_id: number;
  score: number | null;
  is_absent: boolean;
  absence_justified: boolean;
  comment?: string;
}

export interface EvaluationFormData {
  class_id: number;
  subject_id: number;
  period_id: number;
  academic_year_id: number;
  title: string;
  type: EvaluationType;
  date: string;
  max_score: number;
  coefficient: number;
  description?: string;
}

### src/modules/school/api/grades.api.ts

import { apiClient } from '@/shared/lib/axios';

export const evaluationsApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<PaginatedResponse<Evaluation>>('/school/evaluations', { params }),
  getOne: (id: number) =>
    apiClient.get<ApiSuccess<Evaluation>>(`/school/evaluations/${id}`),
  create: (data: EvaluationFormData) =>
    apiClient.post<ApiSuccess<Evaluation>>('/school/evaluations', data),
  update: (id: number, data: Partial<EvaluationFormData>) =>
    apiClient.put<ApiSuccess<Evaluation>>(`/school/evaluations/${id}`, data),
  delete: (id: number) =>
    apiClient.delete(`/school/evaluations/${id}`),
  lock: (id: number) =>
    apiClient.post<ApiSuccess<Evaluation>>(`/school/evaluations/${id}/lock`),
  publish: (id: number) =>
    apiClient.post<ApiSuccess<Evaluation>>(`/school/evaluations/${id}/publish`),
};

export const gradesApi = {
  getSheet: (params: { class_id: number; subject_id: number; period_id: number }) =>
    apiClient.get<ApiSuccess<GradesSheet>>('/school/grades/sheet', { params }),
  bulkSave: (data: { evaluation_id: number; grades: BulkGradeEntry[] }) =>
    apiClient.post<ApiSuccess<{ saved: number; errors: unknown[] }>>('/school/grades/bulk', data),
  saveOne: (gradeId: number, data: Partial<BulkGradeEntry>) =>
    apiClient.put<ApiSuccess<Grade>>(`/school/grades/${gradeId}`, data),
  getStudentSummary: (studentId: number, yearId: number) =>
    apiClient.get<ApiSuccess<StudentGradesSummary>>(`/school/grades/student/${studentId}`,
      { params: { academic_year_id: yearId } }),
  getClassSummary: (classeId: number, params: { period_id: number; academic_year_id: number }) =>
    apiClient.get(`/school/grades/class/${classeId}`, { params }),
  getPeriodAverages: (params: Record<string, unknown>) =>
    apiClient.get<PaginatedResponse<PeriodAverage>>('/school/period-averages', { params }),
  recalculate: (classeId: number, periodId: number) =>
    apiClient.post('/school/grades/recalculate', { class_id: classeId, period_id: periodId }),
};

### src/modules/school/hooks/useGrades.ts

// Évaluations
useEvaluations(filters)        → useQuery key: ['evaluations', filters]
useEvaluation(id)              → useQuery key: ['evaluation', id]
useCreateEvaluation()          → useMutation + invalidate ['evaluations']
useUpdateEvaluation()          → useMutation + invalidate ['evaluation', id]
useDeleteEvaluation()          → useMutation + invalidate ['evaluations']
useLockEvaluation()            → useMutation + invalidate ['evaluation', id]
usePublishEvaluation()         → useMutation + invalidate ['evaluation', id]

// Notes
useGradesSheet(classeId, subjectId, periodId)
  → useQuery key: ['grades-sheet', classeId, subjectId, periodId]
  → staleTime: 30 secondes (données quasi-temps réel)
useBulkSaveGrades()            → useMutation + invalidate ['grades-sheet', 'period-averages']
useSaveOneGrade()              → useMutation + invalidate ['grades-sheet']
useStudentGradesSummary(studentId, yearId)
  → useQuery key: ['student-grades', studentId, yearId]
useClassSummary(classeId, periodId, yearId)
  → useQuery key: ['class-grades', classeId, periodId, yearId]
usePeriodAverages(filters)     → useQuery key: ['period-averages', filters]
useRecalculateAverages()       → useMutation + invalidate ['period-averages', 'grades-sheet']

### src/modules/school/lib/gradeHelpers.ts

export function formatScore(score: number | null, maxScore: number): string {
  if (score === null) return '—';
  return `${score}/${maxScore}`;
}

export function formatAverage(avg: number | null): string {
  if (avg === null) return '—';
  return avg.toFixed(2);
}

export function getScoreColor(score: number | null, passingAvg = 10): string {
  if (score === null) return 'gray';
  if (score >= passingAvg) return 'green';
  if (score >= passingAvg * 0.75) return 'orange';
  return 'red';
}

export function getGradeLabel(score: number | null): string {
  // Correspondance note → mention ivoirienne
  if (score === null) return '—';
  if (score >= 16) return 'Très Bien';
  if (score >= 14) return 'Bien';
  if (score >= 12) return 'Assez Bien';
  if (score >= 10) return 'Passable';
  return 'Insuffisant';
}

export function calculateWeightedAverage(
  grades: Array<{ score_on_20: number; coefficient: number }>
): number | null {
  const valid = grades.filter(g => g.score_on_20 !== null);
  if (!valid.length) return null;
  const totalWeight = valid.reduce((s, g) => s + g.coefficient, 0);
  const totalScore = valid.reduce((s, g) => s + g.score_on_20 * g.coefficient, 0);
  return totalScore / totalWeight;
}

export function normalizeScore(score: number, maxScore: number): number {
  return (score * 20) / maxScore;
}
```

---

## SESSION 6.5 — Frontend Pages

```
## CONTEXTE PROJET — ENMA SCHOOL

Stack : React 18 + TypeScript 5, Tailwind + shadcn/ui, TanStack Query v5
Types, API, Hooks créés en Session 6.4 ✅

## GÉNÈRE LES PAGES ET COMPOSANTS

### 1. GradesPage.tsx — Page principale des notes

HEADER :
  Titre "Notes & Évaluations"
  Sélecteurs : Année scolaire | Classe | Matière | Période
  (Ces 4 sélecteurs sont le point d'entrée de TOUTE la gestion des notes)

VUE ENSEIGNANT (role=teacher) :
  → filtrée automatiquement sur ses classes affectées
  → liste de ses évaluations par classe/matière/période
  → accès rapide : [📝 Saisir les notes]

VUE ADMIN/DIRECTEUR :
  → vue globale toutes classes
  → Tableau de bord : "X classes avec notes incomplètes"
  → Accès rapide par classe → vue des affectations/états

### 2. GradesSheetPage.tsx — Tableau de saisie des notes

URL : /school/grades/sheet?class_id=X&subject_id=X&period_id=X

C'est la PAGE CENTRALE de la Phase 6 — le cahier de notes numérique.

HEADER :
  Classe : "6ème 1" | Matière : "Mathématiques" | Période : "1er Trimestre"
  Boutons : [+ Nouvelle évaluation] [↻ Recalculer] [🔒 Verrouiller période]

TABLEAU DE SAISIE (TanStack Table) :
  Structure :
  ┌────────────────┬─────────────┬─────────────┬─────────────┬─────────┐
  │ Élève          │ DC1 (20)    │ DC2 (20)    │ COMP (20)   │ MOY     │
  │                │ coeff: 1    │ coeff: 1    │ coeff: 2    │         │
  ├────────────────┼─────────────┼─────────────┼─────────────┼─────────┤
  │ BAMBA Aminata  │ [15.5]      │ [12.0]      │ [_____]     │ 14.33   │
  │ COULIBALY Jean │ [ABS]       │ [8.5]       │ [11.0]      │  9.75   │
  │ DABO Marie     │ [18.0]      │ [16.0]      │ [17.5]      │ 17.25   │
  └────────────────┴─────────────┴─────────────┴─────────────┴─────────┘

  - Chaque cellule = input numérique inline éditable (clavier naturel)
  - Tab/Entrée → passe à la cellule suivante (navigation clavier)
  - Click sur "ABS" → marque absent (score devient null)
  - Couleur de la note selon passing_average (vert/orange/rouge)
  - Moyenne calculée en temps réel côté frontend (sans rechargement)
  - Sauvegarde auto après 1 seconde de pause (debounce 1000ms)
  - Indicateur de sauvegarde : "Saved ✓" / "Saving..." / "Error ✕"

  EN-TÊTE DES ÉVALUATIONS :
  - Titre cliquable → ouvre EvaluationDetailModal
  - Badge type (DC, DM, COMP...)
  - Icône 🔒 si locked
  - Moyenne de la classe sous chaque évaluation

  LIGNE DE STATS EN BAS :
  Moyenne classe | Note min | Note max | % réussite | Nb absents

### 3. EvaluationFormModal.tsx — Créer/Modifier une évaluation

FORMULAIRE :
  1. Titre (string)
  2. Type (select avec badges colorés : DC, DM, COMP, EXAM...)
  3. Date
  4. Barème (max_score — défaut: 20)
  5. Coefficient (défaut selon le type)
  6. Description (optionnel)

  APERÇU :
  "Cette évaluation comptera pour {coeff/(sum_coefficients)*100}%
   de la moyenne de {subject} au {period}"

### 4. EvaluationDetailModal.tsx — Détail + stats d'une évaluation

  - Statistiques : note min, max, moyenne, écart-type
  - Histogramme de distribution des notes (Recharts BarChart)
  - Liste des absences
  - Boutons : [Modifier] [Verrouiller] [Publier] [Supprimer]

### 5. StudentGradesSummaryPage.tsx — Relevé de notes d'un élève

URL : /school/students/:id/grades

Accessible depuis le dossier élève (onglet "Notes").

AFFICHAGE PAR PÉRIODE :
  Onglets : "1er Trimestre" | "2ème Trimestre" | "3ème Trimestre"

  Pour chaque période → tableau :
  | Matière | Coeff | Moy période | Rang | Mention |
  | Maths   | 4     | 14.33       | 3e   | Bien    |
  | Français| 3     | 11.50       | 12e  | Passable|
  ...
  | MOYENNE GÉNÉRALE | — | 13.25 | 5e/35 | Assez Bien |

  → Couleur vert/rouge selon passing_average

ONGLET "ANNUEL" :
  Tableau des moyennes annuelles + rang annuel

### 6. ClassGradesSummaryPage.tsx — Tableau de bord d'une classe

URL : /school/classes/:id/grades

Accessible depuis la ClasseDetailPage.

TABLEAU :
  Lignes = élèves, Colonnes = matières
  Cellules = moyenne de la période/année

  Stats par matière (en bas) :
  Moyenne classe | Taux de réussite

  Stats par élève (à droite) :
  Moyenne générale | Rang

  Filtres : Période (Trimestre 1/2/3 ou Annuel)

## COMPOSANTS À CRÉER

1. GradeInput.tsx
   Props: { value: number|null; isAbsent: boolean; maxScore: number;
            onChange: fn; onAbsent: fn; disabled?: boolean }
   → Input numérique inline avec gestion "ABS"
   → Coloré selon la note (vert/orange/rouge)
   → Support navigation clavier (Tab, Entrée, Flèches)

2. ScoreBadge.tsx
   Props: { score: number|null; maxScore?: number; passingAvg?: number }
   → Affiche "15.5/20" ou "ABS" avec couleur adaptée

3. AverageBadge.tsx
   Props: { average: number|null; passingAvg?: number; showMention?: boolean }
   → "14.33 — Bien" avec couleur verte/rouge

4. RankBadge.tsx
   Props: { rank: number|null; total: number }
   → "5e/35" avec médaille dorée pour 1er-3ème

5. EvaluationTypeBadge.tsx
   Props: { type: EvaluationType }
   → "DC", "COMP", "EXAM" avec couleur

6. GradeDistributionChart.tsx
   Props: { grades: number[]; maxScore: number; passingAvg: number }
   → BarChart Recharts : distribution des notes par tranche
   → Ligne verticale rouge à passing_average

7. PeriodAveragesTable.tsx
   Props: { averages: PeriodAverage[]; showRank?: boolean }
   → Tableau matière × moyenne × rang × mention

8. AutoSaveIndicator.tsx
   Props: { status: 'idle'|'saving'|'saved'|'error' }
   → Indicateur discret de sauvegarde automatique

## NAVIGATION (mise à jour)

Ajouter dans navigation.ts :
  /school/grades                    → GradesPage       (icône: ClipboardList)
  /school/grades/sheet              → GradesSheetPage
  /school/students/:id/grades       → StudentGradesSummaryPage
  /school/classes/:id/grades        → ClassGradesSummaryPage

## RÈGLES UX CRITIQUES

1. Navigation clavier dans le tableau de saisie :
   → Tab = cellule suivante (droite puis ligne suivante)
   → Shift+Tab = cellule précédente
   → Entrée = confirme et descend
   → Échap = annule la modification

2. Sauvegarde automatique avec debounce 1000ms :
   → Pas de bouton "Enregistrer" manuel
   → AutoSaveIndicator toujours visible

3. Cells verrouillées si :
   → evaluation.is_locked = true
   → period.is_closed = true
   → L'enseignant n'est pas affecté à cette classe/matière

4. La moyenne est recalculée localement en temps réel
   (sans attendre le serveur) pour une UX fluide,
   puis confirmée par les données serveur après sauvegarde

5. Score "ABS" vs score 0 :
   → Bouton toggle sur chaque cellule
   → "ABS" n'entre pas dans le calcul de la moyenne
   → 0 entre dans le calcul
   → Distinction visuelle claire
```

---

## RÉCAPITULATIF PHASE 6

| Session | Contenu | Fichiers clés |
|---------|---------|---------------|
| 6.1 | Migrations | `evaluations`, `grades`, `period_averages`, `subject_averages` |
| 6.2 | Enums + Models + Services + Job | `Evaluation`, `Grade`, `PeriodAverage`, `EvaluationService`, `GradeService`, `AverageCalculatorService`, `RecalculatePeriodAverageJob` |
| 6.3 | Controllers + Resources + Routes | `EvaluationController`, `GradeController`, `GradesSheetResource` |
| 6.4 | Frontend Types + API + Hooks | `grades.types.ts`, `grades.api.ts`, `useGrades.ts`, `gradeHelpers.ts` |
| 6.5 | Frontend Pages + Composants | `GradesSheetPage` (cahier de notes), `StudentGradesSummaryPage`, `ClassGradesSummaryPage` |

---

### Points d'attention critiques

1. **NULL ≠ 0** — une note absente (null) ne doit JAMAIS entrer dans le calcul de la moyenne

2. **Grades vides auto-créées** — à chaque création d'évaluation, des entrées Grade vides
   sont créées pour tous les élèves inscrits (évite les jointures manquantes)

3. **Job queue pour les calculs** — `RecalculatePeriodAverageJob` dispatché après chaque
   bulkSave pour ne pas bloquer la réponse HTTP

4. **Normalisation sur 20** — toute note est ramenée sur 20 avant le calcul de la moyenne
   (`score * 20 / max_score`)

5. **Verrouillage en cascade** — période clôturée → toutes ses évaluations deviennent
   non éditables, même sans is_locked explicite
