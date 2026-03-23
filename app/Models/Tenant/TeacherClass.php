<?php

declare(strict_types=1);

namespace App\Models\Tenant;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

// NB : pas de soft_deletes — si on retire un enseignant → is_active = false.
// L'historique est conservé.
class TeacherClass extends Model
{
    protected $table = 'teacher_classes';

    protected $fillable = [
        'teacher_id',
        'class_id',
        'subject_id',
        'academic_year_id',
        'hours_per_week',
        'is_active',
        'assigned_at',
        'assigned_by',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'is_active'     => 'boolean',
            'assigned_at'   => 'date',
            'hours_per_week' => 'float',
        ];
    }

    // ── Accessors ──────────────────────────────────────────────

    /**
     * Heures effectives : hours_per_week de cette affectation,
     * ou fallback sur le class_subjects correspondant, ou 0.
     */
    public function getEffectiveHoursAttribute(): float
    {
        if ($this->hours_per_week !== null) {
            return (float) $this->hours_per_week;
        }

        // Fallback : hours_per_week dans class_subjects
        $classSubject = ClassSubject::where('class_id', $this->class_id)
            ->where('subject_id', $this->subject_id)
            ->value('hours_per_week');

        return (float) ($classSubject ?? 0);
    }

    // ── Relations ──────────────────────────────────────────────

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class);
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

    public function assignedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_by');
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

    public function scopeForTeacher(Builder $query, int $teacherId): Builder
    {
        return $query->where('teacher_id', $teacherId);
    }

    public function scopeForClasse(Builder $query, int $classeId): Builder
    {
        return $query->where('class_id', $classeId);
    }
}
