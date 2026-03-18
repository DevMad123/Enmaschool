<?php

declare(strict_types=1);

namespace App\Models\Tenant;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Classe extends Model
{
    use SoftDeletes;

    protected $table = 'classes';

    protected $fillable = [
        'academic_year_id',
        'school_level_id',
        'main_teacher_id',
        'room_id',
        'serie',
        'section',
        'display_name',
        'capacity',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'capacity' => 'integer',
        ];
    }

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (Classe $classe): void {
            $classe->display_name = self::generateDisplayName($classe);
        });

        static::updating(function (Classe $classe): void {
            $classe->display_name = self::generateDisplayName($classe);
        });
    }

    // ── Display Name Generation ────────────────────────────────

    public static function generateDisplayName(Classe $classe): string
    {
        $level = $classe->relationLoaded('level')
            ? $classe->level
            : SchoolLevel::find($classe->school_level_id);

        if (! $level) {
            return '';
        }

        if ($level->requires_serie && ! empty($classe->serie)) {
            return "{$level->short_label} {$classe->serie}{$classe->section}";
        }

        return "{$level->label} {$classe->section}";
    }

    // ── Relations ──────────────────────────────────────────────

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function level(): BelongsTo
    {
        return $this->belongsTo(SchoolLevel::class, 'school_level_id');
    }

    public function mainTeacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'main_teacher_id');
    }

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

    public function subjects(): BelongsToMany
    {
        return $this->belongsToMany(Subject::class, 'class_subjects', 'class_id', 'subject_id')
            ->withPivot('coefficient_override', 'hours_per_week', 'is_active')
            ->withTimestamps();
    }

    // ── Scopes ─────────────────────────────────────────────────

    public function scopeForYear(Builder $query, int $yearId): Builder
    {
        return $query->where('academic_year_id', $yearId);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }
}
