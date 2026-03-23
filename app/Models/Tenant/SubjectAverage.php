<?php

declare(strict_types=1);

namespace App\Models\Tenant;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SubjectAverage extends Model
{
    protected $fillable = [
        'enrollment_id',
        'student_id',
        'class_id',
        'subject_id',
        'academic_year_id',
        'annual_average',
        'weighted_average',
        'coefficient',
        'is_passing',
        'rank',
        'class_average',
        'period_averages',
        'calculated_at',
    ];

    protected function casts(): array
    {
        return [
            'annual_average'   => 'decimal:2',
            'weighted_average' => 'decimal:2',
            'coefficient'      => 'decimal:1',
            'is_passing'       => 'boolean',
            'class_average'    => 'decimal:2',
            'period_averages'  => 'array',
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

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class);
    }
}
