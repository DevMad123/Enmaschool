# ENMA SCHOOL — PROMPT SESSION : Tests Complets & Corrections
## Phases 0 → 12 — Géré par Claude Sonnet 4.6

---

> **Instructions d'utilisation :**
> 1. Ouvre une nouvelle session Claude Sonnet 4.6
> 2. Joins le fichier `enma-school-context.txt`
> 3. Colle ce prompt
> 4. Pour les tests PHPUnit → colle aussi les fichiers PHP concernés
> 5. Travaille par bloc de 3-4 phases max par session

---

## PROMPT À COLLER
lX%\qYH3f%cT
```
## RÔLE
Tu es un ingénieur senior full-stack et QA expert en :
- Laravel 12 / PHP 8.3 / PostgreSQL 18 / Redis
- Architecture multi-tenant (stancl/tenancy v3)
- Tests PHPUnit (Feature Tests, Unit Tests)
- React 18 / TypeScript 5
- Détection et correction de bugs

Ta mission est double :
  1. Écrire des tests PHPUnit automatisés pour les phases indiquées
  2. Analyser le code et corriger les bugs identifiés

## CONTEXTE PROJET — ENMA SCHOOL

[Le fichier enma-school-context.txt est joint — lis-le en entier avant de commencer]

Stack : PHP 8.3 / Laravel 12 / PostgreSQL 18
Multi-tenant : stancl/tenancy v3 (schema-per-tenant)
Auth : Laravel Sanctum + Spatie Permission
Conventions :
  ✓ strict_types=1 sur tous les fichiers PHP
  ✓ Trait ApiResponse → { success, data, message }
  ✓ Enums PHP 8.1
  ✓ Logique dans Services, pas dans Controllers
  ✓ soft_deletes sur toutes les entités principales

Credentials de test :
  URL centrale   : http://enmaschool.test
  URL tenant     : http://demo.enmaschool.test
  Super Admin    : superadmin@enmaschool.com / password
  School Admin   : admin@demo.com / password
  Teacher        : prof@demo.com / password
  Schema tenant  : tenant_demo

---

## MÉTHODE DE TRAVAIL

### Pour chaque phase, tu vas :

**ÉTAPE A — Analyse**
Lire le code des fichiers concernés (je te les fournirai) et identifier :
  - Les bugs évidents (logique incorrecte, typos, mauvais types)
  - Les cas limites non gérés
  - Les problèmes de sécurité (accès non autorisé, injection)
  - Les problèmes de performance (N+1, cache non invalidé)
  - Les incohérences entre le backend et le frontend

**ÉTAPE B — Écriture des tests PHPUnit**
Pour chaque phase → générer un fichier Feature Test complet :
  Chemin : tests/Feature/Phase{N}/{ClassName}Test.php

Structure de base de chaque test :
```php
<?php

declare(strict_types=1);

namespace Tests\Feature\Phase{N};

use Tests\TestCase;
use Tests\Traits\WithTenantSetup;   // trait maison à créer
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

class {ClassName}Test extends TestCase
{
    use RefreshDatabase, WithTenantSetup;

    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpTenant('demo');   // initialise le tenant de test
    }

    // ... tests
}
```

Trait `WithTenantSetup` à générer (une seule fois) :
```php
// tests/Traits/WithTenantSetup.php
trait WithTenantSetup {
    protected Tenant $tenant;
    protected User $schoolAdmin;
    protected User $teacher;

    protected function setUpTenant(string $slug): void {
        $this->tenant = Tenant::where('id', $slug)->firstOrFail();
        tenancy()->initialize($this->tenant);
        $this->schoolAdmin = User::where('role', 'school_admin')->first();
        $this->teacher = User::where('role', 'teacher')->first();
    }

    protected function actingAsAdmin(): static {
        return $this->actingAs($this->schoolAdmin, 'sanctum');
    }

    protected function actingAsTeacher(): static {
        return $this->actingAs($this->teacher, 'sanctum');
    }
}
```

**ÉTAPE C — Corrections**
Pour chaque bug trouvé :
  - Décrire précisément le bug (fichier + ligne + problème)
  - Fournir le code corrigé complet (pas juste la ligne)
  - Expliquer pourquoi c'est un bug et comment la correction le résout

---

## PHASES À TESTER — TRAVAILLE DANS CET ORDRE

### ══════════════════════════════════════════
### BLOC 1 — Phases 0, 1, 2 (Fondations)
### ══════════════════════════════════════════

#### PHASE 0 — Auth & Multi-tenant
Fichier test à générer : tests/Feature/Phase0/AuthTest.php

Tests à écrire :
```
[AUTH-001] 🔴 Login super admin → 200 + token
[AUTH-002] 🔴 Login school admin sur le bon tenant → 200 + token
[AUTH-003] 🔴 Login avec mauvais password → 401
[AUTH-004] 🔴 Login school admin sur mauvais sous-domaine → 401 ou 403
[AUTH-005] 🔴 GET /api/auth/me avec token valide → 200 + user data
[AUTH-006] 🔴 GET /api/auth/me sans token → 401
[AUTH-007] 🔴 POST /api/auth/logout → 200 + token révoqué
[AUTH-008] 🔴 Token révoqué → 401 sur requête suivante
[AUTH-009] 🔴 Tenant inactif → 403 sur toute route tenant
[AUTH-010] ⚠️ Isolation tenant : token de demo.enmaschool.test
           n'est PAS valide sur school2.enmaschool.test
```

Bugs probables à vérifier dans cette phase :
- Middleware `EnsureTenantIsActive` : vérifie-t-il le bon champ ?
- La colonne `role` sur `users` est-elle bien synchronisée avec Spatie ?
- Le logout invalide-t-il TOUS les tokens ou seulement le courant ?

---

#### PHASE 1 — Interface SuperAdmin
Fichier test : tests/Feature/Phase1/SuperAdminTest.php

Tests à écrire :
```
[SA-001] 🔴 Un school_admin NE PEUT PAS accéder aux routes /api/super-admin/*
[SA-002] 🔴 Créer un tenant → schéma PostgreSQL créé automatiquement
[SA-003] 🔴 Créer un plan → plan visible dans la liste
[SA-004] 🔴 Activer/désactiver un module pour un tenant
[SA-005] 🔴 Activity log créé après chaque action admin
[SA-006] ⚠️ Supprimer un tenant → schéma supprimé + données effacées
[SA-007] ⚠️ Changer le plan d'un tenant → modules mis à jour
```

Bugs probables :
- `plan_modules` et `tenant_modules` : la logique d'override est-elle correcte ?
- Les activity_logs ont `const UPDATED_AT = null` → vérifié ?

---

#### PHASE 2 — Config École & Structure Académique
Fichier test : tests/Feature/Phase2/AcademicStructureTest.php

Tests CRITIQUES à écrire :
```
[STRUCT-001] 🔴 Créer une classe "6ème 1" → display_name = "6ème 1"
[STRUCT-002] 🔴 Créer une classe "CM1 A" → display_name = "CM1 A"
[STRUCT-003] 🔴 Créer une classe "PS B" → display_name = "PS B"
[STRUCT-004] 🔴 Créer une classe "2nde 1" (sans série) → display_name = "2nde 1"
[STRUCT-005] 🔴 Créer "1ère A1" (avec série) → display_name = "1ère A1"
[STRUCT-006] 🔴 Créer "Tle C2" (avec série) → display_name = "Tle C2"
[STRUCT-007] 🔴 Créer 1ère sans série → 422 "série obligatoire"
[STRUCT-008] 🔴 Créer 6ème avec série → série ignorée (null en DB)
[STRUCT-009] 🔴 UNIQUE(academic_year_id, school_level_id, serie, section) respecté
[STRUCT-010] 🔴 SchoolSetting::get() retourne la valeur depuis le cache Redis
              (2ème appel → pas de requête DB)
[STRUCT-011] ⚠️ AcademicYear is_current : un seul = true à la fois
[STRUCT-012] ⚠️ Period is_current : un seul = true PAR academic_year
[STRUCT-013] ⚠️ Closing a period → is_closed = true, is_current = false
[STRUCT-014] 💡 ClassSubject::getEffectiveCoefficient() retourne
              coefficient_override s'il est défini, sinon subject.coefficient
```

Bugs probables CRITIQUES :
- `Classe::generateDisplayName()` : vérifier le format exact pour chaque cas
- Le scope `scopeForTenant()` sur SchoolLevel : filtre-t-il correctement
  selon les flags has_* du tenant ?
- NULL handling dans UNIQUE(serie, section) sur PostgreSQL

---

### ══════════════════════════════════════════
### BLOC 2 — Phases 3, 4, 5 (Personnes)
### ══════════════════════════════════════════

#### PHASE 3 — Rôles & Utilisateurs
Fichier test : tests/Feature/Phase3/UsersAndPermissionsTest.php

Tests à écrire :
```
[USER-001] 🔴 Créer un user avec role=teacher → Teacher profil créé auto (UserObserver)
[USER-002] 🔴 Changer role vers teacher → Teacher profil créé
[USER-003] 🔴 Changer role depuis teacher → Teacher désactivé
[USER-004] 🔴 Double sync : users.role ET Spatie role toujours cohérents
[USER-005] 🔴 Inviter par email → invitation créée avec token + expires_at=now()+72h
[USER-006] 🔴 Accepter invitation avec bon token → user créé + token Sanctum retourné
[USER-007] 🔴 Accepter invitation expirée → 422 "invitation expirée"
[USER-008] 🔴 Accepter invitation révoquée → 422
[USER-009] 🔴 Supprimer le seul school_admin → 422 "dernier administrateur"
[USER-010] 🔴 Un teacher ne peut PAS gérer un school_admin
[USER-011] ⚠️ Un director peut gérer teacher/accountant/staff
[USER-012] ⚠️ Un director NE PEUT PAS gérer school_admin
[USER-013] 🔴 teacher.can('grades.input') = true
[USER-014] 🔴 accountant.can('grades.input') = false
[USER-015] 🔴 Reset password → tokens Sanctum précédents invalidés
```

Bugs probables :
- `UserObserver` : est-il bien enregistré dans `AppServiceProvider` ?
- La double sync dans `UserService::updateRole()` : est-elle atomique (transaction) ?
- `InvitationService::accept()` : vérifie-t-il `isValid()` avant de créer le user ?

---

#### PHASE 4 — Gestion des Élèves
Fichier test : tests/Feature/Phase4/StudentsTest.php

Tests à écrire :
```
[STU-001] 🔴 Créer un élève → matricule auto-généré format "2024COL00001"
[STU-002] 🔴 2 élèves même catégorie → matricules séquentiels (00001, 00002)
[STU-003] 🔴 Inscrire un élève dans une classe → Enrollment créé
[STU-004] 🔴 Inscrire le même élève 2x même année → 422 "déjà inscrit"
[STU-005] 🔴 Inscrire dans classe pleine (capacity dépassée) → 422
[STU-006] 🔴 Transfert → ancien enrollment is_active=false + nouveau créé
[STU-007] 🔴 Retrait → enrollment status=withdrawn, is_active=false
[STU-008] 🔴 Un élève peut avoir max 2 parents
[STU-009] 🔴 Un seul parent is_primary_contact=true par élève
[STU-010] ⚠️ Soft delete un élève avec enrollment actif → 422
[STU-011] ⚠️ GenerateStudentFeesJob dispatché à la création d'un Enrollment
[STU-012] 💡 Import CSV → créer élèves + parents + enrollments correctement
```

Bugs probables :
- `Student::generateMatricule()` : concurrence → verrou optimiste ?
- `EnrollmentService::enroll()` : la vérification de capacité utilise
  `count(enrollments)` — est-ce qu'elle ignore les enrollments is_active=false ?
- Le model `ParentModel` (PHP réserve "Parent") : alias correct partout ?

---

#### PHASE 5 — Enseignants & Affectations
Fichier test : tests/Feature/Phase5/TeachersTest.php

Tests à écrire :
```
[TCH-001] 🔴 UNIQUE(class_id, subject_id, academic_year_id) respecté
[TCH-002] 🔴 Affecter même enseignant sur même créneau → ConflictException
[TCH-003] 🔴 Changer d'enseignant : unassign ancien + assign nouveau
[TCH-004] 🔴 Warning surcharge (heures > max) → pas de blocage, juste warning
[TCH-005] 🔴 Cache "teacher_{id}_weekly_hours" invalidé après assign/unassign
[TCH-006] 🔴 Teacher.weekly_hours calculé correctement :
           SUM(teacher_classes.hours_per_week) pour year courante
[TCH-007] ⚠️ setMainTeacher() → classes.main_teacher_id mis à jour
[TCH-008] ⚠️ employee_number auto-généré format "ENS-2024-0042"
[TCH-009] 💡 getUnassignedSubjects() retourne les matières sans enseignant
```

Bugs probables :
- `AssignmentService::assign()` : la vérification UNIQUE doit ignorer
  les assignments `is_active=false` (historique)
- Le cache `weekly_hours` : TTL de 300s — est-il invalidé après unassign ?

---

### ══════════════════════════════════════════
### BLOC 3 — Phases 6, 7 (Notes & Bulletins)
### ══════════════════════════════════════════

#### PHASE 6 — Notes & Évaluations
Fichier test : tests/Feature/Phase6/GradesTest.php

Tests CRITIQUES à écrire :
```
[GRD-001] 🔴 Créer une évaluation → grades VIDES créées pour tous les élèves inscrits
[GRD-002] 🔴 Score NULL ≠ Score 0 dans le calcul de moyenne
           (absent ignoré, pas compté comme zéro)
[GRD-003] 🔴 Calcul exact avec coefficients :
           DC1(coeff1)=15, DC2(coeff1)=12, COMP(coeff2)=16
           → Moyenne = (15×1 + 12×1 + 16×2) / (1+1+2) = 59/4 = 14.75
[GRD-004] 🔴 Normalisation sur 20 :
           Note 7.5/10 → score_on_20 = 7.5 × 20/10 = 15.0
[GRD-005] 🔴 Absent sur DC1, présent sur DC2(12) et COMP(16) :
           → Moyenne = (12×1 + 16×2) / (1+2) = 44/3 = 14.67
           (DC1 ne compte PAS)
[GRD-006] 🔴 Note > max_score → 422 "dépasse le barème"
[GRD-007] 🔴 Modifier note sur évaluation verrouillée → 403
[GRD-008] 🔴 Modifier note sur période clôturée → 403
[GRD-009] 🔴 RecalculatePeriodAverageJob dispatché après bulkSave
[GRD-010] 🔴 period_averages.rank calculé correctement dans la classe
[GRD-011] ⚠️ Un teacher ne peut saisir que ses affectations
[GRD-012] ⚠️ Un school_admin peut saisir sur toutes les classes
[GRD-013] 💡 GradesSheet retourne tous les élèves inscrits (pas seulement ceux notés)
```

Bugs probables CRITIQUES :
- `AverageCalculatorService::calculatePeriodAverage()` :
  la formule SUM(contribution)/SUM(coeff) → vérifier le diviseur
  (doit être SUM des coeffs des évaluations NOTÉES, pas toutes)
- `Grade::getScoreOn20Attribute()` : si max_score = 20, retourne score direct ?
  Vérifier division par zéro si max_score = 0
- `EvaluationService::create()` : la création des grades vides utilise
  `Grade::insert([...])` — est-ce qu'elle récupère TOUS les enrollments actifs ?

---

#### PHASE 7 — Bulletins Scolaires
Fichier test : tests/Feature/Phase7/ReportCardsTest.php

Tests à écrire :
```
[RC-001] 🔴 Initier un bulletin → status=draft
[RC-002] 🔴 UNIQUE(enrollment_id, period_id, type) : doublon → updateOrCreate
[RC-003] 🔴 Bulletin annuel (period_id=NULL) : index partiel PostgreSQL respecté
[RC-004] 🔴 Modifier bulletin publié → 403 "bulletin publié et verrouillé"
[RC-005] 🔴 collectBulletinData() retourne les bonnes moyennes
           (issues de period_averages, pas recalculées)
[RC-006] 🔴 Snapshot au moment de la génération :
           modifier une note après génération → PDF reste identique
[RC-007] 🔴 GenerateBulletinsJob dispatché en queue "bulletins"
[RC-008] 🔴 PDF généré → pdf_path non null, pdf_hash non null
[RC-009] 🔴 PDF stocké au bon chemin :
           storage/app/tenant_demo/bulletins/{year}/{period}/{matricule}.pdf
[RC-010] 🔴 Publier sans PDF → 422 "PDF non généré"
[RC-011] ⚠️ council_decision auto-suggéré selon la moyenne
[RC-012] ⚠️ honor_mention seulement si council_decision='honor'
[RC-013] 💡 Rapport de complétion classe : total/draft/generated/published/missing
```

Bugs probables :
- La contrainte partielle PostgreSQL sur bulletin annuel :
  `WHERE period_id IS NULL AND type = 'annual'` — est-elle créée dans la migration ?
- `ReportCardService::generatePdf()` : le template Blade utilise DejaVu Sans
  pour les accents français — la police est-elle chargée dans DomPDF ?
- `collectBulletinData()` : si un élève n'a pas de moyennes calculées,
  est-ce que ça crashe ou retourne null proprement ?

---

### ══════════════════════════════════════════
### BLOC 4 — Phases 8, 9 (Planning & Présences)
### ══════════════════════════════════════════

#### PHASE 8 — Emploi du Temps
Fichier test : tests/Feature/Phase8/TimetableTest.php

Tests à écrire :
```
[EDT-001] 🔴 TimeSlotSeeder : 45 créneaux présents (9/jour × 5 jours)
[EDT-002] 🔴 7 cours + 2 pauses par jour
[EDT-003] 🔴 Ajouter cours sur créneau pause → 422 "créneau est une pause"
[EDT-004] 🔴 UNIQUE(class_id, time_slot_id, academic_year_id) respecté
[EDT-005] 🔴 Même enseignant, même créneau, 2 classes → 409 ConflictException (teacher)
[EDT-006] 🔴 Même salle, même créneau, 2 classes → 409 ConflictException (room)
[EDT-007] 🔴 Salles différentes → pas de conflit salle
[EDT-008] 🔴 room_id=null → pas de vérification salle
[EDT-009] 🔴 checkConflicts() retourne has_conflict=false si pas de conflit
[EDT-010] 🔴 Override annulation → is_cancelled=true dans getWeekView()
[EDT-011] 🔴 Override substitution → effective_teacher = substitute_teacher
[EDT-012] 🔴 Override date incorrecte (mauvais jour semaine) → 422
[EDT-013] ⚠️ UNIQUE(entry_id, date) pour les overrides
[EDT-014] ⚠️ getWeekView() résout correctement les overrides pour chaque jour
[EDT-015] 💡 Module timetable désactivé → 403 sur toutes les routes timetable
```

Bugs probables :
- `TimetableService::addEntry()` : la vérification UNIQUE doit-elle ignorer
  les entrées `is_active=false` ? (Un slot peut être réutilisé après suppression)
- `getWeekView()` : si aucune entrée pour un slot → retourne null ou objet vide ?
- Override : la vérification du jour de semaine compare
  `Carbon::parse($date)->dayOfWeek` avec `time_slot.day_of_week` → mapping correct ?
  (Carbon : 0=Dimanche, 1=Lundi... vs notre 1=Lundi, 6=Samedi)

---

#### PHASE 9 — Présences
Fichier test : tests/Feature/Phase9/AttendanceTest.php

Tests à écrire :
```
[ATT-001] 🔴 Feuille d'appel : retourne TOUS les élèves inscrits
[ATT-002] 🔴 updateOrCreate : saisir 2x même appel → pas de doublon
[ATT-003] 🔴 Index partiel : timetable_entry_id=NULL unique par (enrollment, date)
[ATT-004] 🔴 Status 'present' → is_present=true, is_absent=false
[ATT-005] 🔴 Status 'absent' → countsAsAbsent()=true
[ATT-006] 🔴 Status 'late' → is_present=true (présent mais en retard)
[ATT-007] 🔴 Status 'excused' → countsAsExcused()=true, countsAsAbsent()=false
[ATT-008] 🔴 Taux de présence = (present + late) / total × 100
[ATT-009] 🔴 is_at_risk basé sur school_settings.attendance_risk_threshold
           (pas hardcodé 80%)
[ATT-010] 🔴 Approuver justification → toutes les attendances 'absent'
           de la plage → 'excused'
[ATT-011] 🔴 Approuver justification → UpdateReportCardAbsencesJob dispatché
[ATT-012] 🔴 Rejeter justification → attendances restent 'absent'
[ATT-013] 🔴 report_cards.absences_justified mis à jour après job
[ATT-014] ⚠️ Saisir appel sur date future → 422
[ATT-015] ⚠️ Un teacher ne peut faire l'appel que pour ses cours assignés
[ATT-016] 💡 Calendrier mensuel : 1 entrée par jour avec taux correct
```

Bugs probables CRITIQUES :
- `AttendanceService::getStudentStats()` : le taux de présence doit être
  `(present + late) / total` — vérifie que 'late' est dans les "présents"
- `attendance_risk_threshold` : tout le code doit utiliser
  `SchoolSetting::get('attendance_risk_threshold', 80.0)` → pas de `80` hardcodé
- L'index partiel PostgreSQL : était-il bien créé dans la migration ?
  ```sql
  CREATE UNIQUE INDEX attendances_daily_unique
  ON attendances(enrollment_id, date)
  WHERE timetable_entry_id IS NULL;
  ```

---

### ══════════════════════════════════════════
### BLOC 5 — Phases 10, 11, 12 (Gestion & Reporting)
### ══════════════════════════════════════════

#### PHASE 10 — Frais Scolaires
Fichier test : tests/Feature/Phase10/PaymentsTest.php

Tests à écrire :
```
[PAY-001] 🔴 Créer un Enrollment → GenerateStudentFeesJob dispatché
[PAY-002] 🔴 GenerateStudentFeesJob : student_fees créés selon les fee_schedules
[PAY-003] 🔴 receipt_number auto-généré format "2025-00042" (unique + séquentiel)
[PAY-004] 🔴 Enregistrer un paiement → student_fee.amount_paid mis à jour
[PAY-005] 🔴 Paiement > amount_remaining → 422 "dépasse le solde"
[PAY-006] 🔴 student_fee.status passe de pending → partial → paid
[PAY-007] 🔴 Annuler un paiement → amount_paid recalculé → status recalculé
[PAY-008] 🔴 student_fee.amount_remaining = amount_due - discount - amount_paid
[PAY-009] 🔴 Exonérer (waive) → status=Waived, ne peut plus être payé normalement
[PAY-010] 🔴 Mode wave/orange_money → reference OBLIGATOIRE
[PAY-011] ⚠️ Paiement en cash → reference optionnelle
[PAY-012] ⚠️ FeeSchedule : tarif spécifique au niveau > tarif défaut (NULL level)
[PAY-013] ⚠️ Copier tarifs d'une année → fee_schedules dupliqués année suivante
[PAY-014] 💡 Module payments désactivé → 403 sur toutes les routes
```

Bugs probables :
- `Payment::boot()` pour `receipt_number` : concurrence haute → verrou ?
  `DB::transaction()` avec `lockForUpdate()` sur le dernier receipt
- `recalculateBalance()` : compte uniquement les paiements non annulés
  (`whereNull('cancelled_at')`) — vérifié ?
- `FeeService::generateForEnrollment()` : si pas de fee_schedule pour ce level,
  utilise le schedule avec `school_level_id = NULL` → logique correcte ?

---

#### PHASE 11 — Communication
Fichier test : tests/Feature/Phase11/MessagingTest.php

Tests à écrire :
```
[MSG-001] 🔴 findOrCreateDirect(userA, userB) : idempotent (appeler 2x → 1 conversation)
[MSG-002] 🔴 Envoyer un message → last_message_at de la conversation mis à jour
[MSG-003] 🔴 Envoyer un message → last_message_preview tronqué à 200 chars
[MSG-004] 🔴 Un non-participant ne peut PAS lire les messages → 403
[MSG-005] 🔴 Un non-participant ne peut PAS envoyer → 403
[MSG-006] 🔴 Supprimer un message → deleted_at non null, body reste en DB
[MSG-007] 🔴 Message supprimé retourné par l'API avec body="[Message supprimé]"
[MSG-008] 🔴 unread_count calculé correctement depuis last_read_at
[MSG-009] 🔴 markRead → participant.last_read_at = now → unread_count = 0
[MSG-010] 🔴 Annonce publiée → NotifyAnnouncementJob dispatché
[MSG-011] 🔴 Annonce ciblant ["teacher"] → vue par les teachers, pas les accountants
[MSG-012] 🔴 Notification créée → NotificationReceived broadcast via Reverb
[MSG-013] ⚠️ Notification.UPDATED_AT = null → pas de updated_at en DB
[MSG-014] ⚠️ markAllRead → toutes les notifs de l'user → is_read=true
[MSG-015] 💡 Module messaging désactivé → 403 sur messaging/conversations
           MAIS les notifications restent accessibles
```

Bugs probables :
- `ConversationService::findOrCreateDirect()` : cherche-t-il correctement
  une conversation avec EXACTEMENT ces 2 participants ?
  (pas une conv groupe qui inclurait ces 2 users parmi d'autres)
- `Notification` model : `const UPDATED_AT = null` → est-ce déclaré ?
  Si non → erreur SQL car Laravel essaie de mettre à jour une colonne inexistante
- Le module guard : les notifications sont hors `module:messaging` → vérifié dans les routes ?

---

#### PHASE 12 — Rapports & Dashboard
Fichier test : tests/Feature/Phase12/DashboardTest.php

Tests à écrire :
```
[DASH-001] 🔴 getDirectionStats() retourne les bonnes données (students.total, etc.)
[DASH-002] 🔴 Cache Redis utilisé : 2ème appel → pas de requête DB supplémentaire
[DASH-003] 🔴 invalidateDashboardCache() vide les clés concernées
[DASH-004] 🔴 getAcademicStats() : passing_rate correct
           (nb élèves >= passing_average / total)
[DASH-005] 🔴 getFinancialStats() : collection_rate = total_collected / total_expected
[DASH-006] 🔴 getTeacherDashboard() : filtré sur les classes DU teacher connecté
           (pas toutes les classes)
[DASH-007] 🔴 Export Excel élèves → fichier XLSX téléchargeable
[DASH-008] 🔴 Export résultats → colonnes correctes (une par matière)
[DASH-009] ⚠️ Un teacher ne voit PAS le dashboard direction
[DASH-010] ⚠️ Un accountant voit le dashboard financier mais PAS le dashboard académique
[DASH-011] 💡 grade_distribution : "0-5", "5-10", etc. comptés correctement
```

Bugs probables :
- `DashboardService::getTeacherDashboard()` : filtre sur `teacher.user_id = auth()->id()`
  → vérifie le lien entre User et Teacher
- Le calcul `passing_rate` doit utiliser `SchoolSetting::get('passing_average', 10.0)`
  → pas une valeur hardcodée
- Export Excel : Maatwebsite ne supporte pas toutes les options sur certaines versions
  → vérifier `WithColumnWidths` vs `ShouldAutoSize`

---

## FORMAT DE SORTIE POUR CHAQUE BLOC

Pour chaque phase analysée, Claude doit produire dans cet ordre :

### 1. 🐛 BUGS IDENTIFIÉS

```
Bug #1 : [DESCRIPTION COURTE]
Fichier : app/Services/XxxService.php, ligne ~42
Problème : [explication précise]
Impact : [ce qui se passe concrètement]

CORRECTION :
// Avant (buggy)
[code incorrect]

// Après (corrigé)
[code corrigé]

Raison : [pourquoi cette correction est correcte]
```

### 2. 🧪 FICHIER DE TEST PHPUNIT

Fichier complet, exécutable avec :
```bash
php artisan test tests/Feature/PhaseN/XxxTest.php
```

Chaque méthode de test doit :
- Être nommée explicitement : `test_login_with_invalid_password_returns_401()`
- Avoir un arrange/act/assert clair
- Utiliser les assertions Laravel : `$response->assertStatus()`, `$response->assertJson()`
- Utiliser `$this->actingAsAdmin()` ou `$this->actingAsTeacher()`
- Tester les cas positifs ET négatifs

Exemple de test bien écrit :
```php
/** @test */
public function test_creating_premiere_class_without_serie_returns_422(): void
{
    // Arrange
    $year = AcademicYear::factory()->create(['is_current' => true]);
    $level = SchoolLevel::where('code', '1ERE')->first();

    // Act
    $response = $this->actingAsAdmin()
        ->putJson('/api/school/classes', [
            'academic_year_id' => $year->id,
            'school_level_id'  => $level->id,
            'section'          => '1',
            // serie intentionnellement absent
        ]);

    // Assert
    $response->assertStatus(422)
             ->assertJsonValidationErrors(['serie'])
             ->assertJsonFragment(['message' => 'La série est obligatoire pour ce niveau']);
}
```

### 3. ✅ CHECKLIST DE TESTS MANUELS

Pour les cas qui ne peuvent pas être testés avec PHPUnit
(WebSocket, génération PDF, export Excel, UI frontend) :

```
□ [MANUEL-001] Ouvrir /school/grades/sheet → navigation clavier P/A/R/J
□ [MANUEL-002] Générer un bulletin → vérifier accent français dans le PDF
□ [MANUEL-003] Envoyer un message → apparaît en temps réel (Reverb)
...
```

---

## COMMENT EXÉCUTER LES TESTS

```bash
# Créer la base de test
cp .env .env.testing
# Modifier .env.testing : DB_DATABASE=enma_school_test

# Lancer tous les tests d'une phase
php artisan test tests/Feature/Phase0/ --env=testing

# Lancer un test spécifique
php artisan test tests/Feature/Phase2/AcademicStructureTest.php \
    --filter=test_creating_sixieme_class_generates_correct_display_name

# Lancer tous les tests avec couverture
php artisan test --coverage --env=testing

# En mode verbose (voir les noms des tests)
php artisan test --verbose --env=testing
```

---

## RÈGLES IMPÉRATIVES POUR CLAUDE

1. **Analyse d'abord, code ensuite** — commence toujours par identifier les bugs
   AVANT d'écrire les tests. Un test qui passe sur du code buggy est inutile.

2. **Tests réalistes** — utilise les mêmes IDs, emails et valeurs que les seeders
   existants (admin@demo.com, prof@demo.com, etc.)

3. **Tests indépendants** — chaque test doit fonctionner seul grâce à
   `RefreshDatabase` + `setUp()`. Jamais de dépendance entre tests.

4. **Corrections complètes** — donne toujours le fichier entier corrigé,
   pas juste la ligne modifiée. Contexte = crucial.

5. **Priorisation** — commence par les bugs 🔴 CRITIQUES. Les ⚠️ importants
   viennent ensuite. Les 💡 régressions en dernier.

6. **Respect du contexte** — toutes les corrections doivent respecter les
   conventions du projet (strict_types, Enums, Services, ApiResponse trait).

7. **Un bloc par session** — ne pas essayer de tout faire en une seule session.
   Traite un bloc (3-4 phases) par session pour rester précis.
```
