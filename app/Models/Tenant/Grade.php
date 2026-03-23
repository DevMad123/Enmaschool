<?php

declare(strict_types=1);

namespace App\Models\Tenant;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Grade extends Model
{
    protected $fillable = [
        'evaluation_id',
        'student_id',
        'enrollment_id',
        'score',
        'is_absent',
        'absence_justified',
        'comment',
        'entered_by',
        'entered_at',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'score'              => 'decimal:2',
            'is_absent'          => 'boolean',
            'absence_justified'  => 'boolean',
            'entered_at'         => 'datetime',
        ];
    }

    // ── Relations ─────────────────────────────────────────────────────────

    public function evaluation(): BelongsTo
    {
        return $this->belongsTo(Evaluation::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function enrollment(): BelongsTo
    {
        return $this->belongsTo(Enrollment::class);
    }

    public function enteredBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'entered_by');
    }

    public function updatedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    // ── Accessors ─────────────────────────────────────────────────────────

    public function getScoreOn20Attribute(): float|null
    {
        if ($this->score === null) {
            return null;
        }

        $maxScore = (float) ($this->evaluation?->max_score ?? 20);

        if ($maxScore == 20.0) {
            return (float) $this->score;
        }

        return (float) $this->score * 20.0 / $maxScore;
    }

    public function getIsPassingAttribute(): bool|null
    {
        $scoreOn20 = $this->score_on_20;

        if ($scoreOn20 === null) {
            return null;
        }

        $passingAverage = (float) SchoolSetting::get('passing_average', 10.0);

        return $scoreOn20 >= $passingAverage;
    }

    // ── Scopes ────────────────────────────────────────────────────────────

    public function scopeForEvaluation(Builder $query, int $evalId): Builder
    {
        return $query->where('evaluation_id', $evalId);
    }

    public function scopeForStudent(Builder $query, int $studentId): Builder
    {
        return $query->where('student_id', $studentId);
    }

    public function scopePresent(Builder $query): Builder
    {
        return $query->where('is_absent', false);
    }

    public function scopeAbsent(Builder $query): Builder
    {
        return $query->where('is_absent', true);
    }
}
