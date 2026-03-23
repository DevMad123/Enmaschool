<?php

declare(strict_types=1);

namespace App\Models\Tenant;

use App\Enums\EvaluationType;
use App\Enums\UserRole;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Evaluation extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'class_id',
        'subject_id',
        'period_id',
        'academic_year_id',
        'teacher_id',
        'title',
        'type',
        'date',
        'max_score',
        'coefficient',
        'is_published',
        'is_locked',
        'description',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'type'         => EvaluationType::class,
            'date'         => 'date',
            'max_score'    => 'decimal:2',
            'coefficient'  => 'decimal:1',
            'is_published' => 'boolean',
            'is_locked'    => 'boolean',
        ];
    }

    // ── Relations ─────────────────────────────────────────────────────────

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

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function grades(): HasMany
    {
        return $this->hasMany(Grade::class);
    }

    // ── Accessors ─────────────────────────────────────────────────────────

    public function getGradesCountAttribute(): int
    {
        return $this->grades()->count();
    }

    public function getAverageScoreAttribute(): float|null
    {
        $avg = $this->grades()->whereNotNull('score')->avg('score');

        return $avg !== null ? (float) $avg : null;
    }

    // ── Methods ───────────────────────────────────────────────────────────

    public function isEditable(): bool
    {
        if ($this->is_locked) {
            return false;
        }

        return !$this->period->is_closed;
    }

    public function canBeEditedBy(User $user): bool
    {
        if ($this->is_locked) {
            return false;
        }

        if (in_array($user->role, [UserRole::SchoolAdmin, UserRole::Director])) {
            return true;
        }

        return $user->teacherProfile?->id === $this->teacher_id;
    }

    // ── Scopes ────────────────────────────────────────────────────────────

    public function scopeForClass(Builder $query, int $classeId): Builder
    {
        return $query->where('class_id', $classeId);
    }

    public function scopeForPeriod(Builder $query, int $periodId): Builder
    {
        return $query->where('period_id', $periodId);
    }

    public function scopeForSubject(Builder $query, int $subjectId): Builder
    {
        return $query->where('subject_id', $subjectId);
    }

    public function scopeForTeacher(Builder $query, int $teacherId): Builder
    {
        return $query->where('teacher_id', $teacherId);
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('is_published', true);
    }

    public function scopeUnlocked(Builder $query): Builder
    {
        return $query->where('is_locked', false);
    }
}
