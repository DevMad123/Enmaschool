# ENMA SCHOOL — PROMPTS PHASE 7
## Bulletins Scolaires (PDF)

---

> ## PÉRIMÈTRE DE LA PHASE 7
>
> **Objectif :** Générer les bulletins scolaires individuels en PDF
> pour chaque élève, par période et annuel, avec toutes les moyennes,
> rangs, appréciations et informations de l'école.
>
> **Tables nouvelles :**
> | Table | Description |
> |-------|-------------|
> | `report_cards` | Bulletin généré (métadonnées + statut + chemin PDF) |
> | `report_card_appreciations` | Appréciations par matière sur le bulletin |
> | `report_card_decisions` | Décision du conseil de classe |
>
> **Concepts clés :**
> - Un **bulletin** (report_card) est généré par élève + période (ou annuel)
> - Il récupère les données depuis `period_averages` et `subject_averages` (Phase 6)
> - Le PDF est généré via **barryvdh/laravel-dompdf** (déjà dans le stack)
> - Les **appréciations** (commentaires enseignant par matière) sont saisies
>   sur le bulletin avant génération
> - La **décision** (admis, redoublant, passage conditionnel...) est saisie
>   par le directeur/admin lors du conseil de classe
> - Un bulletin **publié** ne peut plus être modifié
> - Génération en **masse** possible pour toute une classe ou toute l'école
>
> **Format du bulletin ivoirien :**
> - En-tête : logo école, nom établissement, année scolaire
> - Infos élève : nom, prénom, matricule, classe, date de naissance
> - Tableau des notes : Matière | Coeff | Moy période | Rang | Appréciation
> - Moyennes générales par période (si annuel : les 3 colonnes + annuel)
> - Rang dans la classe, effectif
> - Absences justifiées / non justifiées
> - Appréciation générale du conseil de classe
> - Décision (passage, redoublement...)
> - Signature directeur, cachet école
> - Pied de page : devise école, contacts
>
> **HORS PÉRIMÈTRE Phase 7 :**
> - Envoi par email → Phase 11
> - Portail parent/élève pour consultation → V2
>
> **Dépendances requises :**
> - Phase 2 ✅ (school_settings, academic_years, periods, classes, subjects)
> - Phase 4 ✅ (students, enrollments)
> - Phase 6 ✅ (period_averages, subject_averages, evaluations)

---

## SESSION 7.1 — Migrations

```
## CONTEXTE PROJET — ENMA SCHOOL

Stack : PHP 8.3 / Laravel 12 / PostgreSQL 18
Multi-tenant : stancl/tenancy v3 (schema-per-tenant)

Phases terminées :
- Phase 0-1 : Auth, SuperAdmin
- Phase 2 : Classes, Matières, Périodes, school_settings
- Phase 3 : Utilisateurs, Rôles
- Phase 4 : Élèves (students, enrollments)
- Phase 5 : Enseignants, Affectations
- Phase 6 : Notes (evaluations, grades, period_averages, subject_averages)

Tables existantes utiles :
  students(id, matricule, first_name, last_name, birth_date, ...)
  enrollments(id, student_id, classe_id, academic_year_id, ...)
  classes(id, display_name, school_level_id, academic_year_id, main_teacher_id, ...)
  periods(id, academic_year_id, name, type, order, is_closed, ...)
  academic_years(id, name, passing_average, period_type, ...)
  period_averages(id, enrollment_id, student_id, class_id, subject_id,
                  period_id, average, weighted_average, coefficient,
                  rank, class_average, min_score, max_score, ...)
  subject_averages(id, enrollment_id, student_id, class_id, subject_id,
                   academic_year_id, annual_average, weighted_average,
                   is_passing, rank, period_averages jsonb, ...)

## CETTE SESSION — Phase 7 : Migrations

Toutes les migrations dans database/migrations/tenant/

## GÉNÈRE LES MIGRATIONS (dans l'ordre)

### 1. create_report_cards_table

Objectif : métadonnées d'un bulletin scolaire, son statut et l'accès au PDF.

Colonnes :
  id
  enrollment_id      (foreignId → enrollments, cascadeOnDelete)
  student_id         (foreignId → students, cascadeOnDelete)
  class_id           (foreignId → classes, cascadeOnDelete)
  academic_year_id   (foreignId → academic_years, cascadeOnDelete)
  period_id          (foreignId → periods, nullOnDelete, nullable)
                     NULL = bulletin annuel (de fin d'année)
  type               (enum: period/annual)
                     'period' = bulletin trimestriel/semestriel
                     'annual' = bulletin de fin d'année

  -- Données snapshot (au moment de la génération)
  general_average    (decimal 5,2, nullable) — moyenne générale
  general_rank       (unsignedSmallInteger, nullable) — rang dans la classe
  class_size         (unsignedSmallInteger, nullable) — effectif de la classe
  class_average      (decimal 5,2, nullable) — moyenne de la classe
  absences_justified   (unsignedSmallInteger, default:0)
  absences_unjustified (unsignedSmallInteger, default:0)

  -- Appréciation générale (conseil de classe)
  general_appreciation (text, nullable) — appréciation globale rédigée
  council_decision     (enum: pass/repeat/conditional/honor/..., nullable)
                       voir détails ci-dessous
  honor_mention        (enum: encouragements/compliments/felicitations, nullable)

  -- Statut
  status             (enum: draft/generated/published/archived)
                     draft      = bulletin en cours de préparation
                     generated  = PDF généré (non encore publié)
                     published  = publié (visible parents — V2, vérouillé)
                     archived   = archivé

  -- PDF
  pdf_path           (string, nullable) — chemin vers le fichier PDF stocké
  pdf_generated_at   (timestamp, nullable)
  pdf_hash           (string, nullable) — hash SHA256 du PDF (intégrité)

  -- Méta
  generated_by       (foreignId → users, nullOnDelete, nullable)
  published_by       (foreignId → users, nullOnDelete, nullable)
  published_at       (timestamp, nullable)
  created_at, updated_at

  UNIQUE(enrollment_id, period_id, type)
  → NB : period_id NULL + type=annual → géré par contrainte partielle PostgreSQL
  Index : enrollment_id, student_id, class_id, academic_year_id, period_id, status

  ENUM council_decision values :
    'pass'          → Admis(e) en classe supérieure
    'repeat'        → Redouble
    'conditional'   → Passage conditionnel
    'transfer'      → Orienté(e) vers un autre établissement
    'excluded'      → Exclu(e)
    'honor'         → Admis(e) avec mention

  ENUM honor_mention values :
    'encouragements' → Encouragements
    'compliments'    → Compliments
    'felicitations'  → Félicitations

### 2. create_report_card_appreciations_table

Objectif : appréciations par matière rédigées par l'enseignant ou l'admin,
           sauvegardées sur le bulletin avant génération du PDF.

Colonnes :
  id
  report_card_id     (foreignId → report_cards, cascadeOnDelete)
  subject_id         (foreignId → subjects, cascadeOnDelete)
  teacher_id         (foreignId → teachers, nullOnDelete, nullable)
                     enseignant qui a rédigé l'appréciation
  appreciation       (text) — texte de l'appréciation
                     ex: "Bon travail, peut mieux faire en algèbre"
  entered_by         (foreignId → users, nullOnDelete, nullable)
  timestamps

  UNIQUE(report_card_id, subject_id)
  Index : report_card_id, subject_id, teacher_id

### 3. Pas de migration séparée pour report_card_decisions
   → Les décisions sont directement sur report_cards
     (council_decision + honor_mention + general_appreciation)

## RÈGLES MÉTIER (commentaires dans migrations)

1. Un bulletin de période (type=period) est lié à une period_id
   Un bulletin annuel (type=annual) a period_id = NULL

2. UNIQUE(enrollment_id, period_id, type) :
   → Un seul bulletin par élève par période
   → Pour le bulletin annuel : un seul par enrollment (period_id NULL)
   → PostgreSQL gère les NULL dans UNIQUE différemment
   → Ajouter une contrainte partielle :
     CREATE UNIQUE INDEX report_cards_annual_unique
     ON report_cards(enrollment_id, type)
     WHERE period_id IS NULL AND type = 'annual';

3. Un bulletin published ne peut plus être modifié
   → Validé dans le Service

4. La suppression physique d'un bulletin est interdite en production
   → Seul archived est permis

## COMMANDES DE TEST

php artisan migrate --path=database/migrations/tenant
php artisan tinker
  >>> Schema::hasTable('report_cards')
  >>> Schema::hasTable('report_card_appreciations')
  >>> Schema::getColumnListing('report_cards')
```

---

## SESSION 7.2 — Enums + Models + Services

```
## CONTEXTE PROJET — ENMA SCHOOL

Stack : PHP 8.3 / Laravel 12, strict_types=1, Enums PHP 8.1
PDF : barryvdh/laravel-dompdf (déjà installé dans le stack)

Phase 7 Session 1 terminée :
- Migrations : report_cards, report_card_appreciations ✅

## GÉNÈRE LES ENUMS

### app/Enums/ReportCardType.php
cases : Period, Annual
values: 'period', 'annual'
méthode : label() → "Bulletin de période", "Bulletin annuel"

### app/Enums/ReportCardStatus.php
cases : Draft, Generated, Published, Archived
values: 'draft', 'generated', 'published', 'archived'
méthode : label() → "Brouillon", "Généré", "Publié", "Archivé"
méthode : color()
  Draft → 'gray', Generated → 'blue',
  Published → 'green', Archived → 'orange'
méthode : isEditable() : bool → true seulement pour Draft

### app/Enums/CouncilDecision.php
cases : Pass, Repeat, Conditional, Transfer, Excluded, Honor
values: 'pass','repeat','conditional','transfer','excluded','honor'
méthode : label() →
  pass → "Admis(e) en classe supérieure"
  repeat → "Redouble"
  conditional → "Passage conditionnel"
  transfer → "Orienté(e)"
  excluded → "Exclu(e)"
  honor → "Admis(e) avec mention"
méthode : color()
  pass → 'green', repeat → 'red', conditional → 'orange',
  transfer → 'blue', excluded → 'red', honor → 'purple'

### app/Enums/HonorMention.php
cases : Encouragements, Compliments, Felicitations
méthode : label() → "Encouragements", "Compliments", "Félicitations"
méthode : color()
  Encouragements → 'blue', Compliments → 'purple', Felicitations → 'gold'

## GÉNÈRE LES MODELS

### ReportCard.php

$fillable : enrollment_id, student_id, class_id, academic_year_id, period_id, type,
            general_average, general_rank, class_size, class_average,
            absences_justified, absences_unjustified,
            general_appreciation, council_decision, honor_mention,
            status, pdf_path, pdf_generated_at, pdf_hash,
            generated_by, published_by, published_at

Casts :
  type → ReportCardType::class
  status → ReportCardStatus::class
  council_decision → CouncilDecision::class (nullable)
  honor_mention → HonorMention::class (nullable)
  pdf_generated_at → 'datetime'
  published_at → 'datetime'
  general_average → 'decimal:2'
  class_average → 'decimal:2'

Relations :
  enrollment()     → belongsTo Enrollment
  student()        → belongsTo Student
  classe()         → belongsTo Classe (FK: class_id)
  academicYear()   → belongsTo AcademicYear
  period()         → belongsTo Period (nullable)
  appreciations()  → hasMany ReportCardAppreciation
  generatedBy()    → belongsTo User (FK: generated_by)
  publishedBy()    → belongsTo User (FK: published_by)

Méthodes :
  isEditable() : bool → status->isEditable() && !isPublished()
  isPublished() : bool → status === ReportCardStatus::Published
  isPeriodType() : bool → type === ReportCardType::Period
  isAnnualType() : bool → type === ReportCardType::Annual
  getPdfUrl() : string|null → URL signée ou publique vers le PDF
  hasPdf() : bool → !empty($this->pdf_path)

Scopes :
  scopeForStudent($query, int $studentId)
  scopeForClass($query, int $classeId)
  scopeForPeriod($query, int $periodId)
  scopeForYear($query, int $yearId)
  scopePublished($query)
  scopeDraft($query)
  scopeByType($query, ReportCardType $type)

### ReportCardAppreciation.php

$fillable : report_card_id, subject_id, teacher_id, appreciation, entered_by

Relations :
  reportCard() → belongsTo ReportCard
  subject()    → belongsTo Subject
  teacher()    → belongsTo Teacher (nullable)
  enteredBy()  → belongsTo User

## GÉNÈRE LES SERVICES

### ReportCardService.php

// ── Gestion des bulletins ──────────────────────────────────

initiate(int $enrollmentId, int $periodId = null, string $type = 'period') : ReportCard
  → Crée ou retrouve le bulletin en statut draft
  → updateOrCreate(['enrollment_id', 'period_id', 'type'], [...])
  → Ne génère PAS encore le PDF

initiateForClass(int $classeId, int $periodId = null) : Collection
  → Pour tous les élèves inscrits dans la classe
  → Crée les bulletins en draft
  → Retourne la collection créée

updateCouncilData(ReportCard $rc, array $data) : ReportCard
  data : general_appreciation, council_decision, honor_mention
  → Vérifie rc->isEditable()

saveAppreciation(ReportCard $rc, int $subjectId, string $text, User $by) : ReportCardAppreciation
  → updateOrCreate(['report_card_id', 'subject_id'], [...])
  → Vérifie rc->isEditable()

bulkSaveAppreciations(ReportCard $rc, array $appreciations, User $by) : void
  appreciations = [
    ['subject_id' => X, 'appreciation' => 'Très bon travail'],
    ...
  ]

// ── Génération PDF ─────────────────────────────────────────

generatePdf(ReportCard $rc) : ReportCard
  → Collecte TOUTES les données nécessaires via collectBulletinData()
  → Génère le PDF via Dompdf
  → Sauvegarde le fichier : storage/app/tenant_{slug}/bulletins/{year}/{period}/{matricule}.pdf
  → Met à jour : pdf_path, pdf_generated_at, pdf_hash, status = Generated
  → Retourne le ReportCard mis à jour

generateForClass(int $classeId, int $periodId = null) : void
  → dispatch GenerateBulletinsJob (queue: 'bulletins')
  → Traitement asynchrone pour toute une classe

generateForYear(int $yearId, int $periodId = null) : void
  → dispatch GenerateBulletinsJob pour toutes les classes de l'année

publish(ReportCard $rc, User $publishedBy) : ReportCard
  → Vérifie que le PDF existe (hasPdf())
  → status = Published, published_by, published_at = now()
  → NE PEUT PLUS ÊTRE MODIFIÉ

publishForClass(int $classeId, int $periodId) : int
  → Publie tous les bulletins générés d'une classe
  → Retourne le nombre de bulletins publiés

archive(ReportCard $rc) : ReportCard
  → status = Archived

delete(ReportCard $rc) : void
  → Interdit si Published
  → Sinon : supprimer le fichier PDF + la row en DB
  → NB : pas de soft delete pour les bulletins (données sensibles)

// ── Collecte des données ───────────────────────────────────

collectBulletinData(ReportCard $rc) : array
  → Données complètes pour le template PDF :
  {
    school: {
      name, logo_url, address, phone, email,
      director_name, motto,
    },
    academic_year: { name, period_type },
    period: { name, order } | null,
    student: {
      full_name, matricule, birth_date, birth_place,
      gender, nationality, photo_url,
    },
    classe: {
      display_name, level_label, category,
      main_teacher_name,
    },
    stats: {
      general_average, general_rank, class_size, class_average,
      absences_justified, absences_unjustified,
      is_passing, council_decision, honor_mention,
      general_appreciation,
    },
    subjects: [
      {
        name, code, coefficient,
        // Pour bulletin de période :
        period_average, rank, class_average, min_score, max_score,
        appreciation,
        is_passing,
        // Pour bulletin annuel : moyennes des 3 périodes + annuel
        period_1_avg, period_2_avg, period_3_avg, annual_avg,
      }
    ],
    // Moyennes générales (pour bulletin annuel)
    period_generals: [
      { period_name: "1er Trim.", average: 12.5, rank: 5 }
    ],
    // Signature & cachet
    generated_at: string,
    pdf_hash: string,
  }

getStatsByClass(int $classeId, int $periodId) : array
  → Statistiques de génération pour une classe :
    { total: int, draft: int, generated: int, published: int, missing: int }

### PdfGeneratorService.php

Objectif : wrapper propre autour de DomPDF.

generate(string $view, array $data, string $filename) : string
  → Charge la vue Blade : resources/views/pdf/report_card.blade.php
  → Génère le PDF en mémoire via Dompdf::loadHTML()
  → Configure : landscape=false, format='A4', dpi=150
  → Sauvegarde dans Storage::disk('local') avec le bon chemin
  → Retourne le chemin du fichier sauvegardé

getUrl(string $pdfPath) : string
  → Retourne l'URL pour télécharger le PDF
  → Via route signée si bulletin non publié
  → Via URL publique si bulletin publié

## JOB : GenerateBulletinsJob.php

Queue : 'bulletins'
Payload : class_id, period_id, year_id, type

handle() :
  → Récupère tous les enrollments de la classe
  → Pour chaque étudiant :
    1. initiate() si pas encore de ReportCard
    2. generatePdf()
  → Dispatch event BulletinsGenerated (pour notifications)

Timeout : 300 secondes (génération PDF peut être longue)
Tries : 3

## VUE BLADE PDF : resources/views/pdf/report_card.blade.php

Créer le template HTML du bulletin scolaire ivoirien avec CSS inline.
Utiliser des variables passées depuis collectBulletinData().

Structure du HTML :
```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <style>
    /* CSS inline — DomPDF ne supporte pas toutes les features CSS */
    /* Utiliser : tables, divs simples, pas de flexbox/grid */
    /* Police recommandée : DejaVu Sans (supporte accents français) */
    body { font-family: DejaVu Sans; font-size: 10px; color: #1a1a1a; }
    .header { text-align: center; border-bottom: 2px solid #2563eb; }
    .school-name { font-size: 16px; font-weight: bold; }
    .bulletin-title { font-size: 14px; color: #2563eb; margin: 8px 0; }
    .student-info table { width: 100%; font-size: 9px; }
    .grades-table { width: 100%; border-collapse: collapse; margin: 10px 0; }
    .grades-table th { background: #2563eb; color: white; padding: 4px; }
    .grades-table td { border: 1px solid #ddd; padding: 3px; text-align: center; }
    .pass { background: #dcfce7; }
    .fail { background: #fee2e2; }
    .average-row { background: #f0f9ff; font-weight: bold; }
    .footer { position: fixed; bottom: 0; width: 100%; font-size: 8px; }
  </style>
</head>
<body>

  <!-- EN-TÊTE -->
  <div class="header">
    @if($school['logo_url'])
      <img src="{{ $school['logo_url'] }}" height="60" />
    @endif
    <div class="school-name">{{ $school['name'] }}</div>
    <div>{{ $school['address'] }} — Tél: {{ $school['phone'] }}</div>
    <div class="bulletin-title">
      BULLETIN DE NOTES —
      @if($period) {{ strtoupper($period['name']) }} @else BILAN ANNUEL @endif
      — {{ $academic_year['name'] }}
    </div>
  </div>

  <!-- INFOS ÉLÈVE -->
  <table class="student-info" style="margin: 10px 0;">
    <tr>
      <td><strong>Nom & Prénom :</strong> {{ $student['full_name'] }}</td>
      <td><strong>Matricule :</strong> {{ $student['matricule'] }}</td>
      <td><strong>Classe :</strong> {{ $classe['display_name'] }}</td>
    </tr>
    <tr>
      <td><strong>Date de naissance :</strong> {{ $student['birth_date'] }}</td>
      <td><strong>Lieu :</strong> {{ $student['birth_place'] }}</td>
      <td><strong>Professeur principal :</strong> {{ $classe['main_teacher_name'] }}</td>
    </tr>
  </table>

  <!-- TABLEAU DES NOTES -->
  @if bulletin de période
  <table class="grades-table">
    <thead>
      <tr>
        <th style="width:25%; text-align:left;">Matière</th>
        <th style="width:8%;">Coeff</th>
        <th style="width:10%;">Moy/20</th>
        <th style="width:8%;">Rang</th>
        <th style="width:10%;">Moy cl.</th>
        <th style="width:8%;">Min</th>
        <th style="width:8%;">Max</th>
        <th style="width:23%; text-align:left;">Appréciation</th>
      </tr>
    </thead>
    <tbody>
      @foreach($subjects as $s)
      <tr class="{{ $s['is_passing'] ? 'pass' : 'fail' }}">
        <td style="text-align:left;">{{ $s['name'] }}</td>
        <td>{{ $s['coefficient'] }}</td>
        <td><strong>{{ $s['period_average'] ?? '—' }}</strong></td>
        <td>{{ $s['rank'] ?? '—' }}/{{ $stats['class_size'] }}</td>
        <td>{{ $s['class_average'] ?? '—' }}</td>
        <td>{{ $s['min_score'] ?? '—' }}</td>
        <td>{{ $s['max_score'] ?? '—' }}</td>
        <td style="text-align:left; font-size:8px;">{{ $s['appreciation'] ?? '' }}</td>
      </tr>
      @endforeach
      <!-- Ligne moyenne générale -->
      <tr class="average-row">
        <td colspan="2" style="text-align:left;">MOYENNE GÉNÉRALE</td>
        <td><strong>{{ $stats['general_average'] ?? '—' }}/20</strong></td>
        <td>{{ $stats['general_rank'] ?? '—' }}/{{ $stats['class_size'] }}</td>
        <td>{{ $stats['class_average'] ?? '—' }}</td>
        <td colspan="3"></td>
      </tr>
    </tbody>
  </table>

  @else /* Bulletin annuel */
  ... colonnes avec Trim1/Trim2/Trim3/Annuel
  @endif

  <!-- ABSENCES & DÉCISION -->
  <table style="width:100%; margin-top:8px;">
    <tr>
      <td style="width:40%;">
        <strong>Absences :</strong>
        Justifiées : {{ $stats['absences_justified'] }}h |
        Non justifiées : {{ $stats['absences_unjustified'] }}h
      </td>
      <td style="width:60%;">
        <strong>Appréciation du Conseil de Classe :</strong>
        {{ $stats['general_appreciation'] ?? '—' }}
      </td>
    </tr>
    @if($stats['council_decision'])
    <tr>
      <td colspan="2" style="text-align:center; font-size:12px; padding:6px;">
        <strong>DÉCISION : {{ strtoupper($stats['council_decision_label']) }}</strong>
        @if($stats['honor_mention'])
          — {{ strtoupper($stats['honor_mention_label']) }}
        @endif
      </td>
    </tr>
    @endif
  </table>

  <!-- SIGNATURES -->
  <table style="width:100%; margin-top:20px;">
    <tr>
      <td style="width:33%; text-align:center;">
        Le Professeur Principal<br><br><br>
        ___________________
      </td>
      <td style="width:33%; text-align:center;">
        Signature des Parents<br><br><br>
        ___________________
      </td>
      <td style="width:33%; text-align:center;">
        Le Directeur<br>
        {{ $school['director_name'] ?? '' }}<br><br>
        ___________________<br>
        [Cachet de l'établissement]
      </td>
    </tr>
  </table>

  <!-- PIED DE PAGE -->
  <div class="footer">
    <hr>
    {{ $school['name'] }} | {{ $school['address'] }} |
    Généré le {{ $generated_at }}
  </div>

</body>
</html>
```

NB : Adapter le template pour le bulletin ANNUEL avec colonnes
     Trim1 | Trim2 | Trim3 | Annuel selon period_type de l'AcademicYear.

## COMMANDES DE TEST (tinker)

$rcService = app(App\Services\ReportCardService::class);

// Initier un bulletin
$rc = $rcService->initiate(enrollmentId: 1, periodId: 1, type: 'period');

// Sauvegarder une appréciation
$rcService->saveAppreciation($rc, subjectId: 1, 'Excellent travail', auth()->user());

// Collecter les données
$data = $rcService->collectBulletinData($rc);
dd($data['subjects']); // vérifier les notes

// Générer le PDF
$rc = $rcService->generatePdf($rc);
$rc->pdf_path // → "tenant_demo/bulletins/2024-2025/trim-1/2024COL00001.pdf"
$rc->status   // → ReportCardStatus::Generated

// Publier
$rcService->publish($rc, auth()->user());
```

---

## SESSION 7.3 — Controllers + Resources + Routes

```
## CONTEXTE PROJET — ENMA SCHOOL

Stack : PHP 8.3 / Laravel 12
Conventions : strict_types=1, Trait ApiResponse, Form Requests, Resources

Phase 7 Sessions 1 & 2 terminées ✅

## GÉNÈRE LES API RESOURCES

### ReportCardResource.php
{
  id,
  type: { value, label },
  status: { value, label, color },
  general_average (float|null),
  general_rank (int|null),
  class_size (int|null),
  class_average (float|null),
  absences_justified, absences_unjustified,
  general_appreciation (string|null),
  council_decision: { value, label, color } | null,
  honor_mention: { value, label, color } | null,
  has_pdf: bool,
  pdf_url: string|null,          // URL de téléchargement si PDF existe
  pdf_generated_at: string|null, // formaté
  published_at: string|null,
  is_editable: bool,             // accessor

  // Relations
  student: StudentListResource (whenLoaded),
  classe: { id, display_name, level_label } (whenLoaded),
  period: { id, name, order } | null (whenLoaded),
  academic_year: { id, name } (whenLoaded),
  appreciations: ReportCardAppreciationResource[] (whenLoaded),
  generated_by: { id, full_name } | null (whenLoaded),
  published_by: { id, full_name } | null (whenLoaded),

  created_at, updated_at,
}

### ReportCardAppreciationResource.php
{
  id, appreciation,
  subject: SubjectResource (whenLoaded),
  teacher: { id, full_name } | null (whenLoaded),
  entered_by: { id, full_name } (whenLoaded),
  created_at,
}

### BulletinPreviewResource.php
{
  // Données pour la prévisualisation avant génération PDF
  report_card: ReportCardResource,
  bulletin_data: array, // résultat de collectBulletinData()
}

### ClassBulletinsStatsResource.php
{
  classe: { id, display_name },
  period: { id, name } | null,
  total_students: int,
  draft: int,
  generated: int,
  published: int,
  missing: int,       // enrolled mais pas de report_card
  completion_rate: float,
}

## GÉNÈRE LES FORM REQUESTS

### InitiateReportCardRequest
  enrollment_id    : required, exists:enrollments,id
  period_id        : nullable, exists:periods,id
  type             : required, in: ReportCardType cases
  Validation métier :
    → Si type=period, period_id obligatoire
    → Si type=annual, period_id doit être null
    → Pas de doublon (UNIQUE enrollment+period+type)

### InitiateClassReportCardsRequest
  class_id         : required, exists:classes,id
  period_id        : nullable, exists:periods,id
  type             : required, in: ReportCardType cases

### UpdateCouncilDataRequest
  general_appreciation : nullable, string, max:500
  council_decision     : nullable, in: CouncilDecision cases
  honor_mention        : nullable, in: HonorMention cases
  Validation :
    → Si honor_mention présent, council_decision doit être 'honor'

### BulkAppreciationsRequest
  appreciations       : required, array
  appreciations.*.subject_id    : required, exists:subjects,id
  appreciations.*.appreciation  : required, string, max:300

## GÉNÈRE LES CONTROLLERS

### ReportCardController

index() → GET /school/report-cards
  filtres : student_id, class_id, period_id, year_id, type, status
  → permission: report_cards.view
  → eager load : student, classe, period
  → ReportCardResource paginé

store() → POST /school/report-cards
  → permission: report_cards.generate
  → InitiateReportCardRequest
  → Crée le bulletin en statut draft

initiateForClass() → POST /school/report-cards/class
  → permission: report_cards.generate
  → InitiateClassReportCardsRequest
  → Crée les bulletins en draft pour toute la classe
  → Retourne stats : { created: int, already_exists: int }

show() → GET /school/report-cards/{reportCard}
  → permission: report_cards.view
  → load : student, classe, period, appreciations.subject,
            generated_by, published_by
  → ReportCardResource

preview() → GET /school/report-cards/{reportCard}/preview
  → permission: report_cards.view
  → Retourne les données du bulletin sans générer le PDF
  → BulletinPreviewResource
  → Utile pour vérifier avant génération

updateCouncil() → PUT /school/report-cards/{reportCard}/council
  → permission: report_cards.generate
  → Vérifie rc->isEditable()
  → UpdateCouncilDataRequest

saveAppreciations() → PUT /school/report-cards/{reportCard}/appreciations
  → permission: report_cards.generate
  → BulkAppreciationsRequest

generate() → POST /school/report-cards/{reportCard}/generate
  → permission: report_cards.generate
  → Génère le PDF pour UN bulletin
  → Retourne ReportCardResource avec pdf_url

generateForClass() → POST /school/report-cards/generate-class
  → permission: report_cards.generate
  → body: { class_id, period_id, type }
  → Dispatch GenerateBulletinsJob en queue
  → Retourne { message: "Génération lancée pour X élèves" }

download() → GET /school/report-cards/{reportCard}/download
  → permission: report_cards.view
  → Vérifie hasPdf() → 404 sinon
  → Retourne le fichier PDF en streaming (force download)
  → Content-Disposition: attachment; filename="bulletin_{matricule}_{period}.pdf"

publish() → POST /school/report-cards/{reportCard}/publish
  → permission: report_cards.publish

publishForClass() → POST /school/report-cards/publish-class
  → permission: report_cards.publish
  → body: { class_id, period_id }
  → Publie tous les bulletins generated d'une classe
  → Retourne { published: int }

classStats() → GET /school/report-cards/class-stats
  → permission: report_cards.view
  → params: class_id, period_id
  → ClassBulletinsStatsResource

destroy() → DELETE /school/report-cards/{reportCard}
  → permission: report_cards.generate
  → Interdit si Published
  → Supprime le PDF + la row

## ROUTES

Route::middleware(['auth:sanctum', 'tenant.active'])->group(function () {
  Route::prefix('school')->group(function () {

    // ── Bulletins ──────────────────────────────────────
    Route::get('report-cards/class-stats', [ReportCardController::class, 'classStats'])
         ->middleware('can:report_cards.view');
    Route::post('report-cards/class', [ReportCardController::class, 'initiateForClass'])
         ->middleware('can:report_cards.generate');
    Route::post('report-cards/generate-class', [ReportCardController::class, 'generateForClass'])
         ->middleware('can:report_cards.generate');
    Route::post('report-cards/publish-class', [ReportCardController::class, 'publishForClass'])
         ->middleware('can:report_cards.publish');

    Route::apiResource('report-cards', ReportCardController::class)
         ->only(['index', 'store', 'show', 'destroy']);
    Route::get('report-cards/{reportCard}/preview', [ReportCardController::class, 'preview'])
         ->middleware('can:report_cards.view');
    Route::put('report-cards/{reportCard}/council', [ReportCardController::class, 'updateCouncil'])
         ->middleware('can:report_cards.generate');
    Route::put('report-cards/{reportCard}/appreciations', [ReportCardController::class, 'saveAppreciations'])
         ->middleware('can:report_cards.generate');
    Route::post('report-cards/{reportCard}/generate', [ReportCardController::class, 'generate'])
         ->middleware('can:report_cards.generate');
    Route::get('report-cards/{reportCard}/download', [ReportCardController::class, 'download'])
         ->middleware('can:report_cards.view');
    Route::post('report-cards/{reportCard}/publish', [ReportCardController::class, 'publish'])
         ->middleware('can:report_cards.publish');
  });
});

## TESTS HOPPSCOTCH

// 1. Initier les bulletins d'une classe
POST /api/school/report-cards/class
{ "class_id": 1, "period_id": 1, "type": "period" }
→ { "created": 35, "already_exists": 0 }

// 2. Sauvegarder les appréciations
PUT /api/school/report-cards/1/appreciations
{
  "appreciations": [
    { "subject_id": 1, "appreciation": "Très bon travail, continue ainsi" },
    { "subject_id": 2, "appreciation": "Des efforts à fournir en géométrie" }
  ]
}

// 3. Sauvegarder la décision du conseil
PUT /api/school/report-cards/1/council
{
  "general_appreciation": "Élève sérieux, bons résultats d'ensemble",
  "council_decision": "pass",
  "honor_mention": null
}

// 4. Prévisualiser
GET /api/school/report-cards/1/preview
→ BulletinPreviewResource avec toutes les données structurées

// 5. Générer le PDF
POST /api/school/report-cards/1/generate
→ { ..., "has_pdf": true, "pdf_url": "http://...", "status": "generated" }

// 6. Télécharger
GET /api/school/report-cards/1/download
→ Fichier PDF en streaming (Content-Disposition: attachment)

// 7. Publier pour toute la classe
POST /api/school/report-cards/publish-class
{ "class_id": 1, "period_id": 1 }
→ { "published": 35 }

// 8. Stats
GET /api/school/report-cards/class-stats?class_id=1&period_id=1
→ { total: 35, draft: 0, generated: 35, published: 35, missing: 0, completion_rate: 100 }
```

---

## SESSION 7.4 — Frontend : Types + API + Hooks

```
## CONTEXTE PROJET — ENMA SCHOOL

Stack : React 18 + TypeScript 5, TanStack Query v5
Types existants : school.types.ts, students.types.ts, grades.types.ts

Phase 7 Sessions 1-3 terminées ✅

## GÉNÈRE LES FICHIERS SUIVANTS

### src/modules/school/types/reportCards.types.ts

export type ReportCardType = 'period' | 'annual';
export type ReportCardStatus = 'draft' | 'generated' | 'published' | 'archived';
export type CouncilDecision =
  'pass' | 'repeat' | 'conditional' | 'transfer' | 'excluded' | 'honor';
export type HonorMention = 'encouragements' | 'compliments' | 'felicitations';

export const COUNCIL_DECISION_LABELS: Record<CouncilDecision, string> = {
  pass: 'Admis(e) en classe supérieure',
  repeat: 'Redouble',
  conditional: 'Passage conditionnel',
  transfer: 'Orienté(e)',
  excluded: 'Exclu(e)',
  honor: 'Admis(e) avec mention',
};

export const COUNCIL_DECISION_COLORS: Record<CouncilDecision, string> = {
  pass: 'green', repeat: 'red', conditional: 'orange',
  transfer: 'blue', excluded: 'red', honor: 'purple',
};

export const HONOR_MENTION_LABELS: Record<HonorMention, string> = {
  encouragements: 'Encouragements',
  compliments: 'Compliments',
  felicitations: 'Félicitations',
};

export interface ReportCard {
  id: number;
  type: { value: ReportCardType; label: string };
  status: { value: ReportCardStatus; label: string; color: string };
  general_average: number | null;
  general_rank: number | null;
  class_size: number | null;
  class_average: number | null;
  absences_justified: number;
  absences_unjustified: number;
  general_appreciation: string | null;
  council_decision: { value: CouncilDecision; label: string; color: string } | null;
  honor_mention: { value: HonorMention; label: string; color: string } | null;
  has_pdf: boolean;
  pdf_url: string | null;
  pdf_generated_at: string | null;
  published_at: string | null;
  is_editable: boolean;
  student?: StudentListItem;
  classe?: { id: number; display_name: string; level_label: string };
  period?: { id: number; name: string; order: number } | null;
  academic_year?: { id: number; name: string };
  appreciations?: ReportCardAppreciation[];
  generated_by?: { id: number; full_name: string } | null;
  published_by?: { id: number; full_name: string } | null;
  created_at: string;
}

export interface ReportCardAppreciation {
  id: number;
  appreciation: string;
  subject?: Subject;
  teacher?: { id: number; full_name: string } | null;
  entered_by?: { id: number; full_name: string };
  created_at: string;
}

export interface ClassBulletinsStats {
  classe: { id: number; display_name: string };
  period: { id: number; name: string } | null;
  total_students: number;
  draft: number;
  generated: number;
  published: number;
  missing: number;
  completion_rate: number;
}

export interface CouncilFormData {
  general_appreciation?: string;
  council_decision?: CouncilDecision | null;
  honor_mention?: HonorMention | null;
}

export interface AppreciationEntry {
  subject_id: number;
  appreciation: string;
}

### src/modules/school/api/reportCards.api.ts

import { apiClient } from '@/shared/lib/axios';

export const reportCardsApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<PaginatedResponse<ReportCard>>('/school/report-cards', { params }),
  getOne: (id: number) =>
    apiClient.get<ApiSuccess<ReportCard>>(`/school/report-cards/${id}`),
  getClassStats: (classeId: number, periodId?: number) =>
    apiClient.get<ApiSuccess<ClassBulletinsStats>>('/school/report-cards/class-stats',
      { params: { class_id: classeId, period_id: periodId } }),
  initiate: (data: { enrollment_id: number; period_id?: number; type: ReportCardType }) =>
    apiClient.post<ApiSuccess<ReportCard>>('/school/report-cards', data),
  initiateForClass: (data: { class_id: number; period_id?: number; type: ReportCardType }) =>
    apiClient.post<ApiSuccess<{ created: number; already_exists: number }>>
      ('/school/report-cards/class', data),
  preview: (id: number) =>
    apiClient.get<ApiSuccess<unknown>>(`/school/report-cards/${id}/preview`),
  updateCouncil: (id: number, data: CouncilFormData) =>
    apiClient.put<ApiSuccess<ReportCard>>(`/school/report-cards/${id}/council`, data),
  saveAppreciations: (id: number, appreciations: AppreciationEntry[]) =>
    apiClient.put<ApiSuccess<void>>(`/school/report-cards/${id}/appreciations`,
      { appreciations }),
  generate: (id: number) =>
    apiClient.post<ApiSuccess<ReportCard>>(`/school/report-cards/${id}/generate`),
  generateForClass: (data: { class_id: number; period_id?: number; type: ReportCardType }) =>
    apiClient.post<ApiSuccess<{ message: string }>>('/school/report-cards/generate-class', data),
  download: (id: number) =>
    apiClient.get(`/school/report-cards/${id}/download`, { responseType: 'blob' }),
  publish: (id: number) =>
    apiClient.post<ApiSuccess<ReportCard>>(`/school/report-cards/${id}/publish`),
  publishForClass: (data: { class_id: number; period_id?: number }) =>
    apiClient.post<ApiSuccess<{ published: number }>>('/school/report-cards/publish-class', data),
  delete: (id: number) =>
    apiClient.delete(`/school/report-cards/${id}`),
};

### src/modules/school/hooks/useReportCards.ts

// Hooks TanStack Query
useReportCards(filters)           → useQuery key: ['report-cards', filters]
useReportCard(id)                 → useQuery key: ['report-card', id]
useClassBulletinsStats(classeId, periodId)
                                  → useQuery key: ['bulletins-stats', classeId, periodId]
useInitiateReportCard()           → useMutation + invalidate ['report-cards']
useInitiateClassReportCards()     → useMutation + invalidate ['report-cards', 'bulletins-stats']
useUpdateCouncil()                → useMutation + invalidate ['report-card', id]
useSaveAppreciations()            → useMutation + invalidate ['report-card', id]
useGenerateReportCard()           → useMutation + invalidate ['report-card', id]
useGenerateForClass()             → useMutation + invalidate ['bulletins-stats']
usePublishReportCard()            → useMutation + invalidate ['report-card', id]
usePublishForClass()              → useMutation + invalidate ['bulletins-stats', 'report-cards']
useDownloadReportCard()           → mutation (télécharge le blob PDF)
useDeleteReportCard()             → useMutation + invalidate ['report-cards']

### src/modules/school/lib/reportCardHelpers.ts

export function getStatusColor(status: ReportCardStatus): string { ... }
export function getStatusLabel(status: ReportCardStatus): string { ... }
export function getDecisionColor(decision: CouncilDecision): string { ... }
export function getDecisionLabel(decision: CouncilDecision): string { ... }
export function isDecisionPositive(decision: CouncilDecision): boolean {
  return ['pass', 'conditional', 'honor'].includes(decision);
}
export function formatBulletinTitle(rc: ReportCard): string {
  // "Bulletin 1er Trimestre 2024-2025" ou "Bulletin Annuel 2024-2025"
  const period = rc.period ? rc.period.name : 'Annuel';
  return `Bulletin ${period} ${rc.academic_year?.name ?? ''}`;
}
export function downloadBlobAsPdf(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
```

---

## SESSION 7.5 — Frontend Pages

```
## CONTEXTE PROJET — ENMA SCHOOL

Stack : React 18 + TypeScript 5, Tailwind + shadcn/ui, TanStack Query v5
Types, API, Hooks créés en Session 7.4 ✅

## GÉNÈRE LES PAGES ET COMPOSANTS

### 1. ReportCardsPage.tsx — Page principale des bulletins

URL : /school/report-cards

HEADER :
  Titre "Bulletins Scolaires"
  Sélecteurs : Année scolaire | Période | Classe
  Boutons : [Initier les bulletins] [Générer en masse] [Publier en masse]

STATS RAPIDES (ClassBulletinsStats) :
  ┌──────────┬───────────┬───────────┬─────────┬───────────┐
  │ 35 total │ 2 brouil. │ 30 générés│ 3 publiés│ 0 manquant│
  └──────────┴───────────┴───────────┴─────────┴───────────┘
  Barre de progression : taux de complétion (35/35 = 100%)

TABLEAU DES BULLETINS :
  Colonnes : Élève | Classe | Période | Moy. Gén. | Rang | Statut | Décision | Actions

  ACTIONS par bulletin :
    Draft     → [Éditer appréciations] [Générer PDF] [Supprimer]
    Generated → [Voir] [Télécharger] [Publier] [Re-générer]
    Published → [Voir] [Télécharger] (lecture seule)

### 2. ReportCardEditorPage.tsx — Édition d'un bulletin

URL : /school/report-cards/:id/edit

PAGE CENTRALE — Saisie des appréciations et décisions avant génération PDF.

LAYOUT EN 2 COLONNES :
  Colonne gauche (60%) : Tableau des appréciations par matière
  Colonne droite (40%) : Infos élève + Décision du conseil + Actions

COLONNE GAUCHE — Tableau des appréciations :
  ┌────────────────┬───────┬───────┬─────────────────────────────────────┐
  │ Matière        │ Coeff │ Moy.  │ Appréciation                        │
  ├────────────────┼───────┼───────┼─────────────────────────────────────┤
  │ Mathématiques  │  4    │ 14.33 │ [Bon travail, progrès en algèbre...] │
  │ Français       │  3    │ 11.50 │ [Doit améliorer l'expression écrit.] │
  │ Histoire-Géo   │  2    │ 12.00 │ [Travail satisfaisant              ] │
  └────────────────┴───────┴───────┴─────────────────────────────────────┘
  → Chaque champ appréciation : textarea inline, max 300 chars
  → Compteur caractères visible
  → Sauvegarde auto (debounce 2000ms)

  RACCOURCIS D'APPRÉCIATIONS (suggestions rapides) :
  Boutons pré-remplis cliquables :
  [Excellent] [Très bien] [Bien] [Assez bien] [Peut mieux faire]
  [Des efforts à fournir] [Travail insuffisant]
  → Clic = insère le texte dans le champ actif

COLONNE DROITE — Infos & Décision :

  CARD ÉLÈVE :
    Photo | Nom | Matricule | Classe | Moy. Générale | Rang

  CARD ABSENCES :
    Justifiées: X | Non justifiées: Y
    → Champs éditables (remplis depuis les données présences Phase 9,
      ou saisis manuellement pour l'instant)

  CARD DÉCISION DU CONSEIL :
    Appréciation générale : [textarea, max 500 chars]

    Décision :
    ○ Admis(e) en classe supérieure  ← default si moy >= passing_avg
    ○ Redouble                        ← default si moy < passing_avg
    ○ Passage conditionnel
    ○ Orienté(e)
    ○ Exclu(e)
    ○ Admis(e) avec mention → affiche sélecteur mention

    Mention (si "Avec mention") :
    ○ Encouragements (moy >= 12)
    ○ Compliments (moy >= 14)
    ○ Félicitations (moy >= 16)

  BOUTONS D'ACTION :
    [💾 Sauvegarder] [👁 Prévisualiser] [📄 Générer PDF]

### 3. ReportCardPreviewModal.tsx — Prévisualisation avant génération

Modal plein écran affichant une version HTML du bulletin
avant de générer le PDF.

Utilise les données de l'endpoint preview (BulletinPreviewResource).
Rendu côté React avec le même layout que le PDF
(mais version responsive pour écran).

Boutons : [Fermer] [Générer le PDF →]

### 4. BulkActionsPanel.tsx — Panneau d'actions en masse

Composant utilisé dans ReportCardsPage pour les actions groupées.

ÉTAPES AFFICHÉES :
  Étape 1 : Initier — [Initier pour toute la classe]
             → Crée les bulletins draft pour les élèves sans bulletin
  Étape 2 : Appréciations — Stats: X/35 appréciations saisies
             → Lien vers chaque bulletin pour saisie individuelle
  Étape 3 : Générer — [🚀 Générer tous les PDFs]
             → Dispatch le job, affiche une barre de progression
  Étape 4 : Vérifier — Liste des bulletins pour review
             → Badges statut pour chaque élève
  Étape 5 : Publier — [📢 Publier tous les bulletins]
             → Confirmation avant publication

### 5. StudentReportCardsTab.tsx — Onglet Bulletins dans StudentDetailPage

Mise à jour de la StudentDetailPage (Phase 4) :
Remplace le placeholder "Disponible Phase 7".

AFFICHAGE :
  Liste de tous les bulletins de l'élève, groupés par année scolaire :

  📅 2024-2025
    ├── 1er Trimestre — Moy: 13.25 — Rang: 5/35 — [✅ Publié] [⬇ Télécharger]
    ├── 2ème Trimestre — Moy: 14.00 — Rang: 3/35 — [✅ Publié] [⬇ Télécharger]
    ├── 3ème Trimestre — [⏳ En cours] —
    └── Annuel — [—]

  📅 2023-2024
    ├── 1er Trim. — Moy: 11.50 — [✅ Publié] [⬇ Télécharger]
    └── Annuel — Décision: Admis — [✅ Publié] [⬇ Télécharger]

### 6. BulletinStatusBadge.tsx

Props: { status: ReportCardStatus }
→ Draft (gris) | Généré (bleu) | Publié (vert) | Archivé (orange)

### 7. CouncilDecisionBadge.tsx

Props: { decision: CouncilDecision | null; mention?: HonorMention | null }
→ "Admis ✓" (vert) | "Redouble ✗" (rouge) | "Félicitations ⭐" (violet)

### 8. BulletinCompletionWidget.tsx

Composant tableau de bord (utilisable aussi en Phase 12).
Props: { stats: ClassBulletinsStats }
→ Barre de progression par étape (Initié → Édité → Généré → Publié)
→ Chiffres par statut
→ Bouton d'action contextuel selon l'étape bloquante

## NAVIGATION (mise à jour)

Ajouter dans navigation.ts :
  /school/report-cards              → ReportCardsPage     (icône: FileText)
  /school/report-cards/:id/edit     → ReportCardEditorPage

## RÈGLES UX IMPORTANTES

1. La sauvegarde des appréciations est auto (debounce 2000ms)
   → Pas de bouton "Enregistrer" pour les appréciations individuelles
   → AutoSaveIndicator visible en haut de la colonne

2. La décision du conseil est suggérée automatiquement :
   → moy >= passing_average → "Admis" présélectionné
   → moy < passing_average → "Redouble" présélectionné
   → L'admin peut changer

3. Le PDF ne peut pas être téléchargé si not has_pdf
   → Le bouton est désactivé avec tooltip "PDF non encore généré"

4. Un bulletin publié affiche un badge "🔒 Verrouillé"
   → Tous les champs sont en lecture seule

5. Progression de génération en masse :
   → Après dispatch du job, afficher un polling toutes les 3 secondes
   → Actualiser les stats jusqu'à ce que generated = total
```

---

## RÉCAPITULATIF PHASE 7

| Session | Contenu | Fichiers clés |
|---------|---------|---------------|
| 7.1 | Migrations | `report_cards`, `report_card_appreciations` |
| 7.2 | Enums + Models + Services + Job + Template Blade | `ReportCard`, `ReportCardService`, `PdfGeneratorService`, `GenerateBulletinsJob`, `report_card.blade.php` |
| 7.3 | Controllers + Resources + Routes | `ReportCardController`, `ReportCardResource`, `ClassBulletinsStatsResource` |
| 7.4 | Frontend Types + API + Hooks | `reportCards.types.ts`, `reportCards.api.ts`, `useReportCards.ts` |
| 7.5 | Frontend Pages + Composants | `ReportCardsPage`, `ReportCardEditorPage`, `BulkActionsPanel` (workflow 5 étapes) |

---

### Points d'attention critiques

1. **Template Blade DomPDF** — utiliser uniquement CSS compatible :
   pas de flexbox/grid → tables uniquement, police DejaVu Sans pour les accents

2. **Contrainte UNIQUE bulletin annuel** — PostgreSQL traite NULL différemment dans UNIQUE
   → ajouter un index partiel pour le cas `period_id IS NULL AND type = 'annual'`

3. **Snapshot des données** — les moyennes sont copiées dans `report_cards` au moment
   de la génération → le PDF reste correct même si les notes changent après

4. **Stockage PDF** — chemin : `storage/app/tenant_{slug}/bulletins/{year}/{period}/{matricule}.pdf`
   → s'assurer que le dossier est créé avant écriture (Storage::makeDirectory)

5. **Bulletin publié = verrouillé** — validé CÔTÉ SERVEUR dans chaque méthode du Service
   → ne pas se fier uniquement au frontend

6. **Mise à jour Phase 4** — `StudentDetailPage` : remplacer le placeholder
   "Bulletins — Disponible Phase 7" par `StudentReportCardsTab`
