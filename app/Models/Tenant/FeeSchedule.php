<?php

declare(strict_types=1);

namespace App\Models\Tenant;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FeeSchedule extends Model
{
    protected $fillable = [
        'academic_year_id',
        'fee_type_id',
        'school_level_id',
        'amount',
        'installments_allowed',
        'max_installments',
        'due_date',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'amount'               => 'decimal:2',
            'due_date'             => 'date',
            'installments_allowed' => 'boolean',
        ];
    }

    // ── Relations ──────────────────────────────────────────────────────

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function feeType(): BelongsTo
    {
        return $this->belongsTo(FeeType::class);
    }

    /** Niveau scolaire associé — null = tarif par défaut. */
    public function schoolLevel(): BelongsTo
    {
        return $this->belongsTo(SchoolLevel::class);
    }

    public function studentFees(): HasMany
    {
        return $this->hasMany(StudentFee::class);
    }
}
