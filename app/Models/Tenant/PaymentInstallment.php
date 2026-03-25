<?php

declare(strict_types=1);

namespace App\Models\Tenant;

use App\Enums\InstallmentStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaymentInstallment extends Model
{
    protected $fillable = [
        'student_fee_id',
        'installment_number',
        'amount_due',
        'due_date',
        'amount_paid',
        'paid_at',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'amount_due'  => 'decimal:2',
            'amount_paid' => 'decimal:2',
            'due_date'    => 'date',
            'paid_at'     => 'datetime',
            'status'      => InstallmentStatus::class,
        ];
    }

    // ── Relations ──────────────────────────────────────────────────────

    public function studentFee(): BelongsTo
    {
        return $this->belongsTo(StudentFee::class);
    }

    // ── Accessors ──────────────────────────────────────────────────────

    /** Retourne true si la tranche est en retard (non payée et date dépassée). */
    public function getIsOverdueAttribute(): bool
    {
        return $this->status !== InstallmentStatus::Paid
            && $this->due_date->isPast();
    }
}
