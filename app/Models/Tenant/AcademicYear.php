<?php

declare(strict_types=1);

namespace App\Models\Tenant;

use App\Enums\AcademicYearStatus;
use App\Enums\PeriodType;
use App\Enums\PromotionType;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AcademicYear extends Model
{
    protected $fillable = [
        'name',
        'status',
        'start_date',
        'end_date',
        'period_type',
        'is_current',
        'passing_average',
        'promotion_type',
        'closed_at',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'status' => AcademicYearStatus::class,
            'period_type' => PeriodType::class,
            'promotion_type' => PromotionType::class,
            'is_current' => 'boolean',
            'start_date' => 'date',
            'end_date' => 'date',
            'closed_at' => 'datetime',
            'passing_average' => 'decimal:2',
        ];
    }

    protected static function boot(): void
    {
        parent::boot();

        static::saving(function (AcademicYear $year): void {
            if ($year->is_current) {
                static::where('id', '!=', $year->id ?? 0)
                    ->where('is_current', true)
                    ->update(['is_current' => false]);
            }
        });
    }

    // ── Relations ──────────────────────────────────────────────

    public function periods(): HasMany
    {
        return $this->hasMany(Period::class)->orderBy('order');
    }

    public function classes(): HasMany
    {
        return $this->hasMany(Classe::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // ── Scopes ─────────────────────────────────────────────────

    public function scopeCurrent(Builder $query): Builder
    {
        return $query->where('is_current', true);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', AcademicYearStatus::Active);
    }

    // ── Methods ────────────────────────────────────────────────

    public function isClosed(): bool
    {
        return $this->status === AcademicYearStatus::Closed;
    }

    public function canBeActivated(): bool
    {
        return $this->status === AcademicYearStatus::Draft;
    }

    // ── Accessors ──────────────────────────────────────────────

    public function getFormattedDatesAttribute(): string
    {
        return $this->start_date->format('Y') . '-' . $this->end_date->format('Y');
    }
}
