<?php

declare(strict_types=1);

namespace App\Models\Tenant;

use App\Enums\ContractType;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Cache;

class Teacher extends Model
{
    protected $fillable = [
        'user_id',
        'employee_number',
        'speciality',
        'diploma',
        'hire_date',
        'contract_type',
        'weekly_hours_max',
        'biography',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'contract_type'    => ContractType::class,
            'hire_date'        => 'date',
            'is_active'        => 'boolean',
            'weekly_hours_max' => 'integer',
        ];
    }

    // ── Boot ───────────────────────────────────────────────────

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (Teacher $teacher): void {
            if (empty($teacher->employee_number)) {
                $teacher->employee_number = self::generateEmployeeNumber();
            }
        });
    }

    /**
     * Génère un numéro de matricule employé unique.
     * Format : ENS-{YEAR}-{SEQ_4DIGITS}  ex: "ENS-2024-0042"
     */
    public static function generateEmployeeNumber(): string
    {
        $year = now()->year;
        $prefix = "ENS-{$year}-";

        $last = static::where('employee_number', 'like', $prefix.'%')
            ->orderByRaw("CAST(SUBSTRING(employee_number FROM ".(\strlen($prefix) + 1).") AS INTEGER) DESC")
            ->value('employee_number');

        $sequence = $last ? (int) substr($last, \strlen($prefix)) + 1 : 1;

        return $prefix.str_pad((string) $sequence, 4, '0', STR_PAD_LEFT);
    }

    // ── Accessors ──────────────────────────────────────────────

    public function getFullNameAttribute(): string
    {
        return $this->user?->full_name ?? '';
    }

    public function getEmailAttribute(): string
    {
        return $this->user?->email ?? '';
    }

    public function getAvatarUrlAttribute(): ?string
    {
        return $this->user?->avatar_url;
    }

    /**
     * Heures hebdomadaires effectives (calculées depuis teacher_classes actives pour l'année courante).
     * Mise en cache 5 minutes.
     */
    public function getWeeklyHoursAttribute(): float
    {
        return Cache::remember("teacher_{$this->id}_weekly_hours", 300, function () {
            $currentYear = AcademicYear::where('status', 'active')->value('id');
            if (! $currentYear) {
                return 0.0;
            }

            return (float) $this->assignments()
                ->where('is_active', true)
                ->where('academic_year_id', $currentYear)
                ->sum('hours_per_week');
        });
    }

    public function getWeeklyHoursRemainingAttribute(): float
    {
        return max(0.0, $this->weekly_hours_max - $this->weekly_hours);
    }

    public function isOverloaded(): bool
    {
        return $this->weekly_hours > $this->weekly_hours_max;
    }

    // ── Relations ──────────────────────────────────────────────

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function subjects(): BelongsToMany
    {
        return $this->belongsToMany(Subject::class, 'teacher_subjects', 'teacher_id', 'subject_id')
            ->withPivot('is_primary')
            ->withTimestamps();
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(TeacherClass::class);
    }

    public function activeAssignments(): HasMany
    {
        return $this->hasMany(TeacherClass::class)->where('is_active', true);
    }

    public function classes(): BelongsToMany
    {
        return $this->belongsToMany(Classe::class, 'teacher_classes', 'teacher_id', 'class_id')
            ->withPivot('subject_id', 'hours_per_week', 'is_active')
            ->withTimestamps();
    }

    // ── Scopes ─────────────────────────────────────────────────

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeBySubject(Builder $query, int $subjectId): Builder
    {
        return $query->whereHas('subjects', fn (Builder $q) => $q->where('subjects.id', $subjectId));
    }

    public function scopeByClass(Builder $query, int $classeId, int $yearId): Builder
    {
        return $query->whereHas(
            'assignments',
            fn (Builder $q) => $q->where('class_id', $classeId)
                ->where('academic_year_id', $yearId)
                ->where('is_active', true)
        );
    }

    public function scopeWithHours(Builder $query, int $yearId): Builder
    {
        return $query->withSum(
            ['assignments as weekly_hours_sum' => fn (Builder $q) => $q->where('is_active', true)->where('academic_year_id', $yearId)],
            'hours_per_week'
        );
    }
}
