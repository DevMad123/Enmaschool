# ENMA SCHOOL — PROMPTS PHASE 10
## Frais Scolaires & Paiements

---

> ## PÉRIMÈTRE DE LA PHASE 10
>
> **Objectif :** Gérer les frais scolaires, les paiements des familles,
> les tranches de paiement, les relances et les reçus PDF.
>
> **Tables nouvelles :**
> | Table | Description |
> |-------|-------------|
> | `fee_types` | Types de frais (inscription, scolarité, cantine, transport...) |
> | `fee_schedules` | Grille tarifaire par niveau/catégorie pour une année |
> | `student_fees` | Frais dus par un élève pour l'année (détail par type) |
> | `payments` | Paiement effectué (montant, date, mode, reçu) |
> | `payment_installments` | Échéancier de paiement (tranches) |
>
> **Concepts clés :**
> - Un **fee_schedule** définit les montants à payer selon le niveau de l'élève
> - Un **student_fee** représente ce qu'un élève DOIT payer pour un type de frais
> - Un **payment** est un versement effectué (partiel ou total)
> - Un **installment** est une tranche d'échéancier planifiée
> - Le **solde** d'un élève = total dû - total payé
> - Les reçus de paiement sont générés en **PDF** (DomPDF)
> - Les frais sont en **XOF** (Franc CFA ivoirien)
> - Module protégé par `module:payments`
>
> **Modes de paiement courants en Côte d'Ivoire :**
>   Espèces, Mobile Money (Wave, Orange Money, MTN), Virement, Chèque
>
> **HORS PÉRIMÈTRE Phase 10 :**
> - Intégration API paiement en ligne → V2
> - Comptabilité générale → V2
> - Export comptable → Phase 12
>
> **Dépendances requises :**
> - Phase 2 ✅ (school_levels, classes, academic_years, school_settings)
> - Phase 4 ✅ (students, enrollments)

---

## SESSION 10.1 — Migrations

```
## CONTEXTE PROJET — ENMA SCHOOL

Stack : PHP 8.3 / Laravel 12 / PostgreSQL 18
Multi-tenant : stancl/tenancy v3 (schema-per-tenant)

Phases terminées :
- Phase 0-5 : Auth, SuperAdmin, Config École, Users, Élèves, Enseignants
- Phase 6-9 : Notes, Bulletins, Emploi du temps, Présences

Tables existantes utiles :
  students(id, matricule, first_name, last_name, ...)
  enrollments(id, student_id, classe_id, academic_year_id, is_active)
  classes(id, display_name, school_level_id, academic_year_id)
  school_levels(id, code, category, label, short_label, order)
  academic_years(id, name, is_current)

## CETTE SESSION — Phase 10 : Migrations

Toutes les migrations dans database/migrations/tenant/

## GÉNÈRE LES MIGRATIONS (dans l'ordre)

### 1. create_fee_types_table

Objectif : catégories de frais scolaires de l'école.
           Configurées une fois, réutilisées chaque année.

Colonnes :
  id
  name           (string) — ex: "Frais de scolarité", "Frais d'inscription",
                              "Cantine", "Transport", "Tenue scolaire"
  code           (string, unique) — ex: 'SCOLARITE', 'INSCRIPTION', 'CANTINE'
  description    (text, nullable)
  is_mandatory   (boolean, default:true)
                 true = obligatoire pour tous les élèves
                 false = optionnel (cantine, transport...)
  is_recurring   (boolean, default:true)
                 true = facturé chaque année
                 false = ponctuel (tenue scolaire, droit d'examen...)
  applies_to     (enum: all/maternelle/primaire/college/lycee, default:'all')
                 à quels niveaux ce frais s'applique
  order          (unsignedSmallInteger, default:0) — ordre d'affichage
  is_active      (boolean, default:true)
  timestamps

  Index : code (unique), is_mandatory, is_active

### 2. create_fee_schedules_table

Objectif : grille tarifaire par type de frais, par niveau scolaire
           et par année scolaire.
           Permet d'avoir des frais différents selon le niveau
           (ex: frais maternelle < primaire < collège).

Colonnes :
  id
  academic_year_id (foreignId → academic_years, cascadeOnDelete)
  fee_type_id      (foreignId → fee_types, cascadeOnDelete)
  school_level_id  (foreignId → school_levels, nullOnDelete, nullable)
                   NULL = tarif par défaut (s'applique à tous les niveaux
                   qui n'ont pas de tarif spécifique)
  amount           (decimal 12,2) — montant en XOF
                   ex: 150000.00 (150 000 FCFA)
  installments_allowed (boolean, default:true)
                   true = peut être payé en tranches
  max_installments (unsignedTinyInteger, default:3)
                   nombre maximal de tranches autorisées
  due_date         (date, nullable) — date limite de paiement
  notes            (text, nullable)
  timestamps

  UNIQUE(academic_year_id, fee_type_id, school_level_id)
  Index : academic_year_id, fee_type_id, school_level_id

### 3. create_student_fees_table

Objectif : frais individuels dus par un élève pour une année.
           Générés automatiquement à l'inscription (enrollment) de l'élève.

Colonnes :
  id
  enrollment_id    (foreignId → enrollments, cascadeOnDelete)
  fee_schedule_id  (foreignId → fee_schedules, nullOnDelete, nullable)
                   référence à la grille tarifaire appliquée
  fee_type_id      (foreignId → fee_types, cascadeOnDelete)
  academic_year_id (foreignId → academic_years, cascadeOnDelete)
  amount_due       (decimal 12,2) — montant dû (peut différer du schedule si remise)
  amount_paid      (decimal 12,2, default:0.00) — montant déjà payé
  discount_amount  (decimal 12,2, default:0.00) — remise accordée
  discount_reason  (string, nullable) — motif de la remise
  status           (enum: pending/partial/paid/overdue/waived)
                   pending  = aucun paiement
                   partial  = paiement partiel
                   paid     = soldé
                   overdue  = en retard (date limite dépassée)
                   waived   = exonéré (montant remis à 0)
  due_date         (date, nullable) — date limite
  notes            (text, nullable)
  created_by       (foreignId → users, nullOnDelete, nullable)
  timestamps

  UNIQUE(enrollment_id, fee_type_id)
  Index : enrollment_id, fee_type_id, academic_year_id, status

  Colonnes calculées (accessors dans le Model) :
    amount_remaining = amount_due - discount_amount - amount_paid
    is_paid = amount_remaining <= 0

### 4. create_payments_table

Objectif : enregistrement d'un versement effectué par une famille.

Colonnes :
  id
  student_fee_id   (foreignId → student_fees, cascadeOnDelete)
  enrollment_id    (foreignId → enrollments, cascadeOnDelete)
                   redondant mais utile pour les requêtes
  academic_year_id (foreignId → academic_years, cascadeOnDelete)
  receipt_number   (string, unique) — numéro de reçu auto-généré
                   format : {YEAR}-{SEQ_5DIGITS} ex: "2025-00042"
  amount           (decimal 12,2) — montant du versement
  payment_method   (enum: cash/wave/orange_money/mtn/bank_transfer/check/other)
  payment_date     (date)
  reference        (string, nullable) — référence transaction mobile money / chèque
  notes            (text, nullable)
  pdf_path         (string, nullable) — chemin vers le reçu PDF
  recorded_by      (foreignId → users, nullOnDelete, nullable)
  cancelled_at     (timestamp, nullable)
  cancelled_by     (foreignId → users, nullOnDelete, nullable)
  cancel_reason    (string, nullable)
  timestamps

  Index : student_fee_id, enrollment_id, payment_date, receipt_number (unique)
  Index : payment_method, payment_date

### 5. create_payment_installments_table

Objectif : échéancier de paiement planifié pour un student_fee.
           Permet de découper le paiement en plusieurs tranches à des dates données.

Colonnes :
  id
  student_fee_id   (foreignId → student_fees, cascadeOnDelete)
  installment_number (unsignedTinyInteger) — numéro de tranche (1, 2, 3)
  amount_due       (decimal 12,2) — montant de cette tranche
  due_date         (date) — date d'échéance
  amount_paid      (decimal 12,2, default:0.00)
  paid_at          (timestamp, nullable)
  status           (enum: pending/paid/overdue)
  timestamps

  UNIQUE(student_fee_id, installment_number)
  Index : student_fee_id, due_date, status

## RÈGLES MÉTIER (commentaires dans migrations)

1. UNIQUE(enrollment_id, fee_type_id) sur student_fees :
   → Un seul enregistrement par type de frais par élève par année
   → Mis à jour via updateOrCreate

2. Génération automatique des student_fees à l'inscription :
   → À la création d'un Enrollment, dispatche GenerateStudentFeesJob
   → Récupère tous les fee_schedules actifs pour cette année + niveau
   → Crée un student_fee pour chaque type applicable

3. amount_paid sur student_fees est mis à jour après chaque Payment :
   → SUM des payments non annulés pour ce student_fee
   → Recalculé via StudentFeeService::recalculateBalance()

4. receipt_number est unique et auto-généré dans le Model::boot()
   → Format : "{YEAR}-{SEQ}" ex: "2025-00042"

5. Un payment annulé (cancelled_at non null) ne compte PAS dans amount_paid

## COMMANDES DE TEST

php artisan migrate --path=database/migrations/tenant
php artisan tinker
  >>> Schema::hasTable('fee_types')
  >>> Schema::hasTable('fee_schedules')
  >>> Schema::hasTable('student_fees')
  >>> Schema::hasTable('payments')
  >>> Schema::hasTable('payment_installments')
```

---

## SESSION 10.2 — Enums + Models + Services

```
## CONTEXTE PROJET — ENMA SCHOOL

Stack : PHP 8.3 / Laravel 12, strict_types=1, Enums PHP 8.1
PDF : barryvdh/laravel-dompdf (déjà installé — Phase 7)

Phase 10 Session 1 terminée :
- Migrations : fee_types, fee_schedules, student_fees,
               payments, payment_installments ✅

## GÉNÈRE LES ENUMS

### app/Enums/FeeAppliesTo.php
cases : All, Maternelle, Primaire, College, Lycee
values: 'all','maternelle','primaire','college','lycee'
méthode : label() → "Tous", "Maternelle", "Primaire", "Collège", "Lycée"
méthode : matchesCategory(string $category) : bool

### app/Enums/StudentFeeStatus.php
cases : Pending, Partial, Paid, Overdue, Waived
values: 'pending','partial','paid','overdue','waived'
méthode : label() → "En attente","Partiel","Soldé","En retard","Exonéré"
méthode : color()
  Pending → 'gray', Partial → 'orange', Paid → 'green',
  Overdue → 'red', Waived → 'blue'
méthode : isSettled() : bool → in [Paid, Waived]
méthode : requiresAction() : bool → in [Pending, Partial, Overdue]

### app/Enums/PaymentMethod.php
cases : Cash, Wave, OrangeMoney, Mtn, BankTransfer, Check, Other
values: 'cash','wave','orange_money','mtn','bank_transfer','check','other'
méthode : label() →
  cash → "Espèces", wave → "Wave", orange_money → "Orange Money",
  mtn → "MTN Money", bank_transfer → "Virement bancaire",
  check → "Chèque", other → "Autre"
méthode : icon() → nom icône lucide-react
méthode : requiresReference() : bool → true pour wave, orange_money, mtn, bank_transfer, check

### app/Enums/InstallmentStatus.php
cases : Pending, Paid, Overdue
méthode : label(), color()

## GÉNÈRE LES MODELS

### FeeType.php

$fillable : name, code, description, is_mandatory, is_recurring,
            applies_to, order, is_active
Casts : applies_to → FeeAppliesTo::class, is_mandatory → bool,
        is_recurring → bool, is_active → bool
Relations :
  schedules() → hasMany FeeSchedule
  studentFees() → hasMany StudentFee
Scopes :
  scopeActive($query)
  scopeMandatory($query)
  scopeForCategory($query, string $category)
    → where applies_to IN ['all', $category]

### FeeSchedule.php

$fillable : academic_year_id, fee_type_id, school_level_id, amount,
            installments_allowed, max_installments, due_date, notes
Casts : amount → 'decimal:2', due_date → 'date',
        installments_allowed → bool
Relations :
  academicYear() → belongsTo AcademicYear
  feeType() → belongsTo FeeType
  schoolLevel() → belongsTo SchoolLevel (nullable)
  studentFees() → hasMany StudentFee

### StudentFee.php

$fillable : enrollment_id, fee_schedule_id, fee_type_id, academic_year_id,
            amount_due, amount_paid, discount_amount, discount_reason,
            status, due_date, notes, created_by
Casts :
  amount_due → 'decimal:2', amount_paid → 'decimal:2',
  discount_amount → 'decimal:2', due_date → 'date',
  status → StudentFeeStatus::class

Relations :
  enrollment()   → belongsTo Enrollment
  feeSchedule()  → belongsTo FeeSchedule (nullable)
  feeType()      → belongsTo FeeType
  academicYear() → belongsTo AcademicYear
  payments()     → hasMany Payment
  installments() → hasMany PaymentInstallment
  createdBy()    → belongsTo User

Accessors :
  getAmountRemainingAttribute() : float
    → max(0, $this->amount_due - $this->discount_amount - $this->amount_paid)
  getIsFullyPaidAttribute() : bool
    → $this->amount_remaining <= 0
  getPaymentPercentageAttribute() : float
    → min(100, ($this->amount_paid / max(1, $this->amount_due - $this->discount_amount)) * 100)

Méthodes :
  recalculateBalance() : void
    → $this->amount_paid = $this->payments()->whereNull('cancelled_at')->sum('amount')
    → recalculate status
    → save()
  recalculateStatus() : StudentFeeStatus
    → if waived → Waived (ne pas changer)
    → if amount_remaining <= 0 → Paid
    → if amount_paid > 0 → Partial
    → if due_date && due_date < today → Overdue
    → else → Pending

Scopes :
  scopeForEnrollment($query, int $id)
  scopeForYear($query, int $yearId)
  scopeOverdue($query) → where('status', 'overdue')
  scopeUnpaid($query) → whereIn('status', ['pending','partial','overdue'])
  scopeByStatus($query, StudentFeeStatus $status)

### Payment.php

$fillable : student_fee_id, enrollment_id, academic_year_id,
            receipt_number, amount, payment_method, payment_date,
            reference, notes, pdf_path, recorded_by,
            cancelled_at, cancelled_by, cancel_reason
Casts :
  payment_method → PaymentMethod::class, payment_date → 'date',
  amount → 'decimal:2', cancelled_at → 'datetime'

Relations :
  studentFee()   → belongsTo StudentFee
  enrollment()   → belongsTo Enrollment
  academicYear() → belongsTo AcademicYear
  recordedBy()   → belongsTo User
  cancelledBy()  → belongsTo User (FK: cancelled_by, nullable)

Accessors :
  getIsCancelledAttribute() : bool → !is_null($this->cancelled_at)
  getPdfUrlAttribute() : string|null

boot() → creating :
  → générer receipt_number : "{YEAR}-{SEQ_5DIGITS}"
    ex: "2025-00042"
    SEQ = dernier numéro de reçu de l'année + 1

Scopes :
  scopeActive($query) → whereNull('cancelled_at')
  scopeForYear($query, int $yearId)
  scopeByMethod($query, PaymentMethod $method)
  scopeBetweenDates($query, string $from, string $to)

### PaymentInstallment.php

$fillable : student_fee_id, installment_number, amount_due,
            due_date, amount_paid, paid_at, status
Casts :
  amount_due → 'decimal:2', amount_paid → 'decimal:2',
  due_date → 'date', paid_at → 'datetime',
  status → InstallmentStatus::class

Relations :
  studentFee() → belongsTo StudentFee

Accessor :
  getIsOverdueAttribute() : bool
    → status !== Paid && due_date < today()

## GÉNÈRE LES SERVICES

### FeeService.php

// ── Configuration des frais ───────────────────────────────

getFeeTypes(bool $activeOnly = true) : Collection
createFeeType(array $data) : FeeType
updateFeeType(FeeType $type, array $data) : FeeType

getFeeSchedules(int $yearId) : Collection
  → groupés par fee_type → school_level
setFeeSchedule(array $data) : FeeSchedule
  → updateOrCreate(['academic_year_id','fee_type_id','school_level_id'])
bulkSetSchedules(int $yearId, array $schedules) : void
  → pour configurer tous les tarifs d'un coup
  → chaque schedule : { fee_type_id, school_level_id, amount, ... }
copySchedulesFromYear(int $fromYearId, int $toYearId) : int
  → copie les grilles tarifaires d'une année vers une autre
  → retourne le nombre de schedules copiés

// ── Frais élève ───────────────────────────────────────────

generateForEnrollment(Enrollment $enrollment) : Collection
  → Crée les student_fees pour un élève nouvellement inscrit
  → Récupère les fee_schedules applicables :
    * académic_year_id = enrollment.academic_year_id
    * school_level_id = enrollment.classe.school_level_id (ou NULL = défaut)
    * fee_type.applies_to IN ['all', niveau_catégorie]
    * fee_type.is_active = true
  → Pour chaque fee_schedule applicable :
    updateOrCreate(['enrollment_id','fee_type_id'], [...])
  → Retourne la collection des student_fees créés/mis à jour

getStudentFees(int $enrollmentId) : Collection
  → tous les frais d'un élève pour son année d'inscription
  → eager load : feeType, payments (active), installments

getStudentBalance(int $enrollmentId) : array
  → {
      total_due: float,
      total_discount: float,
      total_paid: float,
      total_remaining: float,
      is_fully_paid: bool,
      fees: [{ fee_type, amount_due, amount_paid, amount_remaining, status }]
    }

applyDiscount(StudentFee $fee, float $amount, string $reason, User $by) : StudentFee
  → discount_amount = $amount
  → discount_reason = $reason
  → recalculateBalance()

waive(StudentFee $fee, string $reason, User $by) : StudentFee
  → status = Waived
  → discount_amount = amount_due - amount_paid (solde)
  → discount_reason = $reason

createInstallmentPlan(StudentFee $fee, array $installments) : Collection
  → $installments = [
      ['installment_number'=>1,'amount_due'=>50000,'due_date'=>'2025-01-15'],
      ['installment_number'=>2,'amount_due'=>50000,'due_date'=>'2025-03-15'],
      ['installment_number'=>3,'amount_due'=>50000,'due_date'=>'2025-05-15'],
    ]
  → Vérifie SUM(amount_due) <= fee.amount_remaining
  → Crée ou remplace les installments

// ── Statistiques ───────────────────────────────────────────

getYearStats(int $yearId) : array
  → {
      total_expected: float,  // total dû par tous les élèves
      total_collected: float, // total payé
      total_remaining: float,
      collection_rate: float, // % collecté
      by_status: { pending: int, partial: int, paid: int, overdue: int, waived: int },
      by_fee_type: [{ fee_type_name, expected, collected, rate }],
      by_level: [{ level, expected, collected, rate }],
    }

getOverdueStudents(int $yearId) : Collection
  → élèves avec au moins un student_fee en overdue
  → triés par montant restant décroissant

getClassPaymentSummary(int $classeId, int $yearId) : array
  → résumé des paiements pour une classe

### PaymentService.php

record(array $data, User $recordedBy) : Payment
  data : student_fee_id, amount, payment_method, payment_date,
         reference (nullable), notes (nullable)
  Vérifications :
    1. Le student_fee n'est pas Waived ou Paid (si Paid → warning)
    2. amount <= studentFee.amount_remaining
    3. Si payment_method.requiresReference() → reference obligatoire
  → Créer le Payment
  → Mettre à jour studentFee.amount_paid via recalculateBalance()
  → Générer le reçu PDF en arrière-plan : dispatch GenerateReceiptJob
  → Mettre à jour les installments si existants

cancel(Payment $payment, string $reason, User $cancelledBy) : Payment
  → Vérifie que le paiement n'est pas déjà annulé
  → cancelled_at = now(), cancelled_by, cancel_reason
  → Recalculer le solde du student_fee
  → Supprimer le PDF du reçu

generateReceipt(Payment $payment) : Payment
  → Génère le PDF du reçu via PdfGeneratorService
  → Template : resources/views/pdf/payment_receipt.blade.php
  → Stocke dans storage/app/tenant_{slug}/receipts/{year}/{receipt_number}.pdf
  → Met à jour payment.pdf_path

getHistory(int $enrollmentId, array $filters = []) : LengthAwarePaginator
  → Historique paginé des paiements d'un élève
  → eager load : studentFee.feeType, recordedBy

getDailyReport(Carbon $date) : array
  → Rapport des paiements d'une journée :
    {
      date: string,
      total_amount: float,
      payments_count: int,
      by_method: [{ method, amount, count }],
      payments: [Payment...]
    }

getMonthlyReport(int $year, int $month) : array
  → Rapport mensuel agrégé

## JOB : GenerateStudentFeesJob.php

Queue : 'fees'
Payload : enrollment_id

handle() :
  → $enrollment = Enrollment::find($enrollmentId)->load('classe.level')
  → app(FeeService::class)->generateForEnrollment($enrollment)

## JOB : GenerateReceiptJob.php

Queue : 'fees'
Payload : payment_id

handle() :
  → $payment = Payment::find($paymentId)
  → app(PaymentService::class)->generateReceipt($payment)

## VUE BLADE : resources/views/pdf/payment_receipt.blade.php

Template HTML du reçu de paiement :

```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: DejaVu Sans; font-size: 11px; color: #1a1a1a; }
    .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 10px; }
    .receipt-title { font-size: 18px; font-weight: bold; color: #2563eb; }
    .receipt-number { font-size: 14px; color: #6b7280; }
    .section { margin: 15px 0; }
    .section-title { font-weight: bold; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; margin-bottom: 8px; }
    table { width: 100%; }
    .total-row { font-weight: bold; font-size: 13px; background: #f0f9ff; }
    .stamp { text-align: center; margin-top: 30px; color: #6b7280; font-size: 9px; }
    .paid-stamp { text-align: center; font-size: 28px; font-weight: bold;
                  color: #16a34a; border: 3px solid #16a34a;
                  padding: 8px 20px; display: inline-block; transform: rotate(-15deg); }
  </style>
</head>
<body>
  <div class="header">
    @if($school['logo_url'])
      <img src="{{ $school['logo_url'] }}" height="50" />
    @endif
    <div style="font-weight:bold; font-size:14px;">{{ $school['name'] }}</div>
    <div>{{ $school['address'] }} — Tél: {{ $school['phone'] }}</div>
    <div class="receipt-title">REÇU DE PAIEMENT</div>
    <div class="receipt-number">N° {{ $payment['receipt_number'] }}</div>
  </div>

  <div class="section">
    <div class="section-title">Informations de paiement</div>
    <table>
      <tr><td><strong>Date :</strong></td><td>{{ $payment['payment_date'] }}</td>
          <td><strong>Mode :</strong></td><td>{{ $payment['payment_method_label'] }}</td></tr>
      @if($payment['reference'])
      <tr><td><strong>Référence :</strong></td><td colspan="3">{{ $payment['reference'] }}</td></tr>
      @endif
      <tr><td><strong>Encaissé par :</strong></td><td colspan="3">{{ $payment['recorded_by'] }}</td></tr>
    </table>
  </div>

  <div class="section">
    <div class="section-title">Élève</div>
    <table>
      <tr><td><strong>Nom & Prénom :</strong></td><td>{{ $student['full_name'] }}</td>
          <td><strong>Matricule :</strong></td><td>{{ $student['matricule'] }}</td></tr>
      <tr><td><strong>Classe :</strong></td><td>{{ $classe['display_name'] }}</td>
          <td><strong>Année scolaire :</strong></td><td>{{ $academic_year['name'] }}</td></tr>
    </table>
  </div>

  <div class="section">
    <div class="section-title">Détail du paiement</div>
    <table>
      <thead>
        <tr style="background:#2563eb; color:white;">
          <th style="text-align:left; padding:4px;">Type de frais</th>
          <th style="text-align:right; padding:4px;">Montant dû</th>
          <th style="text-align:right; padding:4px;">Déjà payé</th>
          <th style="text-align:right; padding:4px;">Ce versement</th>
          <th style="text-align:right; padding:4px;">Reste dû</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="padding:4px;">{{ $student_fee['fee_type_name'] }}</td>
          <td style="text-align:right; padding:4px;">{{ number_format($student_fee['amount_due'], 0, ',', ' ') }} FCFA</td>
          <td style="text-align:right; padding:4px;">{{ number_format($student_fee['amount_previously_paid'], 0, ',', ' ') }} FCFA</td>
          <td style="text-align:right; padding:4px; font-weight:bold;">{{ number_format($payment['amount'], 0, ',', ' ') }} FCFA</td>
          <td style="text-align:right; padding:4px;">{{ number_format($student_fee['amount_remaining'], 0, ',', ' ') }} FCFA</td>
        </tr>
        <tr class="total-row">
          <td colspan="3" style="padding:4px; text-align:right;"><strong>MONTANT VERSÉ :</strong></td>
          <td style="text-align:right; padding:4px; font-size:14px;">{{ number_format($payment['amount'], 0, ',', ' ') }} FCFA</td>
          <td></td>
        </tr>
      </tbody>
    </table>
  </div>

  @if($student_fee['is_fully_paid'])
  <div style="text-align:center; margin:20px 0;">
    <div class="paid-stamp">✓ SOLDÉ</div>
  </div>
  @endif

  <table style="width:100%; margin-top:30px;">
    <tr>
      <td style="width:50%; text-align:center;">
        Signature du Caissier<br><br><br>___________________
      </td>
      <td style="width:50%; text-align:center;">
        Cachet de l'Établissement<br><br><br>___________________
      </td>
    </tr>
  </table>

  <div class="stamp">
    Document généré le {{ $generated_at }} | {{ $school['name'] }} | N° {{ $payment['receipt_number'] }}
    <br>Ce reçu est un document officiel. Toute modification le rend invalide.
  </div>
</body>
</html>
```

## COMMANDES DE TEST (tinker)

$feeService = app(App\Services\FeeService::class);

// Vérifier les schedules
App\Models\FeeSchedule::with('feeType','schoolLevel')
  ->where('academic_year_id', 1)->get();

// Générer les frais d'un élève
$enrollment = App\Models\Enrollment::with('classe.level')->first();
$fees = $feeService->generateForEnrollment($enrollment);
// → Collection de StudentFee créés

// Voir le solde
$balance = $feeService->getStudentBalance($enrollment->id);
// → { total_due: 250000, total_paid: 0, total_remaining: 250000 }

// Enregistrer un paiement
$payService = app(App\Services\PaymentService::class);
$payment = $payService->record([
  'student_fee_id' => 1,
  'amount' => 50000,
  'payment_method' => 'wave',
  'payment_date' => today()->toDateString(),
  'reference' => 'WAVE-2025-123456',
], $user);
// → Payment créé, reçu en génération, student_fee.amount_paid = 50000
```

---

## SESSION 10.3 — Controllers + Resources + Routes

```
## CONTEXTE PROJET — ENMA SCHOOL

Stack : PHP 8.3 / Laravel 12
Conventions : strict_types=1, Trait ApiResponse, Form Requests, Resources

Phase 10 Sessions 1 & 2 terminées ✅

## GÉNÈRE LES API RESOURCES

### FeeTypeResource.php
{
  id, name, code, description,
  is_mandatory, is_recurring,
  applies_to: { value, label },
  order, is_active,
  schedules_count: whenCounted,
}

### FeeScheduleResource.php
{
  id,
  amount (float),
  amount_formatted: "150 000 FCFA",
  installments_allowed, max_installments,
  due_date (d/m/Y) | null,
  notes,
  fee_type: FeeTypeResource (whenLoaded),
  school_level: { id, label, short_label, category } | null (whenLoaded),
  academic_year: { id, name } (whenLoaded),
}

### StudentFeeResource.php
{
  id,
  amount_due, amount_paid, amount_remaining, discount_amount,
  amount_due_formatted: "150 000 FCFA",
  amount_paid_formatted: "50 000 FCFA",
  amount_remaining_formatted: "100 000 FCFA",
  payment_percentage: float,   // % payé (0-100)
  discount_reason: string | null,
  status: { value, label, color },
  due_date (d/m/Y) | null,
  is_fully_paid: bool,
  notes: string | null,
  fee_type: FeeTypeResource (whenLoaded),
  payments: PaymentResource[] (whenLoaded),
  installments: PaymentInstallmentResource[] (whenLoaded),
  enrollment: { id, student: StudentListResource } (whenLoaded),
}

### PaymentResource.php
{
  id,
  receipt_number,
  amount (float),
  amount_formatted: "50 000 FCFA",
  payment_method: { value, label, icon },
  payment_date (d/m/Y),
  reference: string | null,
  notes: string | null,
  is_cancelled: bool,
  cancelled_at: string | null,
  cancel_reason: string | null,
  has_receipt: bool,
  pdf_url: string | null,
  recorded_by: { id, full_name } | null (whenLoaded),
  student_fee: StudentFeeResource (whenLoaded),
  enrollment: { id, student: StudentListResource } (whenLoaded),
  created_at,
}

### PaymentInstallmentResource.php
{
  id, installment_number,
  amount_due, amount_paid,
  amount_due_formatted,
  due_date (d/m/Y),
  status: { value, label, color },
  paid_at: string | null,
  is_overdue: bool,
}

### StudentBalanceResource.php
{
  enrollment_id,
  student: StudentListResource,
  academic_year: { id, name },
  total_due: float,
  total_discount: float,
  total_paid: float,
  total_remaining: float,
  total_due_formatted,
  total_remaining_formatted,
  is_fully_paid: bool,
  payment_percentage: float,
  fees: StudentFeeResource[],
}

### PaymentDailyReportResource.php
{
  date,
  total_amount, total_amount_formatted,
  payments_count,
  by_method: [{ method_label, amount, count }],
  payments: PaymentResource[],
}

### ClassPaymentSummaryResource.php
{
  classe: { id, display_name },
  academic_year: { id, name },
  total_students: int,
  fully_paid: int,
  partial: int,
  pending: int,
  overdue: int,
  total_expected: float,
  total_collected: float,
  collection_rate: float,
  total_expected_formatted,
  total_collected_formatted,
}

## GÉNÈRE LES FORM REQUESTS

### StoreFeeTypeRequest / UpdateFeeTypeRequest
  name        : required, string, max:150
  code        : required, string, max:20, uppercase, unique:fee_types,code
  description : nullable, string
  is_mandatory : boolean, default:true
  is_recurring : boolean, default:true
  applies_to  : required, in: FeeAppliesTo cases
  order       : integer, min:0

### SetFeeScheduleRequest
  academic_year_id : required, exists:academic_years,id
  fee_type_id      : required, exists:fee_types,id
  school_level_id  : nullable, exists:school_levels,id
  amount           : required, numeric, min:0, max:99999999.99
  installments_allowed : boolean
  max_installments : integer, min:1, max:12
  due_date         : nullable, date
  Messages :
    "Le montant ne peut pas être négatif"
    "Ce type de frais n'est pas applicable à ce niveau"

### BulkSetSchedulesRequest
  academic_year_id : required, exists:academic_years,id
  schedules        : required, array
  schedules.*.fee_type_id   : required, exists:fee_types,id
  schedules.*.school_level_id : nullable
  schedules.*.amount         : required, numeric, min:0

### RecordPaymentRequest
  student_fee_id  : required, exists:student_fees,id
  amount          : required, numeric, min:1
                   + doit être <= student_fee.amount_remaining
  payment_method  : required, in: PaymentMethod cases
  payment_date    : required, date, before_or_equal:today
  reference       : required_if: payment_method in [wave,orange_money,mtn,bank_transfer,check]
                    string, max:100
  notes           : nullable, string, max:300
  Messages :
    "Le montant dépasse le solde restant dû ({{ $remaining }} FCFA)"
    "La référence de transaction est obligatoire pour ce mode de paiement"

### CancelPaymentRequest
  reason : required, string, max:300

### ApplyDiscountRequest
  student_fee_id  : required, exists:student_fees,id
  amount          : required, numeric, min:0
                   + <= student_fee.amount_remaining
  reason          : required, string, max:300

### CreateInstallmentPlanRequest
  student_fee_id : required, exists:student_fees,id
  installments   : required, array, min:2, max:12
  installments.*.installment_number : required, integer
  installments.*.amount_due  : required, numeric, min:1
  installments.*.due_date    : required, date, after:today
  Validation globale :
    SUM(installments.*.amount_due) == student_fee.amount_remaining

## GÉNÈRE LES CONTROLLERS

### FeeTypeController
  index()   → GET /school/fee-types
  store()   → POST /school/fee-types (permission: payments.create)
  show()    → GET /school/fee-types/{feeType}
  update()  → PUT /school/fee-types/{feeType}
  destroy() → DELETE /school/fee-types/{feeType}

### FeeScheduleController
  index()       → GET /school/fee-schedules?year_id=X
                  → retourne grille tarifaire de l'année groupée par fee_type
  set()         → POST /school/fee-schedules
                  → permission: payments.create
                  → updateOrCreate un seul schedule
  bulkSet()     → POST /school/fee-schedules/bulk
                  → permission: payments.create
                  → configure toute la grille d'un coup
  copyFromYear()→ POST /school/fee-schedules/copy
                  → body: { from_year_id, to_year_id }
                  → copie les tarifs d'une année à l'autre

### StudentFeeController
  index()        → GET /school/student-fees
                   params: enrollment_id, class_id, year_id, status, per_page
                   → permission: payments.view
  show()         → GET /school/student-fees/{studentFee}
  balance()      → GET /school/student-fees/balance/{enrollment}
                   → StudentBalanceResource (solde complet de l'élève)
  applyDiscount()→ POST /school/student-fees/{studentFee}/discount
                   → permission: payments.validate
  waive()        → POST /school/student-fees/{studentFee}/waive
                   → permission: payments.validate
  installments() → GET /school/student-fees/{studentFee}/installments
  setInstallments()→ POST /school/student-fees/{studentFee}/installments
                   → permission: payments.create

### PaymentController
  index()    → GET /school/payments
              params: enrollment_id, class_id, year_id, method, date_from, date_to, per_page
              → permission: payments.view
  store()    → POST /school/payments
              → permission: payments.create
              → RecordPaymentRequest
              → dispatch GenerateReceiptJob
  show()     → GET /school/payments/{payment}
  cancel()   → POST /school/payments/{payment}/cancel
              → permission: payments.validate
  download() → GET /school/payments/{payment}/receipt
              → stream le PDF du reçu
  dailyReport() → GET /school/payments/report/daily?date=2025-01-13
              → permission: payments.reports
  monthlyReport()→ GET /school/payments/report/monthly?year=2025&month=01
              → permission: payments.reports
  classSummary() → GET /school/payments/class/{classe}?year_id=X
              → ClassPaymentSummaryResource
  yearStats()    → GET /school/payments/stats?year_id=X
              → statistiques globales de l'année

## ROUTES

Route::middleware(['auth:sanctum','tenant.active',
                   'module:payments'])->group(function () {
  Route::prefix('school')->group(function () {

    // ── Types de frais ─────────────────────────────────
    Route::apiResource('fee-types', FeeTypeController::class);

    // ── Grilles tarifaires ─────────────────────────────
    Route::post('fee-schedules/bulk', [FeeScheduleController::class, 'bulkSet'])
         ->middleware('can:payments.create');
    Route::post('fee-schedules/copy', [FeeScheduleController::class, 'copyFromYear'])
         ->middleware('can:payments.create');
    Route::get('fee-schedules', [FeeScheduleController::class, 'index'])
         ->middleware('can:payments.view');
    Route::post('fee-schedules', [FeeScheduleController::class, 'set'])
         ->middleware('can:payments.create');

    // ── Frais élèves ───────────────────────────────────
    Route::get('student-fees/balance/{enrollment}',
         [StudentFeeController::class, 'balance'])
         ->middleware('can:payments.view');
    Route::apiResource('student-fees', StudentFeeController::class)
         ->only(['index','show']);
    Route::post('student-fees/{studentFee}/discount',
         [StudentFeeController::class, 'applyDiscount'])
         ->middleware('can:payments.validate');
    Route::post('student-fees/{studentFee}/waive',
         [StudentFeeController::class, 'waive'])
         ->middleware('can:payments.validate');
    Route::get('student-fees/{studentFee}/installments',
         [StudentFeeController::class, 'installments'])
         ->middleware('can:payments.view');
    Route::post('student-fees/{studentFee}/installments',
         [StudentFeeController::class, 'setInstallments'])
         ->middleware('can:payments.create');

    // ── Paiements ──────────────────────────────────────
    Route::get('payments/report/daily', [PaymentController::class, 'dailyReport'])
         ->middleware('can:payments.reports');
    Route::get('payments/report/monthly', [PaymentController::class, 'monthlyReport'])
         ->middleware('can:payments.reports');
    Route::get('payments/stats', [PaymentController::class, 'yearStats'])
         ->middleware('can:payments.reports');
    Route::get('payments/class/{classe}', [PaymentController::class, 'classSummary'])
         ->middleware('can:payments.view');
    Route::apiResource('payments', PaymentController::class)
         ->only(['index','store','show']);
    Route::post('payments/{payment}/cancel',
         [PaymentController::class, 'cancel'])
         ->middleware('can:payments.validate');
    Route::get('payments/{payment}/receipt',
         [PaymentController::class, 'download'])
         ->middleware('can:payments.view');
  });
});

## TESTS HOPPSCOTCH

// Configurer les frais de l'année
POST /api/school/fee-schedules/bulk
{
  "academic_year_id": 1,
  "schedules": [
    {"fee_type_id":1,"school_level_id":6,"amount":150000},  // 6ème
    {"fee_type_id":1,"school_level_id":8,"amount":120000},  // CM1
    {"fee_type_id":2,"school_level_id":null,"amount":25000}, // inscription (tous niveaux)
    {"fee_type_id":3,"school_level_id":null,"amount":5000}   // cantine (tous)
  ]
}

// Solde d'un élève
GET /api/school/student-fees/balance/1
→ StudentBalanceResource complet

// Enregistrer un paiement Wave
POST /api/school/payments
{
  "student_fee_id": 1,
  "amount": 50000,
  "payment_method": "wave",
  "payment_date": "2025-01-13",
  "reference": "WAVE-2025-987654"
}
→ 201, Payment créé, reçu en génération

// Télécharger le reçu
GET /api/school/payments/1/receipt
→ Stream PDF "Reçu N° 2025-00001"

// Rapport journalier
GET /api/school/payments/report/daily?date=2025-01-13
→ { total_amount: 375000, payments_count: 8,
    by_method: [{method:"Wave", amount:250000}, ...] }

// Appliquer une remise
POST /api/school/student-fees/1/discount
{ "amount": 25000, "reason": "Famille nombreuse — 3 enfants scolarisés" }

// Exonérer un élève
POST /api/school/student-fees/1/waive
{ "reason": "Élève boursier — exonération accordée par le directeur" }

// Échéancier
POST /api/school/student-fees/1/installments
{
  "installments": [
    {"installment_number":1,"amount_due":50000,"due_date":"2025-10-01"},
    {"installment_number":2,"amount_due":50000,"due_date":"2025-12-01"},
    {"installment_number":3,"amount_due":50000,"due_date":"2026-02-01"}
  ]
}
```

---

## SESSION 10.4 — Frontend : Types + API + Hooks

```
## CONTEXTE PROJET — ENMA SCHOOL

Stack : React 18 + TypeScript 5, TanStack Query v5, Zustand v4
Types existants : school.types.ts, students.types.ts

Phase 10 Sessions 1-3 terminées ✅

## GÉNÈRE LES FICHIERS SUIVANTS

### src/modules/school/types/payments.types.ts

export type PaymentMethod =
  'cash' | 'wave' | 'orange_money' | 'mtn' | 'bank_transfer' | 'check' | 'other';
export type StudentFeeStatus = 'pending' | 'partial' | 'paid' | 'overdue' | 'waived';
export type InstallmentStatus = 'pending' | 'paid' | 'overdue';

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Espèces', wave: 'Wave', orange_money: 'Orange Money',
  mtn: 'MTN Money', bank_transfer: 'Virement bancaire',
  check: 'Chèque', other: 'Autre',
};
export const PAYMENT_METHOD_COLORS: Record<PaymentMethod, string> = {
  cash: 'green', wave: '#1d4ed8', orange_money: 'orange',
  mtn: 'yellow', bank_transfer: 'gray', check: 'purple', other: 'gray',
};
export const METHODS_REQUIRING_REFERENCE: PaymentMethod[] = [
  'wave', 'orange_money', 'mtn', 'bank_transfer', 'check',
];
export const FEE_STATUS_COLORS: Record<StudentFeeStatus, string> = {
  pending: 'gray', partial: 'orange', paid: 'green', overdue: 'red', waived: 'blue',
};
export const FEE_STATUS_LABELS: Record<StudentFeeStatus, string> = {
  pending: 'En attente', partial: 'Partiel', paid: 'Soldé',
  overdue: 'En retard', waived: 'Exonéré',
};

export interface FeeType {
  id: number;
  name: string; code: string; description: string | null;
  is_mandatory: boolean; is_recurring: boolean;
  applies_to: { value: string; label: string };
  order: number; is_active: boolean;
}

export interface FeeSchedule {
  id: number;
  amount: number; amount_formatted: string;
  installments_allowed: boolean; max_installments: number;
  due_date: string | null; notes: string | null;
  fee_type?: FeeType;
  school_level?: { id: number; label: string; short_label: string; category: string } | null;
  academic_year?: { id: number; name: string };
}

export interface StudentFee {
  id: number;
  amount_due: number; amount_paid: number;
  amount_remaining: number; discount_amount: number;
  amount_due_formatted: string; amount_paid_formatted: string;
  amount_remaining_formatted: string;
  payment_percentage: number;
  discount_reason: string | null;
  status: { value: StudentFeeStatus; label: string; color: string };
  due_date: string | null; is_fully_paid: boolean; notes: string | null;
  fee_type?: FeeType;
  payments?: Payment[];
  installments?: PaymentInstallment[];
  enrollment?: { id: number; student: StudentListItem };
}

export interface Payment {
  id: number;
  receipt_number: string;
  amount: number; amount_formatted: string;
  payment_method: { value: PaymentMethod; label: string; icon: string };
  payment_date: string;
  reference: string | null; notes: string | null;
  is_cancelled: boolean; cancelled_at: string | null; cancel_reason: string | null;
  has_receipt: boolean; pdf_url: string | null;
  recorded_by?: { id: number; full_name: string } | null;
  student_fee?: StudentFee;
  enrollment?: { id: number; student: StudentListItem };
  created_at: string;
}

export interface PaymentInstallment {
  id: number; installment_number: number;
  amount_due: number; amount_paid: number; amount_due_formatted: string;
  due_date: string;
  status: { value: InstallmentStatus; label: string; color: string };
  paid_at: string | null; is_overdue: boolean;
}

export interface StudentBalance {
  enrollment_id: number;
  student: StudentListItem;
  academic_year: { id: number; name: string };
  total_due: number; total_discount: number;
  total_paid: number; total_remaining: number;
  total_due_formatted: string; total_remaining_formatted: string;
  is_fully_paid: boolean; payment_percentage: number;
  fees: StudentFee[];
}

export interface PaymentFormData {
  student_fee_id: number;
  amount: number;
  payment_method: PaymentMethod;
  payment_date: string;
  reference?: string;
  notes?: string;
}

export interface PaymentYearStats {
  total_expected: number; total_collected: number; total_remaining: number;
  collection_rate: number;
  total_expected_formatted: string; total_collected_formatted: string;
  by_status: Record<StudentFeeStatus, number>;
  by_fee_type: Array<{ fee_type_name: string; expected: number; collected: number; rate: number }>;
  by_level: Array<{ level: string; expected: number; collected: number; rate: number }>;
}

### src/modules/school/api/payments.api.ts

import { apiClient } from '@/shared/lib/axios';

export const feeTypesApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<PaginatedResponse<FeeType>>('/school/fee-types', { params }),
  create: (data: Partial<FeeType>) =>
    apiClient.post<ApiSuccess<FeeType>>('/school/fee-types', data),
  update: (id: number, data: Partial<FeeType>) =>
    apiClient.put<ApiSuccess<FeeType>>(`/school/fee-types/${id}`, data),
  delete: (id: number) => apiClient.delete(`/school/fee-types/${id}`),
};

export const feeSchedulesApi = {
  getAll: (yearId: number) =>
    apiClient.get<ApiSuccess<FeeSchedule[]>>('/school/fee-schedules', { params: { year_id: yearId } }),
  set: (data: Partial<FeeSchedule>) =>
    apiClient.post<ApiSuccess<FeeSchedule>>('/school/fee-schedules', data),
  bulkSet: (data: { academic_year_id: number; schedules: unknown[] }) =>
    apiClient.post('/school/fee-schedules/bulk', data),
  copyFromYear: (fromYearId: number, toYearId: number) =>
    apiClient.post('/school/fee-schedules/copy', { from_year_id: fromYearId, to_year_id: toYearId }),
};

export const studentFeesApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<PaginatedResponse<StudentFee>>('/school/student-fees', { params }),
  getBalance: (enrollmentId: number) =>
    apiClient.get<ApiSuccess<StudentBalance>>(`/school/student-fees/balance/${enrollmentId}`),
  applyDiscount: (id: number, data: { amount: number; reason: string }) =>
    apiClient.post<ApiSuccess<StudentFee>>(`/school/student-fees/${id}/discount`, data),
  waive: (id: number, data: { reason: string }) =>
    apiClient.post<ApiSuccess<StudentFee>>(`/school/student-fees/${id}/waive`, data),
  setInstallments: (id: number, installments: unknown[]) =>
    apiClient.post(`/school/student-fees/${id}/installments`, { installments }),
};

export const paymentsApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<PaginatedResponse<Payment>>('/school/payments', { params }),
  getOne: (id: number) =>
    apiClient.get<ApiSuccess<Payment>>(`/school/payments/${id}`),
  record: (data: PaymentFormData) =>
    apiClient.post<ApiSuccess<Payment>>('/school/payments', data),
  cancel: (id: number, data: { reason: string }) =>
    apiClient.post<ApiSuccess<Payment>>(`/school/payments/${id}/cancel`, data),
  downloadReceipt: (id: number) =>
    apiClient.get(`/school/payments/${id}/receipt`, { responseType: 'blob' }),
  getDailyReport: (date: string) =>
    apiClient.get(`/school/payments/report/daily`, { params: { date } }),
  getMonthlyReport: (year: number, month: number) =>
    apiClient.get(`/school/payments/report/monthly`, { params: { year, month } }),
  getYearStats: (yearId: number) =>
    apiClient.get<ApiSuccess<PaymentYearStats>>('/school/payments/stats', { params: { year_id: yearId } }),
  getClassSummary: (classeId: number, yearId: number) =>
    apiClient.get(`/school/payments/class/${classeId}`, { params: { year_id: yearId } }),
};

### src/modules/school/hooks/usePayments.ts

useFeeTypes()                    → useQuery, staleTime: 10min
useCreateFeeType()               → useMutation + invalidate ['fee-types']
useUpdateFeeType()               → useMutation + invalidate ['fee-types']

useFeeSchedules(yearId)          → useQuery key: ['fee-schedules', yearId]
useBulkSetFeeSchedules()         → useMutation + invalidate ['fee-schedules']
useCopyFeeSchedules()            → useMutation + invalidate ['fee-schedules']

useStudentFees(filters)          → useQuery key: ['student-fees', filters]
useStudentBalance(enrollmentId)  → useQuery key: ['student-balance', enrollmentId]
useApplyDiscount()               → useMutation + invalidate ['student-balance', 'student-fees']
useWaiveFee()                    → useMutation + invalidate ['student-balance', 'student-fees']
useSetInstallments()             → useMutation + invalidate ['student-balance']

usePayments(filters)             → useQuery key: ['payments', filters]
useRecordPayment()               → useMutation + invalidate ['student-balance','payments']
useCancelPayment()               → useMutation + invalidate ['student-balance','payments']
useDownloadReceipt()             → mutation (télécharge blob PDF)
usePaymentYearStats(yearId)      → useQuery key: ['payment-stats', yearId]
useClassPaymentSummary(classeId, yearId) → useQuery key: ['class-payment', classeId, yearId]
useDailyReport(date)             → useQuery key: ['daily-report', date]

### src/modules/school/lib/paymentHelpers.ts

export function formatXOF(amount: number): string {
  return new Intl.NumberFormat('fr-CI', {
    style: 'currency', currency: 'XOF',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount);
  // → "150 000 FCFA"
}

export function getStatusColor(status: StudentFeeStatus): string { ... }
export function getStatusLabel(status: StudentFeeStatus): string { ... }
export function getMethodLabel(method: PaymentMethod): string { ... }
export function requiresReference(method: PaymentMethod): boolean {
  return METHODS_REQUIRING_REFERENCE.includes(method);
}
export function getCollectionRateColor(rate: number): string {
  if (rate >= 80) return 'green';
  if (rate >= 50) return 'orange';
  return 'red';
}
export function downloadReceiptBlob(blob: Blob, receiptNumber: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `recu-${receiptNumber}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
```

---

## SESSION 10.5 — Frontend Pages

```
## CONTEXTE PROJET — ENMA SCHOOL

Stack : React 18 + TypeScript 5, Tailwind + shadcn/ui, TanStack Query v5
Types, API, Hooks créés en Session 10.4 ✅

## GÉNÈRE LES PAGES ET COMPOSANTS

### 1. PaymentsPage.tsx — Page principale

URL : /school/payments

ONGLETS :
  [💰 Paiements] [👥 Élèves] [📊 Statistiques] [⚙️ Configuration]

### 2. PaymentsDashboardTab.tsx — Vue globale des paiements

STATS RAPIDES (en haut) :
  ┌──────────────────┬──────────────────┬──────────────────┬─────────────────┐
  │ 150 000 000 FCFA │ 87 500 000 FCFA  │ 62 500 000 FCFA  │       58.3%     │
  │   Total attendu  │   Collecté       │   Reste à payer  │  Taux collecte  │
  └──────────────────┴──────────────────┴──────────────────┴─────────────────┘

GRAPHIQUES (Recharts) :
  - BarChart : collecte par type de frais
  - PieChart : répartition par mode de paiement
  - LineChart : évolution mensuelle des encaissements

TABLEAU DES ÉLÈVES EN RETARD :
  Colonnes : Élève | Classe | Montant restant | Statut | Actions

### 3. StudentPaymentPage.tsx — Dossier paiement d'un élève

URL : /school/payments/student/:enrollmentId

HEADER :
  Photo + Nom élève | Classe | Matricule
  Badges : "Soldé ✓" ou "X FCFA restant" (coloré)

BALANCE CARD :
  ┌─────────────────────────────────────────────────┐
  │ Total dû : 175 000 FCFA                        │
  │ Remises  :  25 000 FCFA                        │
  │ Payé     :  50 000 FCFA                        │
  │ ════════════════════════════                    │
  │ Reste dû : 100 000 FCFA    [Enregistrer paiement]│
  └─────────────────────────────────────────────────┘

TABLEAU DES FRAIS :
  Pour chaque student_fee :
  | Type de frais | Dû | Payé | Restant | Statut | Actions |
  Actions : [Payer] [Remise] [Exonérer] [Échéancier]

HISTORIQUE DES PAIEMENTS :
  Tableau : Date | Reçu N° | Mode | Montant | Saisi par | [Reçu] [Annuler]

ÉCHÉANCIER (si existant) :
  Timeline des tranches avec statut (payé/en attente/en retard)

### 4. RecordPaymentModal.tsx — Enregistrer un paiement

FORMULAIRE :
  1. Type de frais (pré-sélectionné depuis le bouton [Payer])
     Afficher : "Reste dû : 100 000 FCFA"
  2. Montant (input numérique en FCFA)
     → Bouton [Tout payer] = remplit avec amount_remaining
     → Validation : > 0 et <= amount_remaining
  3. Mode de paiement (boutons visuels avec logo)
     [💵 Espèces] [〰️ Wave] [🟠 Orange Money] [📱 MTN] [🏦 Virement] [📄 Chèque]
  4. Référence (affichée si mode requiert une référence)
     → Placeholder selon le mode : "WAVE-2025-XXXXXX"
  5. Date du paiement (date picker, défaut: aujourd'hui)
  6. Notes (optionnel)

  RÉCAPITULATIF avant validation :
  ┌──────────────────────────────────────────────┐
  │ ✓ Paiement à enregistrer                    │
  │   Élève    : KOUASSI Jean-Marc (2025-00042)  │
  │   Frais    : Frais de scolarité              │
  │   Montant  : 50 000 FCFA via Wave            │
  │   Réf.     : WAVE-2025-987654                │
  └──────────────────────────────────────────────┘

  Après validation → afficher confirmation avec le N° de reçu :
  "Paiement enregistré — Reçu N° 2025-00042 en cours de génération"

### 5. FeeConfigPage.tsx — Configuration des frais

URL : /school/payments/config

SECTION 1 — Types de frais :
  Tableau CRUD des types de frais (nom, code, obligatoire, récurrent, niveaux)

SECTION 2 — Grille tarifaire :
  Sélecteur : Année scolaire
  Tableau matriciel :
  ┌────────────────────┬──────────┬──────────┬──────────┬──────────┬──────────┐
  │ Type de frais      │ Matern.  │ Primaire │ Collège  │  Lycée   │  Défaut  │
  ├────────────────────┼──────────┼──────────┼──────────┼──────────┼──────────┤
  │ Frais de scolarité │ 80 000   │ 120 000  │ 150 000  │ 180 000  │    —     │
  │ Inscription        │    —     │    —     │    —     │    —     │ 25 000   │
  │ Cantine            │ 30 000   │ 30 000   │ 35 000   │ 35 000   │    —     │
  └────────────────────┴──────────┴──────────┴──────────┴──────────┴──────────┘
  → Cellules éditables inline (input numérique en FCFA)
  → Bouton [Sauvegarder tous] → bulkSet
  → Bouton [Copier depuis année précédente]

### 6. DailyReportPage.tsx — Rapport journalier

URL : /school/payments/report

Date picker → rapport du jour sélectionné.

CONTENU :
  - Total encaissé ce jour
  - Répartition par mode de paiement
  - Liste des paiements (avec bouton reçu)
  - Bouton [🖨️ Imprimer le rapport]

### 7. StudentPaymentTab.tsx — Onglet Paiements dans StudentDetailPage

Mise à jour de StudentDetailPage (Phase 4).
Remplace placeholder "Paiements — Disponible Phase 10".

Vue compacte : balance + liste des frais + bouton [Voir détail →]

## COMPOSANTS À CRÉER

1. BalanceCard.tsx
   Props: { balance: StudentBalance }
   → Card avec total dû / remises / payé / reste
   → Barre de progression colorée (% payé)
   → Badge "Soldé" ou "X FCFA restant"

2. FeeStatusBadge.tsx
   Props: { status: StudentFeeStatus }
   → Badge coloré avec label

3. PaymentMethodButton.tsx
   Props: { method: PaymentMethod; selected: boolean; onClick: fn }
   → Bouton visuel avec logo/couleur du mode de paiement

4. AmountDisplay.tsx
   Props: { amount: number; size?: 'sm'|'md'|'lg'; color?: string }
   → Affiche "150 000 FCFA" avec formatage Ivoirien

5. CollectionRateBar.tsx
   Props: { rate: number; collected: number; expected: number }
   → Barre de progression avec couleur selon le taux

6. InstallmentTimeline.tsx
   Props: { installments: PaymentInstallment[] }
   → Timeline verticale des tranches (payé / en attente / en retard)

7. PaymentReceiptButton.tsx
   Props: { payment: Payment }
   → Bouton [📄 Reçu] avec état chargement
   → Si has_receipt = false → tooltip "Reçu en cours de génération"

8. FeeScheduleGrid.tsx
   Props: { schedules: FeeSchedule[]; feeTypes: FeeType[];
            onUpdate: fn; readonly?: boolean }
   → Grille matricielle éditable pour la configuration des tarifs

## NAVIGATION (mise à jour)

Ajouter dans navigation.ts :
  /school/payments              → PaymentsPage      (icône: Wallet, rôle: accountant+)
  /school/payments/student/:id  → StudentPaymentPage
  /school/payments/config       → FeeConfigPage     (rôle: school_admin)
  /school/payments/report       → DailyReportPage   (rôle: accountant+)

## RÈGLES UX IMPORTANTES

1. Formatage XOF partout :
   → Utiliser formatXOF() de paymentHelpers.ts
   → Jamais de décimales pour le FCFA : "150 000 FCFA" (pas "150 000,00")

2. Bouton [Tout payer] :
   → Remplit automatiquement le champ amount avec amount_remaining
   → Pratique pour les parents qui soldent d'un coup

3. Confirmation visuelle après paiement :
   → Toast + modal de confirmation avec le numéro de reçu
   → Bouton [📄 Télécharger le reçu] (même si en cours de génération)

4. Protection contre la double saisie :
   → Désactiver le bouton [Valider] pendant la requête (loading state)
   → Invalider le cache après paiement pour rafraîchir les soldes

5. Annulation d'un paiement :
   → ConfirmDialog avec motif obligatoire
   → Badge "ANNULÉ" visible sur le paiement annulé dans l'historique
   → Le solde se recalcule automatiquement

6. Droits d'accès :
   → `accountant` peut voir + créer des paiements
   → `director` peut aussi valider (annuler, accorder remises)
   → `school_admin` a tout accès
   → `teacher` n'a PAS accès aux paiements
```

---

## RÉCAPITULATIF PHASE 10

| Session | Contenu | Fichiers clés |
|---------|---------|---------------|
| 10.1 | Migrations | `fee_types`, `fee_schedules`, `student_fees`, `payments`, `payment_installments` |
| 10.2 | Enums + Models + Services + Jobs + Template Blade | `StudentFee`, `Payment`, `FeeService`, `PaymentService`, `GenerateStudentFeesJob`, `GenerateReceiptJob`, `payment_receipt.blade.php` |
| 10.3 | Controllers + Resources + Routes | `FeeTypeController`, `FeeScheduleController`, `StudentFeeController`, `PaymentController` |
| 10.4 | Frontend Types + API + Hooks + Helpers | `payments.types.ts`, `payments.api.ts`, `usePayments.ts`, `paymentHelpers.ts` (avec formatXOF) |
| 10.5 | Frontend Pages + Composants | `PaymentsPage`, `StudentPaymentPage`, `RecordPaymentModal`, `FeeConfigPage` (grille tarifaire éditable), `DailyReportPage` |

---

### Points d'attention critiques

1. **Génération automatique des frais à l'inscription** — `GenerateStudentFeesJob`
   dispatché quand un `Enrollment` est créé (via Observer sur Enrollment)

2. **receipt_number unique** — généré dans `Payment::boot()` avec verrouillage
   optimiste pour éviter les doublons en concurrence (surtout en caisse)

3. **Recalcul du solde** — après chaque paiement et après chaque annulation,
   `recalculateBalance()` recalcule `amount_paid` et le `status` du `StudentFee`

4. **Formatage XOF** — le FCFA n'a pas de décimales → toujours arrondir
   et utiliser `formatXOF()` pour un affichage cohérent

5. **Module guard** — protéger TOUTES les routes par `middleware('module:payments')`
   → les écoles du plan Starter n'y ont pas accès

6. **Mise à jour Phase 4** — `StudentDetailPage` : remplacer le placeholder
   "Paiements — Disponible Phase 10" par `StudentPaymentTab`
