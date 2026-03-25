# ENMA SCHOOL — PROMPTS PHASE 12
## Rapports & Dashboard Analytics

---

> ## PÉRIMÈTRE DE LA PHASE 12
>
> **Objectif :** Fournir des tableaux de bord analytiques et des rapports
> exportables qui synthétisent les données de toutes les phases précédentes
> pour aider l'administration à piloter l'établissement.
>
> **Cette phase ne crée PAS de nouvelles tables.**
> Elle agrège les données existantes via :
> - Des **queries optimisées** avec mise en cache Redis
> - Des **exports Excel/CSV** (Maatwebsite/Laravel-Excel — déjà dans le stack)
> - Des **graphiques interactifs** (Recharts — déjà dans le stack)
> - Des **rapports PDF** récapitulatifs (DomPDF — déjà dans le stack)
>
> **Dashboards prévus :**
> | Dashboard | Public cible | Données |
> |-----------|-------------|---------|
> | Direction | school_admin / director | Vue globale école |
> | Académique | director / teacher | Notes, moyennes, résultats |
> | Présences | director / staff | Absences, retards, taux |
> | Financier | accountant / director | Paiements, recouvrement |
> | Enseignant | teacher | Ses classes uniquement |
>
> **HORS PÉRIMÈTRE Phase 12 :**
> - Business Intelligence avancée → V2
> - Comparaison inter-années automatique → V2
> - Prédiction de performance → V2
>
> **Dépendances requises :**
> - Toutes les phases 0-11 ✅

---

## SESSION 12.1 — Services de Reporting (Backend)

```
## CONTEXTE PROJET — ENMA SCHOOL

Stack : PHP 8.3 / Laravel 12 / PostgreSQL 18
Cache : Redis (déjà configuré)
Export : Maatwebsite/Laravel-Excel (déjà installé)
PDF : barryvdh/laravel-dompdf (déjà installé)

Toutes les phases 0-11 sont terminées.

## CETTE SESSION — Phase 12 : Services de Reporting

Pas de nouvelles migrations — uniquement des Services, Exports et Jobs.

## GÉNÈRE LES SERVICES SUIVANTS

### DashboardService.php

Objectif : agréger les KPIs principaux pour les différents dashboards.
           Toutes les méthodes utilisent Cache::remember() avec TTL adapté.

// ── Dashboard Direction ────────────────────────────────────

getDirectionStats(int $yearId) : array
  Cache TTL : 300 secondes (5 minutes)
  Cache key : "dashboard_direction_{tenantId}_{yearId}"

  Retourne :
  {
    school: {
      name, logo_url, academic_year_name,
      school_types: string,     // "Primaire + Collège"
    },
    students: {
      total: int,               // élèves inscrits cette année
      active: int,
      by_gender: { male: int, female: int },
      by_category: { maternelle: int, primaire: int, college: int, lycee: int },
      new_this_month: int,
      trend: float,             // % évolution vs mois précédent
    },
    staff: {
      total: int,               // users actifs (hors student/parent)
      teachers: int,
      by_role: { school_admin, director, teacher, accountant, staff },
    },
    academic: {
      classes_count: int,
      subjects_count: int,
      current_period: { id, name, type },
      periods_closed: int,
      periods_total: int,
    },
    attendance: {
      today_rate: float | null,  // taux présence du jour (si saisi)
      week_rate: float,           // taux semaine courante
      at_risk_students: int,
    },
    finance: {
      collection_rate: float,    // % frais collectés
      total_collected: float,
      total_remaining: float,
      overdue_count: int,        // élèves avec frais en retard
    },
    bulletins: {
      total: int,
      published: int,
      pending: int,
    },
    recent_activity: [           // 10 dernières activités (activity_logs)
      { type, description, created_at }
    ],
  }

// ── Dashboard Académique ──────────────────────────────────

getAcademicStats(int $yearId, ?int $periodId = null) : array
  Cache TTL : 600 secondes
  Cache key : "dashboard_academic_{tenantId}_{yearId}_{periodId}"

  Retourne :
  {
    period: Period | null,
    overall: {
      avg_general: float | null,     // moyenne générale de toutes les classes
      passing_rate: float,            // % élèves >= passing_average
      top_classe: { display_name, average } | null,
      lowest_classe: { display_name, average } | null,
    },
    by_level: [                        // par niveau scolaire
      {
        level: { label, category },
        classes_count: int,
        students_count: int,
        avg_general: float | null,
        passing_rate: float,
      }
    ],
    by_classe: [                       // par classe
      {
        classe: { id, display_name },
        students_count: int,
        avg_general: float | null,
        passing_rate: float,
        best_subject: { name, average } | null,
        worst_subject: { name, average } | null,
      }
    ],
    by_subject: [                      // moyennes par matière (toutes classes)
      {
        subject: { id, name, code, color },
        avg: float | null,
        passing_rate: float,
        classes_count: int,
      }
    ],
    grade_distribution: {             // distribution des moyennes générales
      "0-5": int, "5-10": int, "10-12": int,
      "12-14": int, "14-16": int, "16-20": int,
    },
    evaluations_this_period: int,
  }

// ── Dashboard Présences ────────────────────────────────────

getAttendanceStats(int $yearId, ?int $periodId = null, ?Carbon $date = null) : array
  Cache TTL : 120 secondes (données fréquemment mises à jour)
  Cache key : "dashboard_attendance_{tenantId}_{yearId}_{periodId}_{date}"

  Retourne :
  {
    today: {
      date: string,
      overall_rate: float | null,
      present: int, absent: int, late: int, excused: int, total: int,
      classes_with_record: int,
      classes_total: int,
    },
    period: {
      avg_rate: float,
      total_absent_hours: float,
      total_excused_hours: float,
      most_absent_class: { display_name, rate } | null,
      best_class: { display_name, rate } | null,
    },
    at_risk_students: [                // élèves sous le seuil (max 10)
      {
        student: { full_name, matricule },
        classe: string,
        attendance_rate: float,
        absent_hours: float,
      }
    ],
    by_day: [                         // taux par jour des 30 derniers jours
      { date: string, rate: float | null, recorded: bool }
    ],
    by_class: [
      {
        classe: { id, display_name },
        attendance_rate: float,
        at_risk_count: int,
      }
    ],
    justifications: {
      pending: int,
      approved_this_month: int,
    },
  }

// ── Dashboard Financier ────────────────────────────────────

getFinancialStats(int $yearId) : array
  Cache TTL : 300 secondes
  Cache key : "dashboard_financial_{tenantId}_{yearId}"

  Retourne :
  {
    summary: {
      total_expected: float,    // total XOF dû par tous les élèves
      total_collected: float,
      total_remaining: float,
      total_discounts: float,
      collection_rate: float,
      total_expected_formatted: string,
      total_collected_formatted: string,
      total_remaining_formatted: string,
    },
    by_status: {
      paid: { count: int, amount: float },
      partial: { count: int, amount_remaining: float },
      pending: { count: int, amount_remaining: float },
      overdue: { count: int, amount_remaining: float },
      waived: { count: int, amount: float },
    },
    by_fee_type: [
      {
        fee_type: { name, code },
        expected: float, collected: float, rate: float,
      }
    ],
    by_level: [
      {
        level: string,
        expected: float, collected: float, rate: float,
        students_count: int,
      }
    ],
    monthly_trend: [               // encaissements des 6 derniers mois
      { month: string, amount: float, payments_count: int }
    ],
    by_method: [                   // répartition par mode de paiement
      { method: string, amount: float, count: int, percentage: float }
    ],
    overdue_students: [            // top 10 élèves en retard
      {
        student: { full_name, matricule },
        classe: string,
        amount_remaining: float,
        amount_remaining_formatted: string,
        days_overdue: int,
      }
    ],
  }

// ── Dashboard Enseignant ──────────────────────────────────

getTeacherDashboard(int $teacherId, int $yearId) : array
  Cache TTL : 180 secondes
  Cache key : "dashboard_teacher_{teacherId}_{yearId}"

  Retourne :
  {
    teacher: { full_name, employee_number, weekly_hours, max_hours },
    classes: [
      {
        classe: { id, display_name },
        subject: { name, code, color },
        students_count: int,
        evaluations_count: int,
        avg_general: float | null,
        passing_rate: float,
        attendance_rate: float,
        next_evaluation: { title, date } | null,
      }
    ],
    this_week: {
      courses_count: int,
      total_hours: float,
      schedule: [                // cours de la semaine courante
        {
          day_label: string,
          time_range: string,
          classe: string,
          subject: string,
          room: string | null,
          is_cancelled: bool,
        }
      ]
    },
    recent_grades: [             // 10 dernières évaluations saisies
      { evaluation_title, classe, date, avg_score }
    ],
    pending_actions: {
      evaluations_to_lock: int,  // évaluations non verrouillées
      absences_to_record: int,   // appels non faits aujourd'hui
    },
  }

// ── Invalidation du cache ─────────────────────────────────

invalidateDashboardCache(string $key = 'all') : void
  → 'all' → vider tous les caches dashboard du tenant
  → key spécifique → vider seulement ce cache
  → Appelé depuis les services après mutation des données importantes

### ReportService.php

Objectif : générer des rapports exportables (Excel, CSV, PDF).

// ── Rapports élèves ───────────────────────────────────────

getStudentsReport(int $yearId, array $filters = []) : array
  filtres : level_category, classe_id, status, gender
  → Données pour export Excel des élèves
  → Colonnes : Matricule, Nom, Prénom, Date naissance, Genre,
               Classe, Niveau, Nationalité, Statut, Parent 1 (nom + tel)

getStudentResultsReport(int $yearId, int $periodId) : array
  → Résultats académiques de tous les élèves
  → Colonnes : Matricule, Nom, Classe, + une colonne par matière (moyenne),
               Moyenne Générale, Rang, Décision

getAttendanceReport(int $yearId, ?int $periodId, ?int $classeId) : array
  → Rapport d'absences détaillé
  → Par élève : Nom, Classe, Heures absence, Heures justifiées,
                Heures non justifiées, Taux présence

getPaymentsReport(int $yearId, array $filters = []) : array
  filtres : date_from, date_to, method, status, classe_id
  → Rapport financier
  → Colonnes : Reçu N°, Date, Élève, Classe, Type frais,
               Montant, Mode paiement, Saisi par

// ── Export Excel (Maatwebsite/Laravel-Excel) ──────────────

exportStudents(int $yearId, array $filters = []) : BinaryFileResponse
exportResults(int $yearId, int $periodId) : BinaryFileResponse
exportAttendance(int $yearId, int $periodId, ?int $classeId) : BinaryFileResponse
exportPayments(int $yearId, array $filters = []) : BinaryFileResponse

Chaque export utilise une classe Export dédiée :
  StudentsExport.php
  ResultsExport.php
  AttendanceExport.php
  PaymentsExport.php

Ces classes implémentent :
  implements FromCollection, WithHeadings, WithStyles,
             WithColumnWidths, ShouldAutoSize

// ── Rapport PDF récapitulatif ─────────────────────────────

generateYearSummaryPdf(int $yearId) : string
  → PDF de synthèse annuelle de l'école
  → Sections : Effectifs, Résultats académiques, Présences, Finance
  → Template : resources/views/pdf/year_summary.blade.php
  → Retourne le chemin du fichier

generateClassResultsPdf(int $classeId, int $periodId) : string
  → PDF du tableau des résultats d'une classe
  → Liste élèves avec toutes leurs moyennes + rangs
  → Template : resources/views/pdf/class_results.blade.php

## EXPORTS EXCEL — Classes de base

### StudentsExport.php
app/Exports/StudentsExport.php

implements FromCollection, WithHeadings, WithMapping,
           WithStyles, ShouldAutoSize, WithTitle

collection() : Collection
  → Student::with(['enrollments.classe.level', 'parents'])
            ->whereHas('enrollments', fn($q) => $q->where('academic_year_id', $yearId))
            ->filter($filters)->get()

headings() : array
  → ['Matricule', 'Nom', 'Prénom', 'Date Naissance', 'Genre',
     'Classe', 'Niveau', 'Catégorie', 'Nationalité', 'Statut',
     'Parent 1 - Nom', 'Parent 1 - Tél', 'Parent 2 - Nom', 'Parent 2 - Tél']

map($student) : array
  → Transformer chaque student en row de données

styles(Worksheet $sheet) : array
  → Header : fond bleu (#2563eb), texte blanc, gras
  → Lignes alternées : fond gris clair (#f3f4f6)

### ResultsExport.php, AttendanceExport.php, PaymentsExport.php
(Même pattern — adapter les colonnes selon le rapport)

## VUE BLADE PDF : resources/views/pdf/class_results.blade.php

Template HTML du tableau de résultats d'une classe :

Structure :
  - En-tête : école, classe, période, année scolaire
  - Tableau :
    | # | Nom & Prénom | Coeff × Matière... | Moy. Gén. | Rang | Décision |
    - Une colonne par matière avec coefficient
    - Ligne de pied : Moyenne classe, Min, Max
  - Statistiques : taux de réussite, effectif, nb mentions
  - Signature directeur

## JOB : GenerateYearSummaryJob.php

Queue : 'reports'
Payload : year_id, requested_by_user_id

handle() :
  → app(ReportService::class)->generateYearSummaryPdf($yearId)
  → Notifier l'utilisateur que le rapport est prêt
  → notifyService->notify(userId, 'report_ready', ['download_url' => ...])

## COMMANDES DE TEST (tinker)

$dashService = app(App\Services\DashboardService::class);

// Dashboard direction
$stats = $dashService->getDirectionStats(1);
dump($stats['students']['total']);     // nb élèves
dump($stats['finance']['collection_rate']); // taux recouvrement

// Dashboard académique
$academic = $dashService->getAcademicStats(yearId: 1, periodId: 1);
dump($academic['overall']['avg_general']); // moyenne générale
dump($academic['grade_distribution']);     // distribution

// Dashboard financier
$finance = $dashService->getFinancialStats(1);
dump($finance['summary']['collection_rate']); // %

// Dashboard enseignant
$teacher = $dashService->getTeacherDashboard(teacherId: 1, yearId: 1);
dump($teacher['classes']); // classes + stats

// Test cache : appel 2x → 2ème depuis Redis
Cache::tags(['dashboard'])->flush();
$dashService->getDirectionStats(1); // requête DB
$dashService->getDirectionStats(1); // depuis cache Redis

// Export
$reportService = app(App\Services\ReportService::class);
$data = $reportService->getStudentsReport(yearId: 1);
count($data); // → nb élèves exportés
```

---

## SESSION 12.2 — Controllers + Resources + Routes

```
## CONTEXTE PROJET — ENMA SCHOOL

Stack : PHP 8.3 / Laravel 12
Conventions : strict_types=1, Trait ApiResponse, Form Requests, Resources

Phase 12 Session 1 terminée : Services + Exports ✅

## GÉNÈRE LES API RESOURCES

### DirectionDashboardResource.php
{
  school: { name, logo_url, academic_year_name, school_types },
  students: { total, active, by_gender, by_category, new_this_month, trend },
  staff: { total, teachers, by_role },
  academic: { classes_count, current_period, periods_closed, periods_total },
  attendance: { today_rate, week_rate, at_risk_students },
  finance: { collection_rate, total_collected_formatted, total_remaining_formatted, overdue_count },
  bulletins: { total, published, pending },
  recent_activity: [{ type, description, created_at }],
  generated_at: string,
  cache_ttl: int,
}

### AcademicDashboardResource.php
{
  period: { id, name } | null,
  overall: { avg_general, passing_rate, top_classe, lowest_classe },
  by_level: [...],
  by_classe: [...],
  by_subject: [...],
  grade_distribution: { "0-5": int, ... },
  evaluations_this_period: int,
  generated_at: string,
}

### AttendanceDashboardResource.php
{
  today: { date, overall_rate, present, absent, late, excused, total },
  period: { avg_rate, total_absent_hours, most_absent_class, best_class },
  at_risk_students: [...],
  by_day: [{ date, rate, recorded }],
  by_class: [...],
  justifications: { pending, approved_this_month },
  generated_at: string,
}

### FinancialDashboardResource.php
{
  summary: { total_expected_formatted, total_collected_formatted,
             total_remaining_formatted, collection_rate },
  by_status: { paid, partial, pending, overdue, waived },
  by_fee_type: [...],
  by_level: [...],
  monthly_trend: [{ month, amount, payments_count }],
  by_method: [...],
  overdue_students: [...],
  generated_at: string,
}

### TeacherDashboardResource.php
{
  teacher: { full_name, employee_number, weekly_hours, max_hours },
  classes: [...],
  this_week: { courses_count, total_hours, schedule: [...] },
  recent_grades: [...],
  pending_actions: { evaluations_to_lock, absences_to_record },
  generated_at: string,
}

## GÉNÈRE LES CONTROLLERS

### DashboardController

direction() → GET /school/dashboard/direction
  → permission: reports.view
  → rôles autorisés : school_admin, director
  → DirectionDashboardResource

academic() → GET /school/dashboard/academic
  params: year_id, period_id (nullable)
  → permission: reports.view
  → rôles autorisés : school_admin, director, teacher (ses classes seulement)
  → AcademicDashboardResource

attendance() → GET /school/dashboard/attendance
  params: year_id, period_id, date
  → permission: attendance.reports
  → AttendanceDashboardResource

financial() → GET /school/dashboard/financial
  params: year_id
  → permission: payments.reports
  → rôles : school_admin, director, accountant
  → FinancialDashboardResource

teacher() → GET /school/dashboard/teacher
  params: year_id
  → Automatiquement filtré sur auth()->user()->teacherProfile
  → permission: grades.view (enseignant lui-même)
  → TeacherDashboardResource

### ReportController

// Exports Excel
exportStudents() → GET /school/reports/students/export
  params: year_id, level_category, classe_id, status
  → permission: reports.export
  → Stream du fichier Excel

exportResults() → GET /school/reports/results/export
  params: year_id, period_id, classe_id
  → permission: reports.export

exportAttendance() → GET /school/reports/attendance/export
  params: year_id, period_id, classe_id
  → permission: reports.export + attendance.reports

exportPayments() → GET /school/reports/payments/export
  params: year_id, date_from, date_to, method, status
  → permission: reports.export + payments.reports

// PDF
generateClassResults() → POST /school/reports/class-results
  body: { class_id, period_id }
  → permission: reports.export
  → Stream PDF du tableau de résultats

generateYearSummary() → POST /school/reports/year-summary
  body: { year_id }
  → permission: reports.export + role:school_admin,director
  → dispatch GenerateYearSummaryJob (queue)
  → 202 Accepted : { message: "Rapport en cours de génération. Vous serez notifié." }

// Invalidation cache
invalidateCache() → POST /school/dashboard/cache/invalidate
  → permission: role:school_admin
  → Vider les caches dashboard du tenant

## ROUTES

Route::middleware(['auth:sanctum','tenant.active'])->group(function () {
  Route::prefix('school')->group(function () {

    // ── Dashboards ─────────────────────────────────────
    Route::get('dashboard/direction', [DashboardController::class, 'direction'])
         ->middleware('role:school_admin,director');
    Route::get('dashboard/academic', [DashboardController::class, 'academic'])
         ->middleware('can:reports.view');
    Route::get('dashboard/attendance', [DashboardController::class, 'attendance'])
         ->middleware('can:attendance.reports');
    Route::get('dashboard/financial', [DashboardController::class, 'financial'])
         ->middleware('can:payments.reports');
    Route::get('dashboard/teacher', [DashboardController::class, 'teacher'])
         ->middleware('role:teacher');
    Route::post('dashboard/cache/invalidate',
         [DashboardController::class, 'invalidateCache'])
         ->middleware('role:school_admin');

    // ── Exports & Rapports ─────────────────────────────
    Route::get('reports/students/export', [ReportController::class, 'exportStudents'])
         ->middleware('can:reports.export');
    Route::get('reports/results/export', [ReportController::class, 'exportResults'])
         ->middleware('can:reports.export');
    Route::get('reports/attendance/export', [ReportController::class, 'exportAttendance'])
         ->middleware('can:reports.export');
    Route::get('reports/payments/export', [ReportController::class, 'exportPayments'])
         ->middleware('can:reports.export');
    Route::post('reports/class-results', [ReportController::class, 'generateClassResults'])
         ->middleware('can:reports.export');
    Route::post('reports/year-summary', [ReportController::class, 'generateYearSummary'])
         ->middleware('role:school_admin,director');
  });
});

## TESTS HOPPSCOTCH

// Dashboard direction
GET /api/school/dashboard/direction?year_id=1
→ JSON complet avec tous les KPIs

// Dashboard académique
GET /api/school/dashboard/academic?year_id=1&period_id=1
→ Moyennes, distributions, par classe, par matière

// Dashboard financier
GET /api/school/dashboard/financial?year_id=1
→ collection_rate, by_method, monthly_trend...

// Dashboard enseignant (connecté en tant que teacher)
GET /api/school/dashboard/teacher?year_id=1
→ Ses classes, son emploi du temps semaine, ses actions en attente

// Export Excel élèves
GET /api/school/reports/students/export?year_id=1
→ Fichier XLSX (Content-Disposition: attachment; filename=eleves-2024-2025.xlsx)

// Export résultats
GET /api/school/reports/results/export?year_id=1&period_id=1
→ Fichier XLSX avec toutes les moyennes

// PDF résultats d'une classe
POST /api/school/reports/class-results
{ "class_id": 1, "period_id": 1 }
→ Stream PDF "Tableau des résultats — 6ème 1 — 1er Trimestre"

// Synthèse annuelle (async)
POST /api/school/reports/year-summary
{ "year_id": 1 }
→ 202 { "message": "Rapport en cours de génération..." }
→ Notification Push quand prêt
```

---

## SESSION 12.3 — Frontend : Types + API + Hooks

```
## CONTEXTE PROJET — ENMA SCHOOL

Stack : React 18 + TypeScript 5, TanStack Query v5
Graphiques : Recharts (déjà dans le stack)
Types existants : toutes les phases précédentes

Phase 12 Sessions 1-2 terminées ✅

## GÉNÈRE LES FICHIERS SUIVANTS

### src/modules/school/types/dashboard.types.ts

export interface DirectionDashboard {
  school: {
    name: string; logo_url: string | null;
    academic_year_name: string; school_types: string;
  };
  students: {
    total: number; active: number;
    by_gender: { male: number; female: number };
    by_category: Record<string, number>;
    new_this_month: number; trend: number;
  };
  staff: {
    total: number; teachers: number;
    by_role: Record<string, number>;
  };
  academic: {
    classes_count: number; subjects_count: number;
    current_period: { id: number; name: string; type: string } | null;
    periods_closed: number; periods_total: number;
  };
  attendance: {
    today_rate: number | null; week_rate: number; at_risk_students: number;
  };
  finance: {
    collection_rate: number; total_collected_formatted: string;
    total_remaining_formatted: string; overdue_count: number;
  };
  bulletins: { total: number; published: number; pending: number };
  recent_activity: Array<{ type: string; description: string; created_at: string }>;
  generated_at: string; cache_ttl: number;
}

export interface AcademicDashboard {
  period: { id: number; name: string } | null;
  overall: {
    avg_general: number | null; passing_rate: number;
    top_classe: { display_name: string; average: number } | null;
    lowest_classe: { display_name: string; average: number } | null;
  };
  by_level: Array<{
    level: { label: string; category: string };
    classes_count: number; students_count: number;
    avg_general: number | null; passing_rate: number;
  }>;
  by_classe: Array<{
    classe: { id: number; display_name: string };
    students_count: number; avg_general: number | null; passing_rate: number;
    best_subject: { name: string; average: number } | null;
    worst_subject: { name: string; average: number } | null;
  }>;
  by_subject: Array<{
    subject: { id: number; name: string; code: string; color: string };
    avg: number | null; passing_rate: number; classes_count: number;
  }>;
  grade_distribution: Record<string, number>;
  evaluations_this_period: number;
  generated_at: string;
}

export interface AttendanceDashboard {
  today: {
    date: string; overall_rate: number | null;
    present: number; absent: number; late: number; excused: number; total: number;
  };
  period: {
    avg_rate: number; total_absent_hours: number; total_excused_hours: number;
    most_absent_class: { display_name: string; rate: number } | null;
    best_class: { display_name: string; rate: number } | null;
  };
  at_risk_students: Array<{
    student: { full_name: string; matricule: string };
    classe: string; attendance_rate: number; absent_hours: number;
  }>;
  by_day: Array<{ date: string; rate: number | null; recorded: boolean }>;
  by_class: Array<{
    classe: { id: number; display_name: string };
    attendance_rate: number; at_risk_count: number;
  }>;
  justifications: { pending: number; approved_this_month: number };
  generated_at: string;
}

export interface FinancialDashboard {
  summary: {
    total_expected_formatted: string; total_collected_formatted: string;
    total_remaining_formatted: string; collection_rate: number;
  };
  by_status: Record<string, { count: number; amount?: number; amount_remaining?: number }>;
  by_fee_type: Array<{
    fee_type: { name: string; code: string };
    expected: number; collected: number; rate: number;
  }>;
  by_level: Array<{
    level: string; expected: number; collected: number;
    rate: number; students_count: number;
  }>;
  monthly_trend: Array<{ month: string; amount: number; payments_count: number }>;
  by_method: Array<{ method: string; amount: number; count: number; percentage: number }>;
  overdue_students: Array<{
    student: { full_name: string; matricule: string };
    classe: string; amount_remaining_formatted: string; days_overdue: number;
  }>;
  generated_at: string;
}

export interface TeacherDashboard {
  teacher: {
    full_name: string; employee_number: string | null;
    weekly_hours: number; max_hours: number;
  };
  classes: Array<{
    classe: { id: number; display_name: string };
    subject: { name: string; code: string; color: string };
    students_count: number; evaluations_count: number;
    avg_general: number | null; passing_rate: number; attendance_rate: number;
    next_evaluation: { title: string; date: string } | null;
  }>;
  this_week: {
    courses_count: number; total_hours: number;
    schedule: Array<{
      day_label: string; time_range: string;
      classe: string; subject: string; room: string | null; is_cancelled: boolean;
    }>;
  };
  recent_grades: Array<{
    evaluation_title: string; classe: string; date: string; avg_score: number | null;
  }>;
  pending_actions: { evaluations_to_lock: number; absences_to_record: number };
  generated_at: string;
}

### src/modules/school/api/dashboard.api.ts

import { apiClient } from '@/shared/lib/axios';

export const dashboardApi = {
  getDirection: (yearId: number) =>
    apiClient.get<ApiSuccess<DirectionDashboard>>(
      '/school/dashboard/direction', { params: { year_id: yearId } }),

  getAcademic: (yearId: number, periodId?: number) =>
    apiClient.get<ApiSuccess<AcademicDashboard>>(
      '/school/dashboard/academic', { params: { year_id: yearId, period_id: periodId } }),

  getAttendance: (yearId: number, periodId?: number, date?: string) =>
    apiClient.get<ApiSuccess<AttendanceDashboard>>(
      '/school/dashboard/attendance', { params: { year_id: yearId, period_id: periodId, date } }),

  getFinancial: (yearId: number) =>
    apiClient.get<ApiSuccess<FinancialDashboard>>(
      '/school/dashboard/financial', { params: { year_id: yearId } }),

  getTeacher: (yearId: number) =>
    apiClient.get<ApiSuccess<TeacherDashboard>>(
      '/school/dashboard/teacher', { params: { year_id: yearId } }),

  invalidateCache: () =>
    apiClient.post('/school/dashboard/cache/invalidate'),
};

export const reportsApi = {
  exportStudents: (params: Record<string, unknown>) =>
    apiClient.get('/school/reports/students/export',
      { params, responseType: 'blob' }),
  exportResults: (params: Record<string, unknown>) =>
    apiClient.get('/school/reports/results/export',
      { params, responseType: 'blob' }),
  exportAttendance: (params: Record<string, unknown>) =>
    apiClient.get('/school/reports/attendance/export',
      { params, responseType: 'blob' }),
  exportPayments: (params: Record<string, unknown>) =>
    apiClient.get('/school/reports/payments/export',
      { params, responseType: 'blob' }),
  generateClassResults: (classId: number, periodId: number) =>
    apiClient.post('/school/reports/class-results',
      { class_id: classId, period_id: periodId }, { responseType: 'blob' }),
  generateYearSummary: (yearId: number) =>
    apiClient.post<ApiSuccess<{ message: string }>>(
      '/school/reports/year-summary', { year_id: yearId }),
};

### src/modules/school/hooks/useDashboard.ts

// Dashboards — staleTime élevé (données mises en cache côté serveur)
useDirectionDashboard(yearId)
  → useQuery key: ['dashboard-direction', yearId]
  → staleTime: 5 * 60 * 1000  // 5 minutes
  → refetchInterval: 5 * 60 * 1000

useAcademicDashboard(yearId, periodId?)
  → useQuery key: ['dashboard-academic', yearId, periodId]
  → staleTime: 10 * 60 * 1000

useAttendanceDashboard(yearId, periodId?, date?)
  → useQuery key: ['dashboard-attendance', yearId, periodId, date]
  → staleTime: 2 * 60 * 1000  // 2 minutes (données fréquentes)
  → refetchInterval: 2 * 60 * 1000

useFinancialDashboard(yearId)
  → useQuery key: ['dashboard-financial', yearId]
  → staleTime: 5 * 60 * 1000

useTeacherDashboard(yearId)
  → useQuery key: ['dashboard-teacher', yearId]
  → staleTime: 3 * 60 * 1000

useInvalidateDashboardCache()
  → useMutation + invalidate ALL dashboard queries

// Exports — pas de cache (toujours frais)
useExportStudents()    → useMutation (télécharge blob XLSX)
useExportResults()     → useMutation
useExportAttendance()  → useMutation
useExportPayments()    → useMutation
useGenerateClassResults() → useMutation (télécharge blob PDF)
useGenerateYearSummary()  → useMutation (async, notification quand prêt)

### src/modules/school/lib/dashboardHelpers.ts

import { format, subMonths, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

export function downloadExcelBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadPdfBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

export function formatTrend(trend: number): string {
  if (trend > 0) return `+${trend.toFixed(1)}%`;
  return `${trend.toFixed(1)}%`;
}

export function getTrendColor(trend: number): string {
  if (trend > 0) return 'text-green-600';
  if (trend < 0) return 'text-red-600';
  return 'text-gray-500';
}

export function getPassingRateColor(rate: number): string {
  if (rate >= 80) return '#16a34a'; // green
  if (rate >= 60) return '#d97706'; // orange
  return '#dc2626'; // red
}

export function getCollectionRateColor(rate: number): string {
  if (rate >= 75) return '#16a34a';
  if (rate >= 50) return '#d97706';
  return '#dc2626';
}

export function formatMonthLabel(monthStr: string): string {
  // "2025-01" → "Jan. 25"
  return format(parseISO(`${monthStr}-01`), 'MMM yy', { locale: fr });
}

// Couleurs pour les graphiques (palette Recharts cohérente)
export const CHART_COLORS = {
  primary: '#2563eb',   blue
  success: '#16a34a',   green
  warning: '#d97706',   orange
  danger: '#dc2626',    red
  info: '#0891b2',      cyan
  purple: '#7c3aed',
  pink: '#db2777',
  gray: '#6b7280',
};

export const GENDER_COLORS = {
  male: '#3b82f6',
  female: '#ec4899',
};

export const GRADE_DIST_COLORS = {
  '0-5': '#ef4444', '5-10': '#f97316',
  '10-12': '#eab308', '12-14': '#84cc16',
  '14-16': '#22c55e', '16-20': '#10b981',
};
```

---

## SESSION 12.4 — Frontend Pages (Dashboards)

```
## CONTEXTE PROJET — ENMA SCHOOL

Stack : React 18 + TypeScript 5, Tailwind + shadcn/ui
Graphiques : Recharts
Types, API, Hooks créés en Session 12.3 ✅

## GÉNÈRE LES PAGES ET COMPOSANTS

### 1. DashboardPage.tsx — Page d'accueil principale

URL : /school/dashboard (page d'accueil après login)

ROUTING selon le rôle :
  school_admin / director → DirectionDashboardPage
  teacher                 → TeacherDashboardPage
  accountant              → FinancialDashboardPage
  staff                   → Résumé simple (élèves + présences du jour)

### 2. DirectionDashboardPage.tsx

URL : /school/dashboard/direction

LAYOUT GRID 4 colonnes :

ROW 1 — KPI Cards (4 cards) :
  ┌──────────────┬──────────────┬──────────────┬──────────────┐
  │ 245          │ 12           │ 91.5%        │ 58.3%        │
  │ Élèves       │ Enseignants  │ Présence/sem │ Recouvrement │
  │ ↑ +3 ce mois │ actifs       │ ●vert        │ ●orange      │
  └──────────────┴──────────────┴──────────────┴──────────────┘

ROW 2 — Graphiques (2 colonnes) :
  Colonne gauche (6/12) :
    PieChart — Répartition élèves par niveau (maternelle/primaire/collège/lycée)
    Couleurs CHART_COLORS
  Colonne droite (6/12) :
    BarChart — Répartition genre par niveau
    Bars : bleu (garçons) / rose (filles)

ROW 3 — Progression académique (12) :
  ProgressCards par classe :
    - Moyenne générale (barre + valeur)
    - Taux de réussite (%)
    - Badge top/bottom classe

ROW 4 — Informations (2 colonnes) :
  Colonne gauche (6/12) :
    Card "État des bulletins" avec BulletinsProgressWidget
  Colonne droite (6/12) :
    Card "Activité récente" : liste des 10 derniers activity_logs

HEADER :
  "Tableau de bord — {school_name}"
  Sélecteur : Année scolaire
  Bouton [↻ Actualiser] + badge "Mis à jour il y a 3 min"
  Bouton [🗑 Vider le cache] (school_admin seulement)

### 3. AcademicDashboardPage.tsx

URL : /school/dashboard/academic

HEADER :
  Sélecteurs : Année scolaire | Période (Trim. 1/2/3 ou Annuel)

ROW 1 — KPI académiques :
  Moyenne générale | Taux de réussite | Nb évaluations | Nb classes

ROW 2 — Distribution des notes :
  BarChart horizontal "Distribution des moyennes générales"
  Barres colorées : rouge (0-5), orange (5-10), jaune (10-12),
                    vert clair (12-14), vert (14-16), vert foncé (16-20)

ROW 3 — Tableau par classe :
  DataTable : Classe | Effectif | Moy. Gén. | Taux réussite | Meilleure matière | Pire matière
  Tri possible sur chaque colonne

ROW 4 — Performances par matière :
  BarChart horizontal : Matière → Moyenne (coloré selon la matière)
  Ligne rouge à passing_average

### 4. AttendanceDashboardPage.tsx

URL : /school/dashboard/attendance

ROW 1 — KPI présences :
  Taux aujourd'hui | Taux semaine | Élèves à risque | Justifications en attente

ROW 2 — Calendrier 30 jours :
  AttendanceCalendarWidget (réutilisé Phase 9) sur toute la largeur
  Filtre : [Toutes les classes] ou sélecteur de classe

ROW 3 — Graphiques (2 colonnes) :
  Gauche : LineChart "Évolution du taux de présence (30 derniers jours)"
  Droite : BarChart "Présences du jour par classe"

ROW 4 — Élèves à risque :
  DataTable : Élève | Classe | Taux présence | Heures absence
  Badge rouge "⚠️ À risque" + lien vers le dossier élève

### 5. FinancialDashboardPage.tsx

URL : /school/dashboard/financial

ROW 1 — KPI financiers :
  Total attendu | Total collecté | Reste à percevoir | Taux recouvrement

  Grande barre de progression colorée :
  ████████████████░░░░░░░░ 68.5% collecté

ROW 2 — Graphiques (2 colonnes) :
  Gauche : BarChart "Recouvrement par type de frais"
  Droite : PieChart "Répartition par mode de paiement"

ROW 3 — Tendance mensuelle :
  AreaChart "Encaissements des 6 derniers mois" (AreaChart Recharts)
  Axe Y : montants en FCFA (avec formatXOF)

ROW 4 — Recouvrement par niveau :
  DataTable : Niveau | Attendu | Collecté | Taux | Barre progression

ROW 5 — Élèves en retard (top 10) :
  DataTable : Élève | Classe | Montant restant | Jours retard
  Bouton [Contacter] (future Phase 11 — notification)

### 6. TeacherDashboardPage.tsx

URL : /school/dashboard/teacher

ROW 1 — KPI enseignant :
  Charge horaire (WorkloadGauge — réutilisé Phase 5) |
  Nb classes | Actions en attente | Prochain cours

ROW 2 — Planning de la semaine :
  Vue compacte TimetableGridView (réutilisé Phase 8)
  Semaine courante, vue lecture seule

ROW 3 — Mes classes (cards) :
  Pour chaque classe affectée :
    ClassCard avec : display_name, matière, nb élèves,
    moyenne, taux réussite, taux présence, prochain cours

ROW 4 — Actions en attente (si pendingActions > 0) :
  ⚠️ "2 évaluations à verrouiller" → [Voir les évaluations]
  ⚠️ "1 appel non fait aujourd'hui" → [Faire l'appel]

## GÉNÈRE LES WIDGETS RÉUTILISABLES

### KpiCard.tsx
Props: {
  title: string; value: string | number; unit?: string;
  trend?: number; trendLabel?: string;
  icon?: string; color?: string;
  onClick?: fn; loading?: boolean;
}
→ Card avec valeur principale, tendance (↑↓ %) et icône
→ Skeleton loading si loading = true
→ Cliquer → navigate vers la page détail

### GradeDistributionChart.tsx
Props: { distribution: Record<string, number>; passingAverage?: number }
→ BarChart Recharts avec couleurs GRADE_DIST_COLORS
→ Ligne de référence rouge à passing_average

### AttendanceTrendChart.tsx
Props: { data: Array<{ date: string; rate: number | null; recorded: boolean }> }
→ LineChart Recharts 30 jours
→ Points non enregistrés grisés

### MonthlyRevenueChart.tsx
Props: { data: Array<{ month: string; amount: number; payments_count: number }> }
→ AreaChart Recharts
→ Axe Y avec formatXOF

### CollectionRateGauge.tsx
Props: { rate: number; collected: string; remaining: string }
→ Grande barre de progression avec pourcentage
→ Couleur dynamique selon taux

### RecentActivityFeed.tsx
Props: { activities: Array<{ type: string; description: string; created_at: string }> }
→ Feed de la dernière activité avec icônes par type

### PassingRateChart.tsx
Props: { data: Array<{ name: string; rate: number; avg: number }>; type: 'by_class'|'by_subject' }
→ BarChart horizontal avec couleur selon le taux

### DashboardRefreshInfo.tsx
Props: { generatedAt: string; cacheTtl: number; onRefresh: fn }
→ "Données du 13 Jan 2025 à 14:32 — Mis à jour dans 3 min [↻]"
→ Progress bar du cache TTL

## NAVIGATION (mise à jour)

Modifier dans navigation.ts selon le rôle connecté :
  /school/dashboard             → DashboardPage (routeur de rôle)
  /school/dashboard/direction   → DirectionDashboardPage
  /school/dashboard/academic    → AcademicDashboardPage
  /school/dashboard/attendance  → AttendanceDashboardPage
  /school/dashboard/financial   → FinancialDashboardPage
  /school/dashboard/teacher     → TeacherDashboardPage

Onglets dans la Navbar (admin/directeur) :
  [🏠 Direction] [📊 Académique] [👁 Présences] [💰 Financier]
```

---

## SESSION 12.5 — Page Rapports & Exports

```
## CONTEXTE PROJET — ENMA SCHOOL

Stack : React 18 + TypeScript 5, Tailwind + shadcn/ui
Types, API, Hooks créés en Session 12.3 ✅
Dashboards créés en Session 12.4 ✅

## GÉNÈRE LA PAGE RAPPORTS

### 1. ReportsPage.tsx

URL : /school/reports

HEADER :
  Titre "Rapports & Exports"
  Sélecteur : Année scolaire (global à tous les rapports)

LAYOUT SECTIONS :

### Section 1 — Rapports Élèves

Card "📋 Liste des élèves"
  Filtres : Niveau | Classe | Statut | Genre
  Bouton [⬇ Télécharger Excel]
  → useExportStudents() → downloadExcelBlob()

### Section 2 — Rapports Académiques

Card "📊 Résultats académiques"
  Filtres : Période | Classe (optionnel)
  Bouton [⬇ Télécharger Excel (toutes les classes)]
  Bouton [📄 PDF tableau de résultats par classe]
    → sélecteur de classe → generateClassResults() → downloadPdfBlob()

Card "📈 Synthèse annuelle"
  → PDF complet de synthèse de l'année (async)
  Bouton [🚀 Générer la synthèse annuelle]
  → Confirmation ConfirmDialog
  → 202 Accepted → "Vous recevrez une notification quand le rapport sera prêt"
  → Badge de statut : "En cours de génération..." → "Prêt à télécharger"

### Section 3 — Rapports Présences

Card "📅 Rapport d'absences"
  Filtres : Période | Classe (optionnel)
  Bouton [⬇ Télécharger Excel]

### Section 4 — Rapports Financiers

Card "💰 Rapport des paiements"
  Filtres : Période de dates | Mode de paiement | Statut
  Bouton [⬇ Télécharger Excel]

Card "📊 État du recouvrement"
  → Rapport synthétique par classe + niveau
  Bouton [⬇ Télécharger Excel]

### 2. ExportButton.tsx — Composant générique

Props: {
  label: string;
  icon?: string;
  onExport: () => Promise<Blob>;
  filename: string;
  format: 'xlsx' | 'pdf' | 'csv';
  loading?: boolean;
}

→ Bouton avec icône ⬇
→ État loading : spinner + "Génération en cours..."
→ Succès : flash vert + téléchargement automatique
→ Erreur : toast rouge avec message

### 3. ReportFilterPanel.tsx — Panneau de filtres réutilisable

Props: {
  filters: ReportFilters;
  onChange: fn;
  options: { showPeriod, showClasse, showLevel, showDateRange, showMethod, showStatus };
}

→ Filtres configurables selon le type de rapport
→ Bouton [Réinitialiser les filtres]

## COMPOSANTS DE MISE À JOUR (autres pages)

### Mise à jour ClasseDetailPage (Phase 2)
Ajouter un onglet "Résultats" :
  → PassingRateChart pour la classe courante
  → Bouton [📄 PDF résultats]

### Mise à jour StudentDetailPage (Phase 4)
Ajouter dans l'onglet "Notes" un résumé graphique :
  → RadarChart Recharts des moyennes par matière
  → Comparaison avec la moyenne de la classe

## COMPOSANTS À CRÉER

1. RadarChart.tsx (pour le profil académique d'un élève)
   Props: { studentAverages: Array<{ subject: string; avg: number; classAvg: number }> }
   → RadarChart Recharts avec 2 séries : élève vs classe

2. ProgressRing.tsx
   Props: { percentage: number; size?: number; color?: string; label?: string }
   → Anneau SVG de progression pour les KPIs ronds

3. TrendIndicator.tsx
   Props: { value: number; suffix?: string }
   → "↑ +3.2%" (vert) ou "↓ -1.5%" (rouge)

4. EmptyDashboard.tsx
   Props: { message: string; action?: { label: string; href: string } }
   → État vide si pas de données pour l'année sélectionnée

5. DashboardSkeleton.tsx
   → Skeleton loading pour les dashboards (pendant le fetch)
   → Simule le layout avec des blocs gris animés

## NAVIGATION FINALE COMPLÈTE

```typescript
// navigation.ts — version finale complète Phase 12
const navigation: NavItem[] = [
  // ── Direction / Admin ─────────────────────────
  { label: 'Tableau de bord', href: '/school/dashboard', icon: 'LayoutDashboard',
    roles: ['school_admin', 'director'] },
  { label: 'Rapports', href: '/school/reports', icon: 'BarChart2',
    roles: ['school_admin', 'director', 'accountant'],
    permission: 'reports.view' },

  // ── Structure académique ───────────────────────
  { label: 'Années scolaires', href: '/school/academic-years', icon: 'CalendarDays',
    roles: ['school_admin', 'director'] },
  { label: 'Niveaux', href: '/school/levels', icon: 'Layers',
    roles: ['school_admin', 'director'] },
  { label: 'Classes', href: '/school/classes', icon: 'Users',
    roles: ['school_admin', 'director', 'staff'] },
  { label: 'Matières', href: '/school/subjects', icon: 'BookOpen',
    roles: ['school_admin', 'director'] },
  { label: 'Salles', href: '/school/rooms', icon: 'DoorOpen',
    roles: ['school_admin', 'director'] },

  // ── Personnes ─────────────────────────────────
  { label: 'Utilisateurs', href: '/school/users', icon: 'UserCog',
    roles: ['school_admin', 'director'], permission: 'users.view' },
  { label: 'Élèves', href: '/school/students', icon: 'GraduationCap',
    permission: 'students.view' },
  { label: 'Enseignants', href: '/school/teachers', icon: 'ChalkboardTeacher',
    permission: 'users.view' },

  // ── Pédagogie ─────────────────────────────────
  { label: 'Emploi du temps', href: '/school/timetable', icon: 'CalendarCheck',
    permission: 'timetable.view', module: 'timetable' },
  { label: 'Notes', href: '/school/grades', icon: 'ClipboardList',
    permission: 'grades.view' },
  { label: 'Bulletins', href: '/school/report-cards', icon: 'FileText',
    permission: 'report_cards.view' },
  { label: 'Présences', href: '/school/attendance', icon: 'UserCheck',
    permission: 'attendance.view', module: 'attendance' },

  // ── Gestion ───────────────────────────────────
  { label: 'Paiements', href: '/school/payments', icon: 'Wallet',
    permission: 'payments.view', module: 'payments' },
  { label: 'Messagerie', href: '/school/messaging', icon: 'MessageSquare',
    module: 'messaging' },
  { label: 'Annonces', href: '/school/announcements', icon: 'Megaphone',
    module: 'messaging' },

  // ── Config ────────────────────────────────────
  { label: 'Paramètres', href: '/school/settings', icon: 'Settings',
    roles: ['school_admin'] },
];
```

## RÈGLES UX IMPORTANTES

1. **Skeleton loading systématique** :
   → Chaque dashboard affiche DashboardSkeleton pendant le fetch initial
   → Ne jamais afficher une page blanche

2. **Refresh automatique** :
   → refetchInterval selon le dashboard (2-10 min)
   → Badge "Mis à jour il y a X min" + bouton [↻]
   → En cas d'erreur réseau → toast + bouton [Réessayer]

3. **Exports avec feedback** :
   → Bouton désactivé pendant la génération (état loading)
   → Téléchargement automatique du blob
   → Toast succès : "Fichier téléchargé ✓"
   → Toast erreur avec message du serveur

4. **Graphiques vides** :
   → Si pas de données → EmptyDashboard avec message explicatif
   → Jamais de graphique avec des données à 0 ou null non gérées

5. **Responsive pour tablette** :
   → Grilles 4 colonnes → 2 colonnes sur tablette (md:)
   → KPI cards empilées sur mobile
```

---

## RÉCAPITULATIF PHASE 12

| Session | Contenu | Fichiers clés |
|---------|---------|---------------|
| 12.1 | Services + Exports + Jobs | `DashboardService` (5 méthodes getXxxStats), `ReportService` (exports), `StudentsExport`, `ResultsExport`, `AttendanceExport`, `PaymentsExport`, `GenerateYearSummaryJob`, templates Blade PDF |
| 12.2 | Controllers + Resources + Routes | `DashboardController` (5 dashboards), `ReportController` (6 endpoints), 5 Resources Dashboard |
| 12.3 | Frontend Types + API + Hooks + Helpers | `dashboard.types.ts` (5 interfaces), `dashboard.api.ts`, `useDashboard.ts`, `dashboardHelpers.ts` (CHART_COLORS, formatMonthLabel) |
| 12.4 | Frontend Pages Dashboards | `DirectionDashboardPage`, `AcademicDashboardPage`, `AttendanceDashboardPage`, `FinancialDashboardPage`, `TeacherDashboardPage` + 8 widgets |
| 12.5 | Page Rapports + Exports + Navigation finale | `ReportsPage`, `ExportButton`, navigation complète Phase 12, `DashboardSkeleton`, `RadarChart` |

---

### Points d'attention critiques

1. **Pas de nouvelles migrations** — Phase 12 agrège uniquement les données
   existantes. Aucun `php artisan migrate` nécessaire.

2. **Cache Redis stratégique** — chaque méthode `getXxxStats()` utilise
   `Cache::remember()` avec des TTL différents selon la fréquence de mise à jour :
   - Présences : 2 min (données du jour)
   - Direction / Finance : 5 min
   - Académique : 10 min

3. **Invalidation du cache** — après chaque mutation importante (nouveau paiement,
   note saisie, appel fait...), les services respectifs doivent appeler
   `DashboardService::invalidateDashboardCache()` pour les données concernées

4. **Exports Excel en streaming** — utiliser `response()->streamDownload()` avec
   Maatwebsite/Excel pour les gros fichiers (pas de timeout)

5. **TeacherDashboardPage filtrée** — le teacher ne voit QUE ses données :
   ses classes, ses évaluations, son emploi du temps. Le service doit
   filtrer strictement sur `teacher_id = auth()->user()->teacherProfile->id`

6. **Navigation finale** — vérifier que tous les modules guards sont appliqués
   dans `navigation.ts` (timetable, attendance, payments, messaging)
   pour masquer les items de menu si le module est désactivé
