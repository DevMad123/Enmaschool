<?php

declare(strict_types=1);

namespace App\Models\Tenant;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClassSubject extends Model
{
    protected $table = 'class_subjects';

    protected $fillable = [
        'class_id',
        'subject_id',
        'coefficient_override',
        'hours_per_week',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'coefficient_override' => 'decimal:1',
            'hours_per_week' => 'decimal:1',
            'is_active' => 'boolean',
        ];
    }

    // ── Relations ──────────────────────────────────────────────

    public function classe(): BelongsTo
    {
        return $this->belongsTo(Classe::class, 'class_id');
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    // ── Accessors ──────────────────────────────────────────────

    public function getEffectiveCoefficientAttribute(): float
    {
        if ($this->coefficient_override !== null) {
            return (float) $this->coefficient_override;
        }

        $subject = $this->relationLoaded('subject')
            ? $this->subject
            : $this->subject()->first();

        return (float) ($subject?->coefficient ?? 1);
    }
}
