# ENMA SCHOOL — PROMPTS PHASE 2 CORRIGÉS
## Config École & Structure Académique
### Correction : Gestion Level + Série + Section

---

> ## ⚠️ CLARIFICATION FONDAMENTALE : Série vs Section
>
> Ces deux concepts sont DISTINCTS et doivent être bien séparés dans tout le code :
>
> | Champ | Nom | Valeurs | Présent sur |
> |-------|-----|---------|-------------|
> | `section` | Numéro/lettre de la classe | `1, 2, 3...` ou `A, B, C...` | **TOUTES les classes** |
> | `serie` | Série académique | `A, B, C, D, F1, F2, G1, G2, G3` | **Uniquement 1ère et Terminale** |
>
> **Exemples concrets :**
> - `6ème 1` → level: 6ème, serie: null, section: "1"
> - `6ème 2` → level: 6ème, serie: null, section: "2"
> - `CM1 A` → level: CM1, serie: null, section: "A"
> - `PS B` → level: PS, serie: null, section: "B"
> - `2nde 1` → level: 2nde, serie: null, section: "1" *(pas de série en 2nde)*
> - `1ère A2` → level: 1ère, serie: A, section: "2"
> - `Tle C1` → level: Terminale, serie: C, section: "1"
>
> La section est **toujours obligatoire**. La série est obligatoire uniquement si `school_level.requires_serie = true`.

---

## SESSION 2.1 — Migrations Tenant

```
## CONTEXTE PROJET — ENMA SCHOOL

Stack : PHP 8.3 / Laravel 12 / PostgreSQL 18 / React 18 + TypeScript
Multi-tenant : stancl/tenancy v3 (schema-per-tenant)
Auth : Laravel Sanctum + Spatie Permission

Phases terminées :
- Phase 0 : Multi-tenant, Auth, Middlewares, Frontend base
- Phase 1 : Interface SuperAdmin complète

## CETTE SESSION — Phase 2 : Migrations Tenant

Créer toutes les migrations du schema tenant pour la Phase 2.

## SYSTÈME SCOLAIRE IVOIRIEN (RAPPEL CRITIQUE)

Niveaux scolaires :
  Maternelle : PS, MS, GS
  Primaire   : CP1, CP2, CE1, CE2, CM1, CM2
  Collège    : 6ème, 5ème, 4ème, 3ème
  Lycée      : 2nde, 1ère, Terminale

Concept SECTION vs SÉRIE (à bien distinguer) :
  - section  : numéro/lettre d'une classe dans son niveau (1,2,3... ou A,B,C...)
               OBLIGATOIRE pour TOUTES les classes
               ex: "6ème 1", "6ème 2", "CM1 A", "CM1 B", "PS A", "PS B"
  - serie    : série académique (A,B,C,D,F1,F2,G1,G2,G3)
               UNIQUEMENT pour les niveaux où requires_serie = true
               En Côte d'Ivoire : SEULEMENT 1ère et Terminale
               La 2nde n'a PAS de série.
               ex: "1ère A1", "1ère B2", "Tle C1", "Tle D3"

Format display_name auto-généré :
  - Avec série  : "{short_label} {serie}{section}"  → "Tle C1", "1ère A2"
  - Sans série  : "{label} {section}"               → "6ème 2", "CM1 A", "PS B"

## GÉNÈRE LES MIGRATIONS SUIVANTES (dans l'ordre)

1. create_school_settings_table
   - id, key (unique), value (text), type (enum: string/integer/boolean/json/float),
     group (enum: general/academic/grading/attendance/fees/notifications),
     label (string), description (text nullable)
   - timestamps (pas de soft_deletes — settings non supprimables)

2. create_academic_years_table
   - id, name (string), status (enum: draft/active/closed), start_date, end_date
   - period_type (enum: trimestre/semestre)
   - is_current (boolean default false)
   - passing_average (decimal 4,2 default 10.00)
   - promotion_type (enum: automatic/manual/by_average)
   - closed_at (timestamp nullable), created_by (foreignId → users, nullable)
   - timestamps

3. create_periods_table
   - id, academic_year_id (foreignId cascade), name, type (enum: trimestre/semestre)
   - order (unsignedSmallInteger)
   - start_date, end_date, is_current (boolean default false), is_closed (boolean default false)
   - timestamps
   - UNIQUE(academic_year_id, order)

4. create_school_levels_table
   - id, code (string unique)
   - category (enum: maternelle/primaire/college/lycee)
   - label (string) — ex: "Sixième", "CM1", "Petite Section"
   - short_label (string) — ex: "6ème", "CM1", "PS"
   - order (unsignedSmallInteger) — pour le tri
   - requires_serie (boolean default false) — TRUE seulement pour 1ère et Terminale
   - is_active (boolean default true)
   - timestamps (pas de soft_deletes)
   - NB : Cette table est pré-remplie par seeder. Pas de created_by.

5. create_classes_table
   - id, academic_year_id (foreignId cascade), school_level_id (foreignId restrict)
   - main_teacher_id (foreignId nullable → users, nullOnDelete)
   - room_id (foreignId nullable → rooms, nullOnDelete)
   - serie (string nullable) — série académique (A,B,C,D,F1,F2,G1,G2,G3)
                               NULL pour TOUTES les classes sauf 1ère/Terminale
   - section (string) — numéro/lettre de la classe (1,2,3 ou A,B,C)
                        OBLIGATOIRE pour TOUTES les classes
   - display_name (string) — généré automatiquement via Model::boot()
   - capacity (unsignedSmallInteger default 40)
   - is_active (boolean default true)
   - softDeletes(), timestamps
   - UNIQUE(academic_year_id, school_level_id, serie, section)
   - NB: Pour UNIQUE, serie peut être NULL → PostgreSQL traite NULL comme distinct,
         donc ajouter une contrainte partielle si nécessaire OU gérer en validation

6. create_subjects_table
   - id, name, code (string unique), coefficient (decimal 3,1 default 1.0)
   - color (string 7 — hex color, default '#6366f1')
   - category (enum nullable: litteraire/scientifique/technique/artistique/sportif)
   - is_active (boolean default true)
   - softDeletes(), timestamps

7. create_class_subjects_table
   - id, class_id (foreignId cascade), subject_id (foreignId cascade)
   - coefficient_override (decimal 3,1 nullable)
   - hours_per_week (decimal 3,1 nullable)
   - is_active (boolean default true)
   - timestamps
   - UNIQUE(class_id, subject_id)

8. create_rooms_table
   - id, name, code (string nullable unique)
   - type (enum: classroom/lab/gym/library/amphitheater/other)
   - capacity (unsignedSmallInteger default 40)
   - floor (string nullable), building (string nullable)
   - equipment (jsonb nullable) — ex: {"projector": true, "ac": false}
   - is_active (boolean default true)
   - softDeletes(), timestamps

## CONTRAINTES IMPORTANTES

- Toutes ces migrations sont dans le dossier database/migrations/tenant/
- Utiliser Schema::create() avec tenant connection
- Les foreignId utilisent ->constrained()->cascadeOnDelete() ou ->restrictOnDelete() selon le cas
- Pour classes.serie : nullable() car absent pour maternelle/primaire/collège/2nde
- Pour classes.section : NON nullable, toujours présent

## GÉNÈRE AUSSI

Le SchoolLevelSeeder avec les 16 niveaux ivoiriens :

| code     | category  | label          | short_label | order | requires_serie |
|----------|-----------|----------------|-------------|-------|----------------|
| PS       | maternelle| Petite Section | PS          | 1     | false          |
| MS       | maternelle| Moyenne Section| MS          | 2     | false          |
| GS       | maternelle| Grande Section | GS          | 3     | false          |
| CP1      | primaire  | Cours Préparatoire 1 | CP1   | 4     | false          |
| CP2      | primaire  | Cours Préparatoire 2 | CP2   | 5     | false          |
| CE1      | primaire  | Cours Élémentaire 1  | CE1   | 6     | false          |
| CE2      | primaire  | Cours Élémentaire 2  | CE2   | 7     | false          |
| CM1      | primaire  | Cours Moyen 1  | CM1         | 8     | false          |
| CM2      | primaire  | Cours Moyen 2  | CM2         | 9     | false          |
| 6EME     | college   | Sixième        | 6ème        | 10    | false          |
| 5EME     | college   | Cinquième      | 5ème        | 11    | false          |
| 4EME     | college   | Quatrième      | 4ème        | 12    | false          |
| 3EME     | college   | Troisième      | 3ème        | 13    | false          |
| 2NDE     | lycee     | Seconde        | 2nde        | 14    | false          |
| 1ERE     | lycee     | Première       | 1ère        | 15    | true           |
| TLE      | lycee     | Terminale      | Tle         | 16    | true           |

Commande de test : php artisan migrate --path=database/migrations/tenant
```

---

## SESSION 2.2 — Enums + Models + Services

```
## CONTEXTE PROJET — ENMA SCHOOL

Stack : PHP 8.3 / Laravel 12 / PostgreSQL 18
Multi-tenant : stancl/tenancy v3 (schema-per-tenant)
Conventions : strict_types=1, typage strict, Enums PHP 8.1, logique dans Services

Phase 2 Session 1 terminée :
- Migrations créées et testées (school_settings, academic_years, periods,
  school_levels, classes, subjects, class_subjects, rooms)
- SchoolLevelSeeder exécuté (16 niveaux ivoiriens en base)

## RAPPEL CRITIQUE : SECTION vs SÉRIE dans classes

- section  : TOUJOURS présent (1,2,3... ou A,B,C...) — identifie la classe dans son niveau
- serie    : UNIQUEMENT pour 1ère et Terminale (A,B,C,D,F1,F2,G1,G2,G3)
- display_name format :
  * avec serie  → "{short_label} {serie}{section}" ex: "Tle C1", "1ère A2"
  * sans serie  → "{label} {section}"              ex: "6ème 1", "CM1 A", "PS B"

## GÉNÈRE LES ENUMS

app/Enums/ (dans le schema tenant) :

1. LevelCategory.php
   cases: Maternelle, Primaire, College, Lycee
   méthode: label() → "Maternelle", "Primaire", "Collège", "Lycée"
   méthode: color() → couleur hex pour badge UI

2. LevelCode.php
   cases: PS, MS, GS, CP1, CP2, CE1, CE2, CM1, CM2,
          SIXIEME (value:'6EME'), CINQUIEME (value:'5EME'),
          QUATRIEME (value:'4EME'), TROISIEME (value:'3EME'),
          SECONDE (value:'2NDE'), PREMIERE (value:'1ERE'),
          TERMINALE (value:'TLE')
   méthode: requiresSerie() → bool (true seulement PREMIERE et TERMINALE)
   méthode: category() → LevelCategory

3. LyceeSerie.php
   cases: A, B, C, D, F1, F2, G1, G2, G3
   méthode: label() → "Série A", "Série B", etc.
   méthode: shortLabel() → "A", "B", "C", "D", "F1", "F2", "G1", "G2", "G3"

4. PeriodType.php
   cases: Trimestre, Semestre
   méthode: label() → "Trimestre", "Semestre"
   méthode: count() → int (3 pour trimestre, 2 pour semestre)
   méthode: periodNames() → array des noms par défaut
     Trimestre : ["1er Trimestre", "2ème Trimestre", "3ème Trimestre"]
     Semestre  : ["1er Semestre", "2ème Semestre"]

5. AcademicYearStatus.php
   cases: Draft, Active, Closed
   méthode: label(), color()

6. PromotionType.php
   cases: Automatic, Manual, ByAverage
   méthode: label() → "Automatique", "Manuel", "Par moyenne"

7. RoomType.php
   cases: Classroom, Lab, Gym, Library, Amphitheater, Other
   méthode: label(), icon() → string lucide icon name

8. SettingType.php
   cases: String, Integer, Boolean, Json, Float

9. SettingGroup.php
   cases: General, Academic, Grading, Attendance, Fees, Notifications
   méthode: label() → libellé français

10. SubjectCategory.php (nullable)
    cases: Litteraire, Scientifique, Technique, Artistique, Sportif
    méthode: label(), color()

## GÉNÈRE LES MODELS

1. SchoolSetting.php
   - $fillable : key, value, type, group, label, description
   - Cast : type → SettingType::class, group → SettingGroup::class
   - Méthode statique : get(string $key, mixed $default = null) : mixed
     → utilise Cache::remember("school_setting_{$key}", 3600, ...)
     → caste la valeur selon le type (bool, int, float, json_decode, string)
   - boot() : after saving → Cache::forget("school_setting_{$key}")
   - Méthode statique : set(string $key, mixed $value) : void

2. AcademicYear.php
   - $fillable complet, casts : status→AcademicYearStatus, period_type→PeriodType
   - Relations : periods() hasMany, classes() hasMany, createdBy() belongsTo User
   - Scope : scopeCurrent(), scopeActive()
   - boot() : avant save si is_current=true → mettre tous les autres à false
   - Méthode : isClosed() → bool, canBeActivated() → bool
   - Accessor : getFormattedDatesAttribute() → "2024-2025"

3. Period.php
   - $fillable, casts : type→PeriodType
   - Relations : academicYear() belongsTo, grades() hasMany (Phase 6)
   - Scope : scopeCurrent()
   - boot() : même pattern is_current → un seul courant par academic_year

4. SchoolLevel.php
   - $fillable, casts : category→LevelCategory, code→LevelCode, requires_serie→bool
   - Scope : scopeForTenant() → filtre par les flags has_* du tenant courant
     ex: si !tenant()->has_lycee → exclure category = lycee
   - Scope : scopeActive()
   - Méthode : requiresSerie() → bool (délègue à code->requiresSerie())
   - Pas de softDeletes

5. Classe.php  ← NB: "Classe" pas "Class"
   - $fillable : academic_year_id, school_level_id, main_teacher_id, room_id,
                 serie, section, display_name, capacity, is_active
   - Casts : is_active→bool
   - Relations :
     * academicYear() belongsTo AcademicYear
     * level() belongsTo SchoolLevel (FK: school_level_id)
     * mainTeacher() belongsTo User (FK: main_teacher_id, nullable)
     * room() belongsTo Room (nullable)
     * subjects() belongsToMany Subject via class_subjects (withPivot: coefficient_override, hours_per_week, is_active)
     * students() hasMany Student (Phase 4)
   - boot() :
     * creating ET updating → $model->display_name = self::generateDisplayName($model)
   - Méthode statique : generateDisplayName(Classe $classe) : string
     LOGIQUE :
       $level = $classe->level ?? SchoolLevel::find($classe->school_level_id);
       if ($level->requires_serie && !empty($classe->serie)) :
         return "{$level->short_label} {$classe->serie}{$classe->section}";
         // ex: "Tle C1", "1ère A2", "1ère B3"
       else :
         return "{$level->label} {$classe->section}";
         // ex: "6ème 1", "CM1 A", "PS B", "2nde 2"
   - Scope : scopeForYear($yearId), scopeActive()
   - softDeletes()

6. Subject.php
   - $fillable, casts : category→SubjectCategory (nullable), is_active→bool
   - Relations : classes() belongsToMany via class_subjects
   - softDeletes()

7. ClassSubject.php
   - $fillable, casts
   - Relations : classe() belongsTo Classe, subject() belongsTo Subject
   - Accessor : getEffectiveCoefficientAttribute()
     → return $this->coefficient_override ?? $this->subject->coefficient;

8. Room.php
   - $fillable, casts : type→RoomType, equipment→'array'
   - Relations : classes() hasMany
   - softDeletes()

## GÉNÈRE LES SERVICES

1. SchoolSettingService.php
   - getAll() : Collection
   - getByGroup(SettingGroup $group) : Collection
   - update(string $key, mixed $value) : SchoolSetting
   - bulkUpdate(array $settings) : void

2. AcademicYearService.php
   - list(array $filters) : LengthAwarePaginator
   - create(array $data) : AcademicYear
     → crée aussi les périodes automatiquement selon period_type
     → si period_type = Trimestre → 3 périodes, si Semestre → 2 périodes
   - update(AcademicYear $year, array $data) : AcademicYear
   - activate(AcademicYear $year) : AcademicYear
     → vérifie qu'aucune autre n'est active (status=active)
     → passe la courante à closed si nécessaire
   - close(AcademicYear $year) : AcademicYear
   - delete(AcademicYear $year) : void → soft delete si status = draft seulement

3. ClasseService.php
   - list(array $filters) : LengthAwarePaginator
     → filtres : academic_year_id, school_level_id, category, search, is_active
   - create(array $data) : Classe
     → vérifie la cohérence serie/section selon le level
     → si level->requires_serie et serie vide → exception
     → si !level->requires_serie et serie non vide → ignore/null la serie
   - bulkCreate(array $classesData) : Collection
     → crée plusieurs classes d'un coup (pour le formulaire bulk)
   - update(Classe $classe, array $data) : Classe
   - delete(Classe $classe) : void → soft delete, vérifie qu'il n'y a pas d'élèves
   - syncSubjects(Classe $classe, array $subjectIds) : void
   - generateSectionOptions() : array
     → retourne ['1','2','3','4','5','6','7','8','9','10','A','B','C','D','E','F']
   - generateSerieOptions() : array
     → retourne les cases de LyceeSerie::cases()

4. SubjectService.php
   - list(array $filters) : LengthAwarePaginator
   - create(array $data) : Subject
   - update(Subject $subject, array $data) : Subject
   - delete(Subject $subject) : void

5. RoomService.php
   - list(array $filters) : LengthAwarePaginator
   - create(array $data) : Room
   - update(Room $room, array $data) : Room
   - delete(Room $room) : void

Commandes de test après génération :
  php artisan tinker
  >>> App\Models\Classe::generateDisplayName(...) — tester les formats
  >>> App\Models\SchoolLevel::forTenant()->get()
```

---

## SESSION 2.3 — Controllers + Resources + Routes

```
## CONTEXTE PROJET — ENMA SCHOOL

Stack : PHP 8.3 / Laravel 12, Conventions : strict_types=1, ApiResponse trait,
Form Requests pour validation, Resources pour toutes les réponses

Phase 2 Sessions 1 & 2 terminées :
- Migrations OK, Enums OK, Models OK, Services OK

## RAPPEL CRITIQUE : SECTION vs SÉRIE

- section : TOUJOURS obligatoire (identifie la classe dans son niveau : 1,2,3 ou A,B,C)
- serie   : UNIQUEMENT 1ère et Terminale (A,B,C,D,F1,F2,G1,G2,G3)
- La validation DOIT vérifier cette cohérence (voir règles ci-dessous)

## GÉNÈRE LES API RESOURCES

1. SchoolSettingResource.php
   → id, key, value (casté), type, group, label, description

2. AcademicYearResource.php
   → id, name, status{value,label,color}, start_date, end_date,
     period_type{value,label}, is_current, passing_average,
     promotion_type{value,label}, closed_at, created_at
   → whenLoaded : periods (collection PeriodResource)

3. PeriodResource.php
   → id, academic_year_id, name, type{value,label}, order,
     start_date, end_date, is_current, is_closed

4. SchoolLevelResource.php
   → id, code, category{value,label,color}, label, short_label,
     order, requires_serie, is_active
   NB : requires_serie=true SEULEMENT pour 1ère et Terminale

5. ClasseResource.php
   → id, academic_year_id, display_name, serie, section, capacity, is_active
   → level : SchoolLevelResource (whenLoaded)
   → main_teacher : {id, full_name} (whenLoaded, nullable)
   → room : {id, name, code} (whenLoaded, nullable)
   → subjects_count : whenCounted
   → students_count : whenCounted (Phase 4, mettre 0 pour l'instant)
   NB : display_name est calculé auto, ne pas exposer le calcul

6. SubjectResource.php
   → id, name, code, coefficient, color, category{value,label,color nullable},
     is_active, created_at
   → avec pivot si chargé depuis ClassSubject :
     whenPivotLoaded('class_subjects', fn() => [
       'coefficient_override' => $this->pivot->coefficient_override,
       'effective_coefficient' => $this->pivot->effective_coefficient,
       'hours_per_week' => $this->pivot->hours_per_week,
       'is_active' => $this->pivot->is_active,
     ])

7. RoomResource.php
   → id, name, code, type{value,label,icon}, capacity,
     floor, building, equipment, is_active

## GÉNÈRE LES FORM REQUESTS

StoreClasseRequest / UpdateClasseRequest :
  Règles de validation importantes :
  - academic_year_id : required, exists
  - school_level_id  : required, exists in school_levels where is_active=true
  - section          : required, string, max:5 (ex: "1", "A", "12")
                       regex: /^[1-9A-Za-z]{1,5}$/
  - serie            : nullable, string
                       Rule: doit être un case valide de LyceeSerie si fourni
                       Validation conditionnelle :
                         * Si level->requires_serie = true → serie OBLIGATOIRE
                         * Si level->requires_serie = false → serie DOIT être null
  - capacity         : integer, min:1, max:200
  - UNIQUE check     : (academic_year_id, school_level_id, serie, section)
                       ignorer l'id courant sur Update

  Messages d'erreur en français :
  - "La section est obligatoire (ex: 1, 2, A, B)"
  - "La série est obligatoire pour ce niveau (1ère ou Terminale)"
  - "Ce niveau ne doit pas avoir de série"
  - "Cette combinaison niveau/série/section existe déjà"

StoreBulkClassesRequest :
  - academic_year_id : required
  - school_level_id  : required
  - sections[]       : required, array, min:1
    → chaque section : string, regex valide
  - serie            : nullable (obligatoire si level->requires_serie, même logique)
  - capacity         : integer

## GÉNÈRE LES CONTROLLERS

1. SchoolSettingController
   - index()  → GET /settings (groupé par group)
   - update() → PUT /settings/{key}
   - bulkUpdate() → PUT /settings

2. AcademicYearController (resourceful)
   - index, store, show, update, destroy
   - activate()   → POST /academic-years/{id}/activate
   - close()      → POST /academic-years/{id}/close
   - periods()    → GET /academic-years/{id}/periods

3. SchoolLevelController
   - index()  → GET /school-levels
     params : category (filtre par maternelle/primaire/college/lycee)
     → filtre automatiquement via scopeForTenant()
   - toggle() → POST /school-levels/{id}/toggle
     → school_admin seulement

4. ClasseController
   - index()      → GET /classes (filtres: year, level, category, search)
   - store()      → POST /classes
   - bulkStore()  → POST /classes/bulk
     → valide et crée plusieurs classes en une seule requête
     → retourne la liste des classes créées avec leurs display_name
   - show()       → GET /classes/{id}
   - update()     → PUT /classes/{id}
   - destroy()    → DELETE /classes/{id} (soft delete)
   - subjects()   → GET /classes/{id}/subjects
   - syncSubjects()→ PUT /classes/{id}/subjects
   - options()    → GET /classes/options
     → retourne sections disponibles + series disponibles
     → utile pour alimenter les selects du frontend

5. SubjectController (resourceful standard)
   - index, store, show, update, destroy

6. RoomController (resourceful standard)
   - index, store, show, update, destroy

## ROUTES (routes/tenant.php)

Groupe middleware : auth:sanctum + EnsureTenantIsActive + CheckModuleAccess

Route::prefix('school')->group(function () {
  // Settings
  Route::get('settings', [...]);
  Route::put('settings', [...]);  // bulk
  Route::put('settings/{key}', [...]);

  // Academic Years
  Route::apiResource('academic-years', AcademicYearController::class);
  Route::post('academic-years/{year}/activate', [...]);
  Route::post('academic-years/{year}/close', [...]);
  Route::get('academic-years/{year}/periods', [...]);

  // School Levels
  Route::get('school-levels', [SchoolLevelController::class, 'index']);
  Route::post('school-levels/{level}/toggle', [SchoolLevelController::class, 'toggle'])
       ->middleware('role:school_admin');

  // Classes
  Route::get('classes/options', [ClasseController::class, 'options']);
  Route::post('classes/bulk', [ClasseController::class, 'bulkStore']);
  Route::apiResource('classes', ClasseController::class);
  Route::get('classes/{classe}/subjects', [ClasseController::class, 'subjects']);
  Route::put('classes/{classe}/subjects', [ClasseController::class, 'syncSubjects']);

  // Subjects & Rooms
  Route::apiResource('subjects', SubjectController::class);
  Route::apiResource('rooms', RoomController::class);
});

## ENDPOINT IMPORTANT : GET /classes/options

Réponse attendue :
{
  "sections": ["1","2","3","4","5","6","7","8","9","10","A","B","C","D","E","F"],
  "series": [
    {"value":"A","label":"Série A"},
    {"value":"B","label":"Série B"},
    {"value":"C","label":"Série C"},
    {"value":"D","label":"Série D"},
    {"value":"F1","label":"Série F1"},
    {"value":"F2","label":"Série F2"},
    {"value":"G1","label":"Série G1"},
    {"value":"G2","label":"Série G2"},
    {"value":"G3","label":"Série G3"}
  ]
}

Tests Hoppscotch après génération :
  POST /api/school/classes {"academic_year_id":1,"school_level_id":10,"section":"1"} → "6ème 1"
  POST /api/school/classes {"academic_year_id":1,"school_level_id":10,"section":"2"} → "6ème 2"
  POST /api/school/classes {"academic_year_id":1,"school_level_id":8,"section":"A"}  → "CM1 A"
  POST /api/school/classes {"academic_year_id":1,"school_level_id":1,"section":"B"}  → "PS B"
  POST /api/school/classes {"academic_year_id":1,"school_level_id":15,"serie":"A","section":"1"} → "1ère A1"
  POST /api/school/classes {"academic_year_id":1,"school_level_id":16,"serie":"C","section":"2"} → "Tle C2"
  POST /api/school/classes {"academic_year_id":1,"school_level_id":14,"section":"1"} → "2nde 1" (pas de série)
  POST /api/school/classes {"academic_year_id":1,"school_level_id":15} → ERREUR "serie obligatoire"
  POST /api/school/classes/bulk → créer 6ème 1, 6ème 2, 6ème 3 en une requête
```

---

## SESSION 2.4 — Frontend : Types + API + Hooks + Store

```
## CONTEXTE PROJET — ENMA SCHOOL

Stack : React 18 + TypeScript 5 + Vite, Tailwind + shadcn/ui
State : TanStack Query v5, Zustand v4, React Hook Form + Zod
HTTP : Axios (instance configurée dans shared/lib/axios.ts)

Phase 2 Sessions 1-3 terminées (backend complet et testé)

## RAPPEL CRITIQUE : SECTION vs SÉRIE (pour les types TypeScript)

interface Classe {
  // section : TOUJOURS présent pour toutes les classes
  // serie   : null sauf pour 1ère et Terminale
  serie: string | null;   // 'A'|'B'|'C'|'D'|'F1'|'F2'|'G1'|'G2'|'G3' | null
  section: string;        // '1'|'2'|'A'|'B'|... — JAMAIS null
  display_name: string;   // calculé backend : "6ème 1", "CM1 A", "Tle C2"
}

## GÉNÈRE LES FICHIERS SUIVANTS

### src/modules/school/types/school.types.ts

Interfaces TypeScript :

export type LevelCategory = 'maternelle' | 'primaire' | 'college' | 'lycee';
export type AcademicYearStatus = 'draft' | 'active' | 'closed';
export type PeriodType = 'trimestre' | 'semestre';
export type LyceeSerie = 'A'|'B'|'C'|'D'|'F1'|'F2'|'G1'|'G2'|'G3';
export type RoomType = 'classroom'|'lab'|'gym'|'library'|'amphitheater'|'other';

export interface SchoolLevel {
  id: number;
  code: string;
  category: LevelCategory;
  label: string;           // "Sixième", "CM1", "Petite Section"
  short_label: string;     // "6ème", "CM1", "PS"
  order: number;
  requires_serie: boolean; // true SEULEMENT pour 1ère et Terminale
  is_active: boolean;
}

export interface Classe {
  id: number;
  academic_year_id: number;
  display_name: string;    // ex: "6ème 1", "CM1 A", "Tle C2"
  serie: LyceeSerie | null;// null sauf 1ère/Terminale
  section: string;         // toujours présent : "1", "A", "2", etc.
  capacity: number;
  is_active: boolean;
  level?: SchoolLevel;
  main_teacher?: { id: number; full_name: string } | null;
  room?: { id: number; name: string; code: string | null } | null;
  subjects_count?: number;
  students_count?: number;
}

export interface ClasseFormData {
  academic_year_id: number;
  school_level_id: number;
  serie: LyceeSerie | null;  // null si level.requires_serie = false
  section: string;            // OBLIGATOIRE
  capacity: number;
  main_teacher_id?: number | null;
  room_id?: number | null;
}

export interface BulkClasseFormData {
  academic_year_id: number;
  school_level_id: number;
  serie: LyceeSerie | null;
  sections: string[];  // ex: ["1","2","3"] ou ["A","B","C"]
  capacity: number;
}

export interface ClasseOptions {
  sections: string[];   // ["1","2",...,"10","A","B","C","D","E","F"]
  series: { value: LyceeSerie; label: string }[];
}

// ... (AcademicYear, Period, Subject, Room, SchoolSetting interfaces)

### src/modules/school/api/classes.api.ts

import { apiClient } from '@/shared/lib/axios';
import type { Classe, ClasseFormData, BulkClasseFormData, ClasseOptions } from '../types';

export const classesApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<PaginatedResponse<Classe>>('/school/classes', { params }),

  getOne: (id: number) =>
    apiClient.get<ApiSuccess<Classe>>(`/school/classes/${id}`),

  getOptions: () =>
    apiClient.get<ApiSuccess<ClasseOptions>>('/school/classes/options'),

  create: (data: ClasseFormData) =>
    apiClient.post<ApiSuccess<Classe>>('/school/classes', data),

  bulkCreate: (data: BulkClasseFormData) =>
    apiClient.post<ApiSuccess<Classe[]>>('/school/classes/bulk', data),

  update: (id: number, data: Partial<ClasseFormData>) =>
    apiClient.put<ApiSuccess<Classe>>(`/school/classes/${id}`, data),

  delete: (id: number) =>
    apiClient.delete(`/school/classes/${id}`),

  getSubjects: (id: number) =>
    apiClient.get(`/school/classes/${id}/subjects`),

  syncSubjects: (id: number, subjectIds: number[]) =>
    apiClient.put(`/school/classes/${id}/subjects`, { subject_ids: subjectIds }),
};

### src/modules/school/hooks/useClasses.ts

Hooks TanStack Query :
- useClasses(filters)     → useQuery, key: ['classes', filters]
- useClasse(id)           → useQuery
- useClasseOptions()      → useQuery, key: ['classe-options'], staleTime: Infinity
- useCreateClasse()       → useMutation + invalidate ['classes']
- useBulkCreateClasses()  → useMutation + invalidate ['classes']
- useUpdateClasse()       → useMutation + invalidate ['classes', id]
- useDeleteClasse()       → useMutation + invalidate ['classes']

Même pattern pour : useSchoolLevels, useAcademicYears, usePeriods, useSubjects, useRooms

### src/modules/school/store/schoolStore.ts (Zustand)

interface SchoolStore {
  currentYearId: number | null;
  setCurrentYearId: (id: number | null) => void;
  selectedLevelCategory: LevelCategory | null;
  setSelectedLevelCategory: (cat: LevelCategory | null) => void;
}

→ persisté dans localStorage (clé: 'school-store')

### src/modules/school/lib/classeHelpers.ts

Utilitaires TypeScript pour le frontend :

// Générer le display_name en preview (avant sauvegarde)
export function previewDisplayName(
  level: SchoolLevel,
  section: string,
  serie?: LyceeSerie | null
): string {
  if (level.requires_serie && serie) {
    return `${level.short_label} ${serie}${section}`;
    // ex: "1ère A2", "Tle C1"
  }
  return `${level.label} ${section}`;
  // ex: "6ème 1", "CM1 A", "PS B"
}

// Vérifie si un level nécessite une série
export function levelRequiresSerie(level: SchoolLevel): boolean {
  return level.requires_serie;
}

// Labels des catégories
export function getLevelCategoryLabel(category: LevelCategory): string {
  const labels: Record<LevelCategory, string> = {
    maternelle: 'Maternelle',
    primaire: 'Primaire',
    college: 'Collège',
    lycee: 'Lycée',
  };
  return labels[category];
}

// Icônes des catégories (lucide-react)
export function getLevelCategoryIcon(category: LevelCategory): string {
  const icons: Record<LevelCategory, string> = {
    maternelle: 'Baby',
    primaire: 'BookOpen',
    college: 'GraduationCap',
    lycee: 'School',
  };
  return icons[category];
}
```

---

## SESSION 2.5 — Frontend Pages (SchoolLevelsPage + ClassesPage)

```
## CONTEXTE PROJET — ENMA SCHOOL

Stack : React 18 + TypeScript 5, Tailwind + shadcn/ui, TanStack Query v5
Types, API, Hooks : tous créés en Session 2.4 ✅

## RAPPEL CRITIQUE UI : SECTION vs SÉRIE

Dans le formulaire de création de classe :

1. L'utilisateur choisit d'abord le NIVEAU (SchoolLevel)
2. Le niveau a `requires_serie` (bool)

Si requires_serie = FALSE (maternelle, primaire, collège, 2nde) :
  → Afficher UNIQUEMENT un select "Section"
  → Options section : 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, A, B, C, D, E, F
  → Preview : "CM1 A", "6ème 1", "PS B"

Si requires_serie = TRUE (1ère et Terminale SEULEMENT) :
  → Afficher SELECT "Série" (A, B, C, D, F1, F2, G1, G2, G3) — OBLIGATOIRE
  → Afficher SELECT "Section" — OBLIGATOIRE
  → Preview : "1ère A1", "Tle C2"

La preview du display_name doit se mettre à jour en TEMPS RÉEL
en utilisant la fonction previewDisplayName() de classeHelpers.ts

## GÉNÈRE LES PAGES

### 1. SchoolLevelsPage.tsx

Affichage des niveaux scolaires disponibles pour cette école.
- Filtrés automatiquement selon les flags has_* du tenant
- Groupés par catégorie (Maternelle / Primaire / Collège / Lycée)
- Chaque niveau affiché en card/badge avec :
  * label, short_label, code
  * Badge "Avec série" si requires_serie=true (pour 1ère et Terminale)
  * Toggle actif/inactif (school_admin seulement)
  * Nombre de classes actives (whenCounted)
- Pas de création/suppression (pré-rempli par seeder)
- Composant : LevelCategoryBadge (couleur par catégorie)

### 2. ClassesPage.tsx

Page principale de gestion des classes.

FILTRES :
- Sélecteur d'année scolaire (academic_year_id)
- Filtre par catégorie : Tous | Maternelle | Primaire | Collège | Lycée
- Filtre par niveau (school_level_id)
- Toggle : Actif uniquement

LISTE DES CLASSES (vue grille ou tableau) :
- Chaque ClasseCard affiche :
  * display_name (grand, centré) — ex: "6ème 1", "CM1 A", "Tle C2"
  * level.short_label + badge catégorie
  * Si serie non null : afficher badge série
  * Section : afficher clairement "Section: 1" ou "Section: A"
  * Professeur principal (si assigné)
  * Salle (si assignée)
  * Nombre d'élèves / capacité
  * Actions : Voir | Modifier | Supprimer

BOUTONS D'ACTION :
  [+ Nouvelle classe]   → ouvre ClasseFormModal
  [+ Créer en masse]    → ouvre BulkClasseModal

### 3. ClasseFormModal.tsx

Modal de création/modification d'une classe.

FORMULAIRE (React Hook Form + Zod) :

Schéma Zod :
  const classeSchema = z.object({
    academic_year_id: z.number(),
    school_level_id: z.number(),
    serie: z.string().nullable(),
    section: z.string().min(1, "La section est obligatoire"),
    capacity: z.number().min(1).max(200),
    main_teacher_id: z.number().nullable().optional(),
    room_id: z.number().nullable().optional(),
  }).refine((data) => {
    const level = levels.find(l => l.id === data.school_level_id);
    if (level?.requires_serie && !data.serie) {
      return false; // série obligatoire
    }
    return true;
  }, { message: "La série est obligatoire pour ce niveau", path: ['serie'] });

CHAMPS DU FORMULAIRE :
1. Select "Année scolaire" — academic_year_id
2. Select "Niveau" — school_level_id
   → onChange : reset serie si level.requires_serie change
3. [Conditionnel] Select "Série" — visible SI level?.requires_serie = true
   Options : A, B, C, D, F1, F2, G1, G2, G3
4. Select "Section" — TOUJOURS visible
   Options : 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, A, B, C, D, E, F
5. Input "Capacité" — number
6. [Optionnel] Select "Professeur principal" — main_teacher_id
7. [Optionnel] Select "Salle" — room_id

PREVIEW EN TEMPS RÉEL (OBLIGATOIRE) :
  <ClasseDisplayNamePreview
    level={selectedLevel}
    serie={watchedSerie}
    section={watchedSection}
  />
  → Affiche en grand : "Tle C2" ou "6ème 1" etc.
  → Mise à jour instantanée via watch() de React Hook Form
  → Utilise previewDisplayName() de classeHelpers.ts

### 4. BulkClasseModal.tsx

Modal de création en masse de plusieurs classes d'un même niveau.

But : Créer d'un coup "6ème 1", "6ème 2", "6ème 3" en sélectionnant [1,2,3]

FORMULAIRE :
1. Select "Année scolaire"
2. Select "Niveau" (school_level_id)
3. [Conditionnel] Select "Série" (si level.requires_serie)
   NB : en mode bulk avec requires_serie, on crée plusieurs sections pour UNE série
   ex: Tle C1, Tle C2, Tle C3 — ou faire plusieurs bulk par série
4. Multi-select "Sections à créer"
   → Cases à cocher : 1, 2, 3, 4, 5, 6, A, B, C, D
   → Sélection rapide : [1-5] [1-10] [A-E]
5. Input "Capacité" (appliquée à toutes)

PREVIEW EN TEMPS RÉEL :
  Liste des classes qui seront créées :
  ✓ 6ème 1
  ✓ 6ème 2
  ✓ 6ème 3
  → Utilise previewDisplayName() pour chaque section sélectionnée

### 5. ClasseDetailPage.tsx

Page détail d'une classe avec onglets :
- Onglet "Informations" : infos générales + prof principal + salle
- Onglet "Matières" : liste des matières assignées + coefficients
- Onglet "Élèves" : placeholder "Disponible en Phase 4"
- Onglet "Emploi du temps" : placeholder "Disponible en Phase 8"

### COMPOSANTS À CRÉER

1. ClasseDisplayNamePreview.tsx
   Props: { level?: SchoolLevel; serie?: string | null; section?: string }
   → Preview stylisée du display_name (grande police, badge coloré)
   → Affiche "—" si données incomplètes

2. LevelCategoryBadge.tsx
   Props: { category: LevelCategory }
   → Badge coloré : Maternelle (rose), Primaire (bleu), Collège (vert), Lycée (violet)

3. SerieSelect.tsx
   Props: { value: LyceeSerie | null; onChange: fn; disabled?: boolean }
   → Select des séries académiques : A, B, C, D, F1, F2, G1, G2, G3
   → Affiché UNIQUEMENT si le niveau requires_serie = true

4. SectionSelect.tsx
   Props: { value: string; onChange: fn; options?: string[] }
   → Select de la section : 1,2,3,...,10,A,B,C,...
   → Toujours visible dans le formulaire

5. SectionMultiPicker.tsx
   Props: { selected: string[]; onChange: fn }
   → Sélecteur multi-section pour le bulk create
   → Boutons toggle visuels pour chaque section disponible

## VALIDATION UX IMPORTANTE

- Si l'utilisateur change de niveau et que le nouveau niveau n'a pas
  requires_serie, effacer automatiquement la valeur de serie
- Si requires_serie passe à true, forcer la sélection d'une série
- Le display_name preview doit toujours être visible pendant la saisie
- Toasts de confirmation après création : "6ème 1 créée avec succès"
```

---

## SESSION 2.6 — Pages Secondaires + SchoolSettingsPage

```
## CONTEXTE PROJET — ENMA SCHOOL

Phase 2 Sessions 1-5 terminées :
- Backend complet ✅
- ClassesPage + SchoolLevelsPage ✅

## GÉNÈRE LES PAGES RESTANTES DE LA PHASE 2

### 1. SchoolSettingsPage.tsx

Page de configuration de l'école — 5 onglets :

Onglet 1 : Général
  - Nom de l'école, adresse, téléphone, email, site web
  - Logo (upload)
  - Ville, pays, timezone, langue, devise

Onglet 2 : Académique
  - Nom par défaut des périodes
  - Règles de passage
  - Moyenne de passage (défaut: 10/20)

Onglet 3 : Notes & Évaluations
  - Barème de notation (sur 20, sur 100...)
  - Arrondi des moyennes

Onglet 4 : Présences
  - Heure début journée, heure fin
  - Durée d'un cours (minutes)

Onglet 5 : Notifications
  - Activer/désactiver les alertes email
  - Destinataires des notifications

### 2. AcademicYearsPage.tsx

- Liste des années scolaires
- Création avec wizard :
  * Étape 1 : Nom (ex: "2024-2025"), dates début/fin
  * Étape 2 : Type de période (Trimestre/Semestre)
  * Étape 3 : Nommer les périodes générées auto
  * Étape 4 : Réglages (moyenne de passage, promotion)
- Actions : Activer, Clôturer, Supprimer (si draft)
- PeriodTimeline : visualisation des périodes sur une ligne de temps
- Une seule année peut être "active" et "current" à la fois

### 3. SubjectsPage.tsx

- Tableau des matières avec colonnes :
  code | nom | coefficient | catégorie | couleur | statut
- SubjectColorPicker : sélecteur de couleur hex
- Import CSV (futur) → placeholder
- Gestion simple CRUD

### 4. RoomsPage.tsx

- Grille des salles par type
- Badges équipements (projecteur, climatisation, etc.)
- RoomEquipmentIcons : icônes pour chaque équipement
- Filtre par type de salle

## NAVIGATION

Ajouter dans navigation.ts les routes Phase 2 :
  /school/settings        → SchoolSettingsPage
  /school/academic-years  → AcademicYearsPage
  /school/levels          → SchoolLevelsPage
  /school/classes         → ClassesPage
  /school/classes/:id     → ClasseDetailPage
  /school/subjects        → SubjectsPage
  /school/rooms           → RoomsPage

Icônes (lucide-react) :
  Settings, CalendarDays, Layers, Users, BookOpen, DoorOpen
```

---

## RÉCAPITULATIF DES CORRECTIONS APPORTÉES

### ✅ Correction principale : Level + Série + Section

| Avant (incorrect) | Après (correct) |
|---|---|
| "section" utilisé pour désigner la série lycée | `serie` = série académique (A,B,C...) UNIQUEMENT 1ère/Terminale |
| Confusion entre numéro de classe et série | `section` = numéro/lettre TOUJOURS obligatoire pour toutes classes |
| Pas de distinction claire dans les formulaires | SerieSelect conditionnel + SectionSelect toujours visible |
| Preview display_name pas toujours correcte | previewDisplayName() gère les deux cas proprement |

### Exemples display_name valides

| Niveau | Série | Section | display_name |
|--------|-------|---------|--------------|
| PS | null | A | PS A |
| MS | null | B | MS B |
| GS | null | 1 | GS 1 |
| CP1 | null | A | CP1 A |
| CM2 | null | 2 | CM2 2 |
| 6ème | null | 1 | 6ème 1 |
| 6ème | null | 2 | 6ème 2 |
| 3ème | null | A | 3ème A |
| 2nde | null | 1 | 2nde 1 |
| 1ère | A | 1 | 1ère A1 |
| 1ère | B | 2 | 1ère B2 |
| Tle | C | 1 | Tle C1 |
| Tle | D | 3 | Tle D3 |
| Tle | F1 | 2 | Tle F12 |
