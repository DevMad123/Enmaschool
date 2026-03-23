# ENMA SCHOOL — PROMPTS PHASE 4
## Gestion des Élèves

---

> ## PÉRIMÈTRE DE LA PHASE 4
>
> **Objectif :** Gérer le dossier complet des élèves, leurs inscriptions aux classes
> et les informations de leurs parents/tuteurs.
>
> **Tables nouvelles :**
> | Table | Description |
> |-------|-------------|
> | `students` | Dossier permanent de l'élève (toutes années) |
> | `parents` | Fiche parent/tuteur |
> | `student_parents` | Pivot élève ↔ parent (relation, contact principal) |
> | `enrollments` | Inscription d'un élève dans une classe pour une année scolaire |
>
> **Concepts clés :**
> - Un **student** existe indépendamment des années scolaires (dossier permanent)
> - Une **enrollment** rattache un élève à une classe pour une année précise
> - Un élève peut avoir **1 ou 2 parents/tuteurs**
> - Le **matricule** est l'identifiant unique officiel de l'élève
> - L'import CSV/Excel permet la création en masse (début d'année)
>
> **HORS PÉRIMÈTRE Phase 4 :**
> - Notes, bulletins → Phase 6 & 7
> - Présences → Phase 9
> - Frais scolaires → Phase 10
> - Compte de connexion student/parent (V2)
>
> **Dépendances requises :**
> - Phase 2 ✅ (classes, levels, academic_years)
> - Phase 3 ✅ (users, permissions)

---

## SESSION 4.1 — Migrations

```
## CONTEXTE PROJET — ENMA SCHOOL

Stack : PHP 8.3 / Laravel 12 / PostgreSQL 18
Multi-tenant : stancl/tenancy v3 (schema-per-tenant)

Phases terminées :
- Phase 0 : Auth, Users, Middlewares
- Phase 1 : Interface SuperAdmin
- Phase 2 : Config École (academic_years, classes, levels, subjects, rooms)
- Phase 3 : Rôles & Utilisateurs (users, permissions, invitations)

## CETTE SESSION — Phase 4 : Migrations

Créer toutes les migrations du schema tenant pour la Phase 4.
Toutes les migrations vont dans database/migrations/tenant/

## GÉNÈRE LES MIGRATIONS (dans l'ordre)

### 1. create_students_table

Objectif : dossier permanent de l'élève, indépendant des années scolaires.

Colonnes :
  -- Identité officielle
  id
  matricule          (string, unique) — identifiant officiel généré automatiquement
                     format : {YEAR}{CATEGORY_CODE}{SEQUENCE_5DIGITS}
                     ex : "2024PRI00042", "2024COL00017", "2024MAT00003"
  first_name         (string, max:100)
  last_name          (string, max:100)
  birth_date         (date)
  birth_place        (string, nullable)
  gender             (enum: male/female)
  nationality        (string, default:'Ivoirienne')
  birth_certificate_number (string, nullable) — numéro acte de naissance
  photo              (string, nullable) — chemin vers la photo

  -- Adresse & Contact
  address            (text, nullable)
  city               (string, nullable)
  blood_type         (enum: A+/A-/B+/B-/AB+/AB-/O+/O-, nullable)

  -- Informations scolaires
  first_enrollment_year (unsignedSmallInteger, nullable) — année de première inscription
  previous_school    (string, nullable) — école précédente
  notes              (text, nullable) — notes internes (admin seulement)

  -- Statut
  status             (enum: active/inactive/transferred/graduated/expelled)

  -- Méta
  created_by         (foreignId → users, nullOnDelete, nullable)
  softDeletes(), timestamps

  Index : matricule (unique), last_name + first_name, birth_date, status

### 2. create_parents_table

Objectif : fiche parent ou tuteur légal d'un élève.

Colonnes :
  id
  first_name         (string, max:100)
  last_name          (string, max:100)
  gender             (enum: male/female)
  relationship       (enum: father/mother/guardian/other)
  phone              (string, nullable, max:20)
  phone_secondary    (string, nullable, max:20)
  email              (string, nullable)
  profession         (string, nullable)
  address            (text, nullable)
  national_id        (string, nullable) — CNI ou passeport
  is_emergency_contact (boolean, default:true)
  notes              (text, nullable)
  softDeletes(), timestamps

  Index : last_name + first_name, phone, email

### 3. create_student_parents_table

Objectif : table pivot reliant un élève à ses parents/tuteurs.

Colonnes :
  id
  student_id         (foreignId → students, cascadeOnDelete)
  parent_id          (foreignId → parents, cascadeOnDelete)
  is_primary_contact (boolean, default:false) — contact principal
  can_pickup         (boolean, default:true) — autorisé à récupérer l'enfant
  timestamps

  UNIQUE(student_id, parent_id)
  Index : student_id, parent_id

### 4. create_enrollments_table

Objectif : inscription d'un élève dans une classe pour une année scolaire.
           C'est le lien entre l'élève et l'année scolaire.

Colonnes :
  id
  student_id         (foreignId → students, cascadeOnDelete)
  classe_id          (foreignId → classes, cascadeOnDelete)
  academic_year_id   (foreignId → academic_years, cascadeOnDelete)
  enrollment_date    (date) — date d'inscription
  enrollment_number  (string, nullable) — numéro d'inscription officiel
  is_active          (boolean, default:true)
  status             (enum: enrolled/transferred_in/transferred_out/withdrawn/completed)
  transfer_note      (text, nullable) — motif de transfert ou retrait
  transferred_from   (foreignId → classes, nullable, nullOnDelete) — si transfert
  created_by         (foreignId → users, nullOnDelete, nullable)
  timestamps

  UNIQUE(student_id, academic_year_id) — un élève = une seule classe par année
  Index : student_id, classe_id, academic_year_id, status

  NB : Pas de soft_deletes — une inscription est un document officiel.
       En cas d'erreur → status = withdrawn + transfer_note.

## RÈGLES MÉTIER IMPORTANTES (commentaires dans les migrations)

1. Un élève ne peut être inscrit que dans UNE seule classe par année scolaire
   → Garanti par UNIQUE(student_id, academic_year_id)

2. La capacité de la classe ne peut pas être dépassée
   → Validé dans le Service, pas en DB

3. Un élève peut avoir 0, 1 ou 2 parents enregistrés
   → Pas de contrainte DB, validé en application

4. Le matricule est généré automatiquement à la création
   → Géré dans Model::boot() → creating

## COMMANDES DE TEST

php artisan migrate --path=database/migrations/tenant
php artisan tinker
  >>> Schema::hasTable('students')
  >>> Schema::hasTable('enrollments')
  >>> Schema::getColumnListing('students')
```

---

## SESSION 4.2 — Enums + Models + Services

```
## CONTEXTE PROJET — ENMA SCHOOL

Stack : PHP 8.3 / Laravel 12, strict_types=1, Enums PHP 8.1
Conventions : logique dans les Services, Models pour relations et accessors

Phase 4 Session 1 terminée :
- Migrations : students, parents, student_parents, enrollments ✅

## GÉNÈRE LES ENUMS

### app/Enums/StudentStatus.php
cases : Active, Inactive, Transferred, Graduated, Expelled
méthode : label() → "Actif", "Inactif", "Transféré", "Diplômé", "Exclu"
méthode : color() → couleur badge tailwind
  Active → 'green', Inactive → 'gray',
  Transferred → 'blue', Graduated → 'purple', Expelled → 'red'

### app/Enums/Gender.php
cases : Male, Female
méthode : label() → "Masculin", "Féminin"
méthode : short() → "M", "F"

### app/Enums/ParentRelationship.php
cases : Father, Mother, Guardian, Other
méthode : label() → "Père", "Mère", "Tuteur/Tutrice", "Autre"
méthode : icon() → nom icône lucide-react

### app/Enums/BloodType.php
cases : APos, ANeg, BPos, BNeg, ABPos, ABNeg, OPos, ONeg
value : 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
méthode : label() → même que value

### app/Enums/EnrollmentStatus.php
cases : Enrolled, TransferredIn, TransferredOut, Withdrawn, Completed
méthode : label() → "Inscrit", "Transféré (arrivée)", "Transféré (départ)", "Retiré", "Terminé"
méthode : color()
méthode : isActive() : bool → true seulement pour Enrolled et TransferredIn

## GÉNÈRE LES MODELS

### Student.php

$fillable : matricule, first_name, last_name, birth_date, birth_place,
            gender, nationality, birth_certificate_number, photo,
            address, city, blood_type, first_enrollment_year,
            previous_school, notes, status, created_by

Casts :
  birth_date → 'date'
  gender → Gender::class
  blood_type → BloodType::class (nullable)
  status → StudentStatus::class

Relations :
  parents()       → belongsToMany Parent via student_parents
                    withPivot: is_primary_contact, can_pickup
  primaryParent() → belongsToMany + wherePivot('is_primary_contact', true) → first()
  enrollments()   → hasMany Enrollment
  currentEnrollment() → hasOne Enrollment (filtre sur academic_year courant)
  currentClasse() → through currentEnrollment → Classe
  createdBy()     → belongsTo User

Accessors :
  getFullNameAttribute() : string → "{last_name} {first_name}"
  getAgeAttribute() : int → Carbon::parse(birth_date)->age
  getPhotoUrlAttribute() : string|null → URL complète ou null

Scopes :
  scopeActive($query)
  scopeByStatus($query, StudentStatus $status)
  scopeInClasse($query, int $classeId)
  scopeInYear($query, int $yearId)
  scopeSearch($query, string $term)
    → whereAny([first_name, last_name, matricule], 'ILIKE', "%{$term}%")

boot() → creating :
  → générer le matricule si absent : self::generateMatricule()

Méthode statique : generateMatricule(string $category) : string
  Format : {YEAR}{CAT_CODE}{SEQUENCE}
  ex : "2024PRI00042"
  CAT_CODE : MAT=maternelle, PRI=primaire, COL=collège, LYC=lycée
  SEQUENCE : dernier matricule de la catégorie + 1, sur 5 digits, avec padding
  NB : la catégorie est déduite du level de la classe lors de l'enrollment

softDeletes()

### Parent.php  ← NB: "ParentModel" si "Parent" est réservé, ou placer dans App\Models\StudentParent

$fillable : first_name, last_name, gender, relationship, phone,
            phone_secondary, email, profession, address,
            national_id, is_emergency_contact, notes

Casts :
  gender → Gender::class
  relationship → ParentRelationship::class
  is_emergency_contact → 'boolean'

Relations :
  students() → belongsToMany Student via student_parents
               withPivot: is_primary_contact, can_pickup

Accessor :
  getFullNameAttribute() : string

softDeletes()

### StudentParent.php (le pivot enrichi)

$table = 'student_parents'
$fillable : student_id, parent_id, is_primary_contact, can_pickup

Relations :
  student() → belongsTo Student
  parent()  → belongsTo ParentModel

### Enrollment.php

$fillable : student_id, classe_id, academic_year_id, enrollment_date,
            enrollment_number, is_active, status, transfer_note,
            transferred_from, created_by

Casts :
  enrollment_date → 'date'
  status → EnrollmentStatus::class
  is_active → 'boolean'

Relations :
  student()         → belongsTo Student
  classe()          → belongsTo Classe
  academicYear()    → belongsTo AcademicYear
  transferredFrom() → belongsTo Classe (FK: transferred_from, nullable)
  createdBy()       → belongsTo User

Scopes :
  scopeActive($query) → where('is_active', true)
  scopeForYear($query, int $yearId)
  scopeForClasse($query, int $classeId)

## GÉNÈRE LES SERVICES

### StudentService.php

list(array $filters) : LengthAwarePaginator
  filtres : search, status, classe_id, academic_year_id,
            level_category, gender, per_page (défaut: 25)
  → eager load : currentEnrollment.classe.level, primaryParent
  → tri par défaut : last_name ASC, first_name ASC

get(int $id) : Student
  → load : enrollments.classe.level, parents, createdBy

create(array $data) : Student
  → génère le matricule automatiquement
  → si parents fournis dans $data['parents'] → appeler syncParents()
  → dispatch event StudentCreated

update(Student $student, array $data) : Student
  → mise à jour données personnelles uniquement

updateStatus(Student $student, StudentStatus $newStatus) : Student

delete(Student $student) : void
  → soft delete seulement
  → vérifier qu'il n'a pas d'enrollments actifs → exception si oui

syncParents(Student $student, array $parentsData) : void
  → $parentsData = [
      ['parent_id' => X, 'is_primary_contact' => true, 'can_pickup' => true],
      ['parent_id' => Y, 'is_primary_contact' => false, 'can_pickup' => true],
    ]
  → sync() sur la relation parents avec pivot
  → valider : maximum 2 parents par élève
  → valider : un seul is_primary_contact = true parmi les parents

getStats(int $yearId) : array
  → total élèves inscrits cette année
  → répartition par genre (male/female)
  → répartition par catégorie (maternelle/primaire/collège/lycée)
  → répartition par niveau
  → nouveaux inscrits ce mois

importFromCsv(UploadedFile $file, int $yearId, int $classeId) : array
  → lit le fichier CSV/Excel (Maatwebsite/Excel)
  → retourne : { created: int, errors: [{row: int, message: string}] }
  → voir template de colonnes attendu ci-dessous
  → traiter via Job ImportStudentsJob (queue) pour les gros fichiers

exportToCsv(array $filters) : string
  → génère un fichier CSV des élèves filtrés
  → retourne le path du fichier temporaire

### EnrollmentService.php

enroll(array $data) : Enrollment
  → data : student_id, classe_id, academic_year_id, enrollment_date
  → vérifications :
    1. L'élève n'est pas déjà inscrit dans cette année → exception
    2. La classe n'est pas pleine (count enrollments < classe.capacity) → exception
    3. L'année scolaire est active ou en draft → exception si closed
  → génère enrollment_number : {YEAR}-{CLASSE_SHORT}-{SEQ}
    ex : "2024-6ème1-0042"
  → status = Enrolled

bulkEnroll(int $classeId, array $studentIds, int $yearId) : array
  → inscrit plusieurs élèves d'un coup dans une classe
  → retourne : { enrolled: int, skipped: int, errors: [...] }

transfer(Enrollment $enrollment, int $newClasseId, string $note = '') : Enrollment
  → ancien enrollment → status = TransferredOut, is_active = false
  → nouveau enrollment → status = TransferredIn, transferred_from = ancien classe_id
  → même academic_year_id

withdraw(Enrollment $enrollment, string $reason) : Enrollment
  → status = Withdrawn, is_active = false, transfer_note = reason

getByClasse(int $classeId, int $yearId) : Collection
  → élèves d'une classe pour une année, triés par nom
  → eager load : student.parents

promote(int $fromYearId, int $toYearId, array $options) : array
  → promotion automatique : crée les enrollments pour l'année suivante
  → selon promotion_type de l'AcademicYear (automatic/manual/by_average)
  → retourne stats de la promotion

### ParentService.php

create(array $data) : ParentModel
createOrFind(array $data) : ParentModel
  → cherche par phone ou email avant de créer (évite les doublons)
update(ParentModel $parent, array $data) : ParentModel
delete(ParentModel $parent) : void
  → vérifie qu'il n'a plus d'élèves actifs rattachés

## TEMPLATE D'IMPORT CSV

Colonnes attendues dans le fichier d'import :
  last_name*        → Nom de famille (obligatoire)
  first_name*       → Prénom (obligatoire)
  birth_date*       → Date de naissance (format: DD/MM/YYYY) (obligatoire)
  gender*           → M ou F (obligatoire)
  birth_place       → Lieu de naissance
  nationality       → Nationalité (défaut: Ivoirienne)
  birth_cert_number → Numéro acte de naissance
  address           → Adresse
  city              → Ville
  previous_school   → École précédente
  parent1_first_name → Prénom parent 1
  parent1_last_name  → Nom parent 1
  parent1_phone*     → Téléphone parent 1 (obligatoire si parent fourni)
  parent1_relation   → father/mother/guardian (défaut: mother)
  parent2_first_name → Prénom parent 2
  parent2_last_name  → Nom parent 2
  parent2_phone      → Téléphone parent 2
  parent2_relation   → father/mother/guardian

## COMMANDES DE TEST (tinker)

$service = app(App\Services\StudentService::class);
$student = $service->create([...]);
$student->matricule // → "2024COL00001"
$student->full_name // → "KOUASSI Jean"
$student->age       // → 12

$enrollService = app(App\Services\EnrollmentService::class);
$enrollService->enroll([
  'student_id' => 1,
  'classe_id' => 3,
  'academic_year_id' => 1,
  'enrollment_date' => today(),
]);
```

---

## SESSION 4.3 — Controllers + Resources + Routes

```
## CONTEXTE PROJET — ENMA SCHOOL

Stack : PHP 8.3 / Laravel 12
Conventions : strict_types=1, Trait ApiResponse, Form Requests, Resources

Phase 4 Sessions 1 & 2 terminées :
- Migrations OK, Enums OK, Models OK, Services OK

## GÉNÈRE LES API RESOURCES

### StudentResource.php
{
  id, matricule,
  last_name, first_name, full_name,
  birth_date (format: d/m/Y), birth_place, age,
  gender: { value, label },
  nationality,
  birth_certificate_number,
  photo_url,
  address, city,
  blood_type: { value, label } | null,
  first_enrollment_year,
  previous_school,
  status: { value, label, color },
  created_at,

  // Relations conditionnelles
  current_enrollment: when($this->relationLoaded('currentEnrollment'), [
    'id', 'enrollment_number', 'enrollment_date',
    'classe': ClasseResource (whenLoaded),
    'status': { value, label }
  ]),
  parents: ParentResource collection (whenLoaded),
  enrollments_count: whenCounted,

  // Permissions
  can: {
    edit: bool, delete: bool,
    enroll: bool, view_grades: bool,
  }
}

### StudentListResource.php (version légère pour les listes)
{
  id, matricule, full_name, photo_url,
  gender: { value, short },
  birth_date, age, status: { value, label, color },
  current_classe_name: (via enrollment si chargé),
}

### ParentResource.php
{
  id, first_name, last_name, full_name,
  gender: { value, label },
  relationship: { value, label, icon },
  phone, phone_secondary, email,
  profession, address, national_id,
  is_emergency_contact, notes,
  // Pivot si chargé depuis Student
  whenPivotLoaded('student_parents', fn() => [
    'is_primary_contact' => $this->pivot->is_primary_contact,
    'can_pickup' => $this->pivot->can_pickup,
  ]),
  students_count: whenCounted,
}

### EnrollmentResource.php
{
  id, enrollment_number, enrollment_date (d/m/Y),
  is_active, status: { value, label, color },
  transfer_note,
  student: StudentListResource (whenLoaded),
  classe: ClasseResource (whenLoaded),
  academic_year: { id, name } (whenLoaded),
  transferred_from: { id, display_name } | null (whenLoaded),
  created_at,
}

### StudentImportResultResource.php
{
  total_rows: int,
  created: int,
  skipped: int,
  errors: [{ row: int, field: string, message: string }]
}

## GÉNÈRE LES FORM REQUESTS

### StoreStudentRequest
  last_name*        : required, string, max:100
  first_name*       : required, string, max:100
  birth_date*       : required, date, before:today, after:50 ans ago
  gender*           : required, in: Gender cases
  birth_place       : nullable, string, max:150
  nationality       : nullable, string, max:100, default:'Ivoirienne'
  birth_certificate_number : nullable, string, max:50
  photo             : nullable, image, max:2048kb, dimensions min:100x100
  address           : nullable, string
  city              : nullable, string, max:100
  blood_type        : nullable, in: BloodType cases
  first_enrollment_year : nullable, integer, min:2000, max:year+1
  previous_school   : nullable, string, max:200
  notes             : nullable, string
  // Parents optionnels à la création
  parents           : nullable, array, max:2
  parents.*.parent_id     : required_without:parents.*.first_name, exists:parents,id
  parents.*.first_name    : required_without:parents.*.parent_id, string
  parents.*.last_name     : required_without:parents.*.parent_id, string
  parents.*.phone         : required_without:parents.*.parent_id, string
  parents.*.relationship  : required, in: ParentRelationship cases
  parents.*.is_primary_contact : boolean
  parents.*.can_pickup    : boolean

### UpdateStudentRequest (idem, tout nullable)

### EnrollStudentRequest
  student_id*       : required, exists:students,id
  classe_id*        : required, exists:classes,id
  academic_year_id* : required, exists:academic_years,id
  enrollment_date*  : required, date
  Messages :
    "Cet élève est déjà inscrit pour cette année scolaire"
    "La classe est complète (capacité maximale atteinte)"

### BulkEnrollRequest
  classe_id*        : required, exists:classes,id
  academic_year_id* : required, exists:academic_years,id
  student_ids*      : required, array, min:1
  student_ids.*     : exists:students,id
  enrollment_date*  : required, date

### TransferStudentRequest
  new_classe_id*    : required, exists:classes,id, different:current classe
  note              : nullable, string, max:500

### ImportStudentsRequest
  file*             : required, file, mimes:csv,xlsx,xls, max:10240
  classe_id*        : required, exists:classes,id
  academic_year_id* : required, exists:academic_years,id

## GÉNÈRE LES CONTROLLERS

### StudentController

index() → GET /school/students
  → paginate 25, filtres: search, status, classe_id, year_id, gender, level_category
  → eager load currentEnrollment.classe.level, primaryParent
  → retourne StudentListResource paginée

store() → POST /school/students
  → permission: students.create
  → crée le student + parents si fournis
  → retourne StudentResource

show() → GET /school/students/{student}
  → permission: students.view
  → load: enrollments.classe.level, parents
  → retourne StudentResource

update() → PUT /school/students/{student}
  → permission: students.edit
  → retourne StudentResource

destroy() → DELETE /school/students/{student}
  → permission: students.delete
  → soft delete (vérifie pas d'enrollment actif)

// Actions parents
parents() → GET /school/students/{student}/parents
syncParents() → PUT /school/students/{student}/parents
  → body: { parents: [{parent_id, is_primary_contact, can_pickup},...] }

// Stats
stats() → GET /school/students/stats?year_id=X
  → permission: students.view
  → retourne les stats globales (dashboard)

// Import/Export
import() → POST /school/students/import
  → permission: students.import
  → ImportStudentsRequest
  → dispatch ImportStudentsJob si > 50 lignes
  → sinon traitement synchrone
  → retourne StudentImportResultResource

exportTemplate() → GET /school/students/import/template
  → retourne le fichier CSV template à télécharger

export() → GET /school/students/export
  → permission: students.view
  → génère CSV avec les filtres actuels

### EnrollmentController

index() → GET /school/enrollments
  filtres: student_id, classe_id, academic_year_id, status
  → EnrollmentResource collection

store() → POST /school/enrollments
  → permission: students.create
  → EnrollStudentRequest

bulkStore() → POST /school/enrollments/bulk
  → permission: students.create
  → BulkEnrollRequest

show() → GET /school/enrollments/{enrollment}

transfer() → POST /school/enrollments/{enrollment}/transfer
  → permission: students.edit
  → TransferStudentRequest

withdraw() → POST /school/enrollments/{enrollment}/withdraw
  → permission: students.edit
  → body: { reason: string }

// Par classe
byClasse() → GET /school/classes/{classe}/students
  → liste des élèves d'une classe pour l'année courante
  → permission: students.view
  → utilisé dans ClasseDetailPage (Phase 2)

### ParentController

index() → GET /school/parents
  → liste tous les parents (pour le moteur de recherche)
  → filtres: search (nom, téléphone, email)
  → ParentResource paginée

store() → POST /school/parents
update() → PUT /school/parents/{parent}
show()  → GET /school/parents/{parent}
destroy() → DELETE /school/parents/{parent}

## ROUTES (routes/tenant.php — ajouter au groupe existant)

Route::middleware(['auth:sanctum', 'tenant.active'])->group(function () {
  Route::prefix('school')->group(function () {

    // ── Élèves ─────────────────────────────────────────
    Route::get('students/stats', [StudentController::class, 'stats'])
         ->middleware('can:students.view');
    Route::get('students/import/template', [StudentController::class, 'exportTemplate'])
         ->middleware('can:students.view');
    Route::post('students/import', [StudentController::class, 'import'])
         ->middleware('can:students.import');
    Route::get('students/export', [StudentController::class, 'export'])
         ->middleware('can:students.view');

    Route::apiResource('students', StudentController::class);
    Route::get('students/{student}/parents', [StudentController::class, 'parents'])
         ->middleware('can:students.view');
    Route::put('students/{student}/parents', [StudentController::class, 'syncParents'])
         ->middleware('can:students.edit');

    // ── Inscriptions ───────────────────────────────────
    Route::post('enrollments/bulk', [EnrollmentController::class, 'bulkStore'])
         ->middleware('can:students.create');
    Route::apiResource('enrollments', EnrollmentController::class)
         ->only(['index','store','show']);
    Route::post('enrollments/{enrollment}/transfer', [EnrollmentController::class, 'transfer'])
         ->middleware('can:students.edit');
    Route::post('enrollments/{enrollment}/withdraw', [EnrollmentController::class, 'withdraw'])
         ->middleware('can:students.edit');

    // ── Élèves par classe ──────────────────────────────
    Route::get('classes/{classe}/students', [EnrollmentController::class, 'byClasse'])
         ->middleware('can:students.view');

    // ── Parents ────────────────────────────────────────
    Route::apiResource('parents', ParentController::class);
  });
});

## TESTS HOPPSCOTCH

// Créer un élève avec parent
POST /api/school/students
{
  "last_name": "KOUASSI",
  "first_name": "Jean-Marc",
  "birth_date": "2010-05-15",
  "gender": "male",
  "birth_place": "Abidjan",
  "parents": [{
    "first_name": "Paul",
    "last_name": "KOUASSI",
    "phone": "0701234567",
    "relationship": "father",
    "is_primary_contact": true,
    "can_pickup": true
  }]
}
→ 201, student avec matricule auto "2024COL00001"

// Inscrire l'élève dans une classe
POST /api/school/enrollments
{
  "student_id": 1,
  "classe_id": 5,
  "academic_year_id": 1,
  "enrollment_date": "2024-09-15"
}
→ 201, enrollment_number "2024-6ème1-0001"

// Inscrire plusieurs élèves
POST /api/school/enrollments/bulk
{ "classe_id": 5, "academic_year_id": 1,
  "student_ids": [1,2,3,4,5],
  "enrollment_date": "2024-09-15" }
→ { "enrolled": 5, "skipped": 0, "errors": [] }

// Liste des élèves d'une classe
GET /api/school/classes/5/students
→ collection paginée des élèves inscrits

// Transférer un élève
POST /api/school/enrollments/1/transfer
{ "new_classe_id": 6, "note": "Demande des parents" }
→ nouvel enrollment créé, ancien clôturé

// Stats
GET /api/school/students/stats?year_id=1
→ { total: 245, male: 128, female: 117,
    by_category: { primaire: 120, college: 125 },
    by_level: [{level: "6ème", count: 35}, ...] }
```

---

## SESSION 4.4 — Frontend : Types + API + Hooks

```
## CONTEXTE PROJET — ENMA SCHOOL

Stack : React 18 + TypeScript 5, TanStack Query v5, Zustand v4
HTTP : Axios configuré dans shared/lib/axios.ts

Phase 4 Sessions 1-3 terminées (backend complet et testé)

## GÉNÈRE LES FICHIERS SUIVANTS

### src/modules/school/types/students.types.ts

export type StudentStatus = 'active' | 'inactive' | 'transferred' | 'graduated' | 'expelled';
export type Gender = 'male' | 'female';
export type ParentRelationship = 'father' | 'mother' | 'guardian' | 'other';
export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
export type EnrollmentStatus = 'enrolled' | 'transferred_in' | 'transferred_out' | 'withdrawn' | 'completed';

// Constantes UI
export const GENDER_LABELS: Record<Gender, string> = {
  male: 'Masculin', female: 'Féminin',
};
export const STUDENT_STATUS_COLORS: Record<StudentStatus, string> = {
  active: 'green', inactive: 'gray',
  transferred: 'blue', graduated: 'purple', expelled: 'red',
};
export const PARENT_RELATIONSHIP_LABELS: Record<ParentRelationship, string> = {
  father: 'Père', mother: 'Mère', guardian: 'Tuteur/Tutrice', other: 'Autre',
};

export interface Student {
  id: number;
  matricule: string;
  first_name: string;
  last_name: string;
  full_name: string;
  birth_date: string;    // "15/05/2010"
  birth_place: string | null;
  age: number;
  gender: { value: Gender; label: string };
  nationality: string;
  birth_certificate_number: string | null;
  photo_url: string | null;
  address: string | null;
  city: string | null;
  blood_type: { value: BloodType; label: string } | null;
  first_enrollment_year: number | null;
  previous_school: string | null;
  status: { value: StudentStatus; label: string; color: string };
  current_enrollment?: CurrentEnrollment | null;
  parents?: ParentWithPivot[];
  enrollments_count?: number;
  can?: {
    edit: boolean;
    delete: boolean;
    enroll: boolean;
    view_grades: boolean;
  };
}

export interface StudentListItem {
  id: number;
  matricule: string;
  full_name: string;
  photo_url: string | null;
  gender: { value: Gender; short: string };
  birth_date: string;
  age: number;
  status: { value: StudentStatus; label: string; color: string };
  current_classe_name?: string;
}

export interface CurrentEnrollment {
  id: number;
  enrollment_number: string;
  enrollment_date: string;
  status: { value: EnrollmentStatus; label: string };
  classe?: import('./school.types').Classe;
}

export interface ParentContact {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  gender: { value: Gender; label: string };
  relationship: { value: ParentRelationship; label: string; icon: string };
  phone: string | null;
  phone_secondary: string | null;
  email: string | null;
  profession: string | null;
  is_emergency_contact: boolean;
}

export interface ParentWithPivot extends ParentContact {
  pivot: {
    is_primary_contact: boolean;
    can_pickup: boolean;
  };
}

export interface Enrollment {
  id: number;
  enrollment_number: string;
  enrollment_date: string;
  is_active: boolean;
  status: { value: EnrollmentStatus; label: string; color: string };
  transfer_note: string | null;
  student?: StudentListItem;
  classe?: import('./school.types').Classe;
  academic_year?: { id: number; name: string };
  transferred_from?: { id: number; display_name: string } | null;
  created_at: string;
}

export interface StudentFormData {
  last_name: string;
  first_name: string;
  birth_date: string;
  gender: Gender;
  birth_place?: string;
  nationality?: string;
  birth_certificate_number?: string;
  address?: string;
  city?: string;
  blood_type?: BloodType | null;
  first_enrollment_year?: number | null;
  previous_school?: string;
  notes?: string;
  parents?: ParentFormEntry[];
}

export interface ParentFormEntry {
  parent_id?: number;
  first_name?: string;
  last_name?: string;
  phone?: string;
  relationship: ParentRelationship;
  is_primary_contact: boolean;
  can_pickup: boolean;
}

export interface EnrollmentFormData {
  student_id: number;
  classe_id: number;
  academic_year_id: number;
  enrollment_date: string;
}

export interface BulkEnrollmentFormData {
  classe_id: number;
  academic_year_id: number;
  student_ids: number[];
  enrollment_date: string;
}

export interface StudentStats {
  total: number;
  male: number;
  female: number;
  by_category: Record<string, number>;
  by_level: Array<{ level: string; count: number }>;
  new_this_month: number;
}

export interface ImportResult {
  total_rows: number;
  created: number;
  skipped: number;
  errors: Array<{ row: number; field: string; message: string }>;
}

### src/modules/school/api/students.api.ts

import { apiClient } from '@/shared/lib/axios';

export const studentsApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<PaginatedResponse<StudentListItem>>('/school/students', { params }),
  getOne: (id: number) =>
    apiClient.get<ApiSuccess<Student>>(`/school/students/${id}`),
  getStats: (yearId: number) =>
    apiClient.get<ApiSuccess<StudentStats>>(`/school/students/stats`, { params: { year_id: yearId } }),
  create: (data: StudentFormData) =>
    apiClient.post<ApiSuccess<Student>>('/school/students', data),
  update: (id: number, data: Partial<StudentFormData>) =>
    apiClient.put<ApiSuccess<Student>>(`/school/students/${id}`, data),
  delete: (id: number) =>
    apiClient.delete(`/school/students/${id}`),
  getParents: (id: number) =>
    apiClient.get<ApiSuccess<ParentWithPivot[]>>(`/school/students/${id}/parents`),
  syncParents: (id: number, parents: ParentFormEntry[]) =>
    apiClient.put(`/school/students/${id}/parents`, { parents }),
  import: (formData: FormData) =>
    apiClient.post<ApiSuccess<ImportResult>>('/school/students/import', formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }),
  getImportTemplate: () =>
    apiClient.get('/school/students/import/template', { responseType: 'blob' }),
  export: (params?: Record<string, unknown>) =>
    apiClient.get('/school/students/export', { params, responseType: 'blob' }),
};

export const enrollmentsApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<PaginatedResponse<Enrollment>>('/school/enrollments', { params }),
  create: (data: EnrollmentFormData) =>
    apiClient.post<ApiSuccess<Enrollment>>('/school/enrollments', data),
  bulkCreate: (data: BulkEnrollmentFormData) =>
    apiClient.post('/school/enrollments/bulk', data),
  getByClasse: (classeId: number, params?: Record<string, unknown>) =>
    apiClient.get<PaginatedResponse<Enrollment>>(`/school/classes/${classeId}/students`, { params }),
  transfer: (enrollmentId: number, data: { new_classe_id: number; note?: string }) =>
    apiClient.post<ApiSuccess<Enrollment>>(`/school/enrollments/${enrollmentId}/transfer`, data),
  withdraw: (enrollmentId: number, reason: string) =>
    apiClient.post(`/school/enrollments/${enrollmentId}/withdraw`, { reason }),
};

export const parentsApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<PaginatedResponse<ParentContact>>('/school/parents', { params }),
  getOne: (id: number) =>
    apiClient.get<ApiSuccess<ParentContact>>(`/school/parents/${id}`),
  create: (data: Partial<ParentContact>) =>
    apiClient.post<ApiSuccess<ParentContact>>('/school/parents', data),
  update: (id: number, data: Partial<ParentContact>) =>
    apiClient.put<ApiSuccess<ParentContact>>(`/school/parents/${id}`, data),
  delete: (id: number) =>
    apiClient.delete(`/school/parents/${id}`),
};

### src/modules/school/hooks/useStudents.ts

// Hooks TanStack Query

// Élèves
useStudents(filters)         → useQuery key: ['students', filters]
useStudent(id)               → useQuery key: ['student', id]
useStudentStats(yearId)      → useQuery key: ['student-stats', yearId]
useCreateStudent()           → useMutation + invalidate ['students']
useUpdateStudent()           → useMutation + invalidate ['student', id]
useDeleteStudent()           → useMutation + invalidate ['students']
useSyncParents()             → useMutation + invalidate ['student', id]
useImportStudents()          → useMutation + invalidate ['students']
useExportStudents()          → mutation (télécharge le fichier blob)

// Inscriptions
useEnrollments(filters)      → useQuery key: ['enrollments', filters]
useClasseStudents(classeId, yearId) → useQuery key: ['classe-students', classeId, yearId]
useEnrollStudent()           → useMutation + invalidate ['enrollments', 'students']
useBulkEnroll()              → useMutation + invalidate ['enrollments', 'classe-students']
useTransferStudent()         → useMutation + invalidate ['enrollments']
useWithdrawStudent()         → useMutation + invalidate ['enrollments']

// Parents
useParents(filters)          → useQuery key: ['parents', filters], utile pour le moteur de recherche
useCreateParent()            → useMutation + invalidate ['parents']
useUpdateParent()            → useMutation + invalidate ['parents']

### src/modules/school/lib/studentHelpers.ts

export function getStudentStatusColor(status: StudentStatus): string { ... }
export function getGenderLabel(gender: Gender): string { ... }
export function getGenderColor(gender: Gender): string {
  return gender === 'male' ? 'blue' : 'pink';
}
export function formatBirthDate(dateStr: string): string {
  // Formate "2010-05-15" → "15/05/2010"
}
export function calculateAge(birthDate: string): number { ... }
export function generateAvatarInitials(fullName: string): string {
  // "KOUASSI Jean-Marc" → "KJ"
}
export function formatMatricule(matricule: string): string {
  // Formate pour affichage : "2024-PRI-00042"
}
export function getEnrollmentStatusColor(status: EnrollmentStatus): string { ... }
```

---

## SESSION 4.5 — Frontend Pages

```
## CONTEXTE PROJET — ENMA SCHOOL

Stack : React 18 + TypeScript 5, Tailwind + shadcn/ui, TanStack Query v5
Types, API, Hooks créés en Session 4.4 ✅

## GÉNÈRE LES PAGES ET COMPOSANTS

### 1. StudentsPage.tsx — Page principale

HEADER :
  Titre "Élèves" | Stats rapides inline : X élèves | X garçons | X filles
  Boutons : [📥 Importer] [📤 Exporter] [+ Nouvel élève]

FILTRES :
  - Recherche (nom, prénom, matricule)
  - Année scolaire (académique)
  - Classe (filtré par year + level)
  - Catégorie : Tous | Maternelle | Primaire | Collège | Lycée
  - Genre : Tous | Masculin | Féminin
  - Statut : Tous | Actif | Transféré | ...

TABLEAU (TanStack Table) — colonnes :
  Photo+Nom | Matricule | Classe | Genre | Âge | Statut | Actions

VUE GRILLE (option) :
  Cards avec photo/initiales, nom, matricule, classe, statut

ACTIONS PAR LIGNE (menu kebab) :
  Voir le dossier | Modifier | Inscrire | Transférer | Retirer | Supprimer

### 2. StudentDetailPage.tsx — Dossier complet de l'élève

URL : /school/students/:id

HEADER :
  Photo | Nom complet | Matricule | Badge statut
  Boutons : [Modifier] [Inscrire] [Transférer]

ONGLETS :
  1. "Dossier" — infos personnelles complètes
  2. "Inscriptions" — historique de toutes les inscriptions (PeriodTimeline)
  3. "Parents" — liste des parents/tuteurs avec boutons d'action
  4. "Notes" — placeholder "Disponible Phase 6"
  5. "Présences" — placeholder "Disponible Phase 9"
  6. "Paiements" — placeholder "Disponible Phase 10"

### 3. StudentFormModal.tsx — Créer / Modifier un élève

WIZARD EN 3 ÉTAPES :

Étape 1 : Identité
  - Nom*, Prénom* (sur la même ligne)
  - Date de naissance*, Lieu de naissance
  - Genre* (radio : Masculin / Féminin)
  - Nationalité (défaut: Ivoirienne)
  - Numéro acte de naissance
  - Photo (upload avec preview)

Étape 2 : Coordonnées & Infos médicales
  - Adresse, Ville
  - Groupe sanguin (select optionnel)
  - École précédente
  - Notes internes (textarea)

Étape 3 : Parents / Tuteurs
  - Section "Parent 1" et "Parent 2" (accordéon)
  - Pour chaque parent :
    * Recherche parent existant (SearchSelect par téléphone/nom)
      OU créer nouveau parent
    * Champs : Prénom, Nom, Téléphone*, Relation (père/mère/tuteur)
    * Checkboxes : Contact principal | Autorisé à récupérer
  - Maximum 2 parents

Validation Zod par étape.
Navigation : [Précédent] [Suivant] [Sauvegarder]

### 4. EnrollmentModal.tsx — Inscrire un élève

FORMULAIRE :
  1. Élève (pré-rempli si ouvert depuis un dossier, sinon SearchSelect)
  2. Année scolaire (select, défaut: année courante)
  3. Classe (select filtré par level compatible avec l'élève)
     → afficher capacité restante : "6ème 1 (32/40 places)"
  4. Date d'inscription (date picker, défaut: aujourd'hui)

ALERTE si classe presque pleine (>90%) :
  ⚠️ "Cette classe est presque complète (38/40 places)"

APRÈS INSCRIPTION :
  Afficher un récapitulatif avec le numéro d'inscription

### 5. BulkEnrollModal.tsx — Inscription en masse

Permet d'inscrire plusieurs élèves dans une même classe.
Interface : liste de cases à cocher, recherche en temps réel.

### 6. TransferStudentModal.tsx — Transfert

  1. Classe de destination (select)
  2. Motif du transfert (textarea)
  Afficher : classe source → classe destination avec flèche

### 7. ImportStudentsModal.tsx — Import CSV/Excel

  Étape 1 : Télécharger le template CSV
    [📥 Télécharger le modèle CSV]
    Tableau avec les colonnes attendues + exemples

  Étape 2 : Upload du fichier
    Zone drag & drop
    Preview des 5 premières lignes avant import

  Étape 3 : Résultat
    ✅ X élèves créés
    ⚠️ X lignes ignorées
    ❌ Erreurs détaillées avec numéro de ligne

### 8. StudentStatsWidget.tsx — Widget de stats

Utilisé dans la page principale et le dashboard (Phase 12) :
  - Donut chart : répartition genre
  - Bar chart : élèves par niveau
  - KPI cards : total, nouveaux ce mois, actifs

## COMPOSANTS À CRÉER

1. StudentAvatar.tsx
   Props : { student: StudentListItem; size?: 'xs'|'sm'|'md'|'lg' }
   → Photo si disponible, sinon initiales colorées (comme UserAvatar)

2. StudentStatusBadge.tsx
   Props : { status: StudentStatus }

3. GenderBadge.tsx
   Props : { gender: Gender }
   → Badge bleu "M" ou rose "F"

4. ParentCard.tsx
   Props : { parent: ParentWithPivot; onEdit; onRemove }
   → Card avec infos parent + badges (Contact principal, Peut récupérer)
   → Icône selon relation (père/mère/tuteur)

5. EnrollmentTimeline.tsx
   Props : { enrollments: Enrollment[] }
   → Timeline verticale des inscriptions de l'élève par année
   → Chaque entrée : année, classe, statut, dates

6. ClassCapacityBadge.tsx
   Props : { enrolled: number; capacity: number }
   → "32/40" avec couleur selon le taux (vert/orange/rouge)

7. MatriculeDisplay.tsx
   Props : { matricule: string }
   → Affiche le matricule formaté avec bouton copier

## NAVIGATION (mise à jour)

Ajouter dans navigation.ts :
  /school/students          → StudentsPage          (icône: Users)
  /school/students/:id      → StudentDetailPage
  /school/enrollments       → (page liste optionnelle, sinon géré via classes)

## RÈGLES UX

1. La recherche d'élèves existants (pour les inscriptions et les parents)
   utilise un SearchSelect avec debounce de 300ms

2. La capacité de classe est toujours affichée lors de l'inscription

3. L'import CSV affiche toujours les erreurs ligne par ligne
   pour faciliter la correction

4. Le matricule est affiché en lecture seule avec bouton "Copier"

5. Un élève sans inscription est signalé visuellement
   "Cet élève n'est pas inscrit pour l'année en cours"
```

---

## RÉCAPITULATIF PHASE 4

| Session | Contenu | Fichiers clés |
|---------|---------|---------------|
| 4.1 | Migrations | `students`, `parents`, `student_parents`, `enrollments` |
| 4.2 | Enums + Models + Services | `Student`, `ParentModel`, `Enrollment`, `StudentService`, `EnrollmentService` |
| 4.3 | Controllers + Resources + Routes | `StudentController`, `EnrollmentController`, `ParentController` |
| 4.4 | Frontend Types + API + Hooks | `students.types.ts`, `students.api.ts`, `useStudents.ts` |
| 4.5 | Frontend Pages + Composants | `StudentsPage`, `StudentDetailPage`, wizard `StudentFormModal`, `ImportStudentsModal` |

---

### Points d'attention critiques

1. **`Parent` est réservé en PHP** → nommer le model `ParentModel` ou placer dans un namespace
   et utiliser un alias dans les imports

2. **Matricule unique et auto-généré** → format `{YEAR}{CAT_CODE}{SEQ}`, généré dans `Model::boot()`
   avec verrou optimiste pour éviter les doublons en concurrence

3. **UNIQUE enrollment** → `(student_id, academic_year_id)` : un élève = une seule classe par année,
   validé en DB ET en Service

4. **Import CSV** → utiliser `Maatwebsite/Excel` (déjà dans le stack),
   traiter en queue si > 50 lignes pour ne pas bloquer la requête HTTP

5. **Cascade des suppressions** → supprimer un student soft-delete seulement,
   ne jamais supprimer physiquement un enrollment (document officiel)
