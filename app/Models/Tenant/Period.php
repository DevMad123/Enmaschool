<?php

declare(strict_types=1);

namespace App\Models\Tenant;

use App\Enums\PeriodType;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Period extends Model
{
    protected $fillable = [
        'academic_year_id',
        'name',
        'type',
        'order',
        'start_date',
        'end_date',
        'is_current',
        'is_closed',
    ];

    protected function casts(): array
    {
        return [
            'type' => PeriodType::class,
            'is_current' => 'boolean',
            'is_closed' => 'boolean',
            'start_date' => 'date',
            'end_date' => 'date',
            'order' => 'integer',
        ];
    }

    protected static function boot(): void
    {
        parent::boot();

        static::saving(function (Period $period): void {
            if ($period->is_current) {
                static::where('id', '!=', $period->id ?? 0)
                    ->where('academic_year_id', $period->academic_year_id)
                    ->where('is_current', true)
                    ->update(['is_current' => false]);
            }
        });
    }

    // ── Relations ──────────────────────────────────────────────

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class);
    }

    // ── Scopes ─────────────────────────────────────────────────

    public function scopeCurrent(Builder $query): Builder
    {
        return $query->where('is_current', true);
    }
}
