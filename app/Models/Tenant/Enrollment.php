<?php

declare(strict_types=1);

namespace App\Models\Tenant;

use App\Enums\EnrollmentStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

// NB : pas de SoftDeletes — une inscription est un document officiel.
class Enrollment extends Model
{
    protected $fillable = [
        'student_id',
        'classe_id',
        'academic_year_id',
        'enrollment_date',
        'enrollment_number',
        'is_active',
        'status',
        'transfer_note',
        'transferred_from',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'enrollment_date' => 'date',
            'status'          => EnrollmentStatus::class,
            'is_active'       => 'boolean',
        ];
    }

    // ── Relations ──────────────────────────────────────────────

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function classe(): BelongsTo
    {
        return $this->belongsTo(Classe::class);
    }

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function transferredFromClasse(): BelongsTo
    {
        return $this->belongsTo(Classe::class, 'transferred_from');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // ── Scopes ─────────────────────────────────────────────────

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeForYear(Builder $query, int $yearId): Builder
    {
        return $query->where('academic_year_id', $yearId);
    }

    public function scopeForClasse(Builder $query, int $classeId): Builder
    {
        return $query->where('classe_id', $classeId);
    }
}
