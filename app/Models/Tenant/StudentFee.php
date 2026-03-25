<?php

declare(strict_types=1);

namespace App\Models\Tenant;

use App\Enums\StudentFeeStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StudentFee extends Model
{
    protected $fillable = [
        'enrollment_id',
        'fee_schedule_id',
        'fee_type_id',
        'academic_year_id',
        'amount_due',
        'amount_paid',
        'discount_amount',
        'discount_reason',
        'status',
        'due_date',
        'notes',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'amount_due'      => 'decimal:2',
            'amount_paid'     => 'decimal:2',
            'discount_amount' => 'decimal:2',
            'due_date'        => 'date',
            'status'          => StudentFeeStatus::class,
        ];
    }

    // ── Relations ──────────────────────────────────────────────────────

    public function enrollment(): BelongsTo
    {
        return $this->belongsTo(Enrollment::class);
    }

    public function feeSchedule(): BelongsTo
    {
        return $this->belongsTo(FeeSchedule::class);
    }

    public function feeType(): BelongsTo
    {
        return $this->belongsTo(FeeType::class);
    }

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function installments(): HasMany
    {
        return $this->hasMany(PaymentInstallment::class)->orderBy('installment_number');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // ── Accessors ──────────────────────────────────────────────────────

    /** Montant restant à payer après remise (min 0). */
    public function getAmountRemainingAttribute(): float
    {
        return (float) max(0, $this->amount_due - $this->discount_amount - $this->amount_paid);
    }

    /** Retourne true si le frais est entièrement soldé. */
    public function getIsFullyPaidAttribute(): bool
    {
        return $this->amount_remaining <= 0;
    }

    /** Pourcentage payé (0-100). */
    public function getPaymentPercentageAttribute(): float
    {
        $base = (float) ($this->amount_due - $this->discount_amount);
        if ($base <= 0) {
            return 100.0;
        }

        return min(100.0, ((float) $this->amount_paid / $base) * 100);
    }

    // ── Méthodes métier ────────────────────────────────────────────────

    /**
     * Recalcule amount_paid (SUM des paiements non annulés) et le statut.
     */
    public function recalculateBalance(): void
    {
        $this->amount_paid = $this->payments()->whereNull('cancelled_at')->sum('amount');
        $this->status      = $this->recalculateStatus();
        $this->save();
    }

    /**
     * Détermine le nouveau statut en fonction des montants.
     * Ne change pas un statut Waived.
     */
    public function recalculateStatus(): StudentFeeStatus
    {
        // Un frais exonéré reste exonéré
        if ($this->status === StudentFeeStatus::Waived) {
            return StudentFeeStatus::Waived;
        }

        $remaining = (float) ($this->amount_due - $this->discount_amount - $this->amount_paid);

        if ($remaining <= 0) {
            return StudentFeeStatus::Paid;
        }

        if ((float) $this->amount_paid > 0) {
            return StudentFeeStatus::Partial;
        }

        if ($this->due_date && $this->due_date->isPast()) {
            return StudentFeeStatus::Overdue;
        }

        return StudentFeeStatus::Pending;
    }

    // ── Scopes ─────────────────────────────────────────────────────────

    public function scopeForEnrollment(Builder $query, int $id): Builder
    {
        return $query->where('enrollment_id', $id);
    }

    public function scopeForYear(Builder $query, int $yearId): Builder
    {
        return $query->where('academic_year_id', $yearId);
    }

    public function scopeOverdue(Builder $query): Builder
    {
        return $query->where('status', StudentFeeStatus::Overdue->value);
    }

    public function scopeUnpaid(Builder $query): Builder
    {
        return $query->whereIn('status', [
            StudentFeeStatus::Pending->value,
            StudentFeeStatus::Partial->value,
            StudentFeeStatus::Overdue->value,
        ]);
    }

    public function scopeByStatus(Builder $query, StudentFeeStatus $status): Builder
    {
        return $query->where('status', $status->value);
    }
}
