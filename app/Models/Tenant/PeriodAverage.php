<?php

declare(strict_types=1);

namespace App\Models\Tenant;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PeriodAverage extends Model
{
    protected $fillable = [
        'enrollment_id',
        'student_id',
        'class_id',
        'subject_id',
        'period_id',
        'academic_year_id',
        'average',
        'weighted_average',
        'coefficient',
        'evaluations_count',
        'absences_count',
        'rank',
        'class_average',
        'min_score',
        'max_score',
        'is_final',
        'calculated_at',
    ];

    protected function casts(): array
    {
        return [
            'average'          => 'decimal:2',
            'weighted_average' => 'decimal:2',
            'coefficient'      => 'decimal:1',
            'class_average'    => 'decimal:2',
            'min_score'        => 'decimal:2',
            'max_score'        => 'decimal:2',
            'is_final'         => 'boolean',
            'calculated_at'    => 'datetime',
        ];
    }

    // ── Relations ─────────────────────────────────────────────────────────

    public function enrollment(): BelongsTo
    {
        return $this->belongsTo(Enrollment::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function classe(): BelongsTo
    {
        return $this->belongsTo(Classe::class, 'class_id');
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    public function period(): BelongsTo
    {
        return $this->belongsTo(Period::class);
    }

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class);
    }

    // ── Accessors ─────────────────────────────────────────────────────────

    public function getIsPassingAttribute(): bool|null
    {
        if ($this->average === null) {
            return null;
        }

        $passingAverage = (float) SchoolSetting::get('passing_average', 10.0);

        return (float) $this->average >= $passingAverage;
    }
}
