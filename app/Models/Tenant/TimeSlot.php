<?php

declare(strict_types=1);

namespace App\Models\Tenant;

use App\Enums\DayOfWeek;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TimeSlot extends Model
{
    protected $fillable = [
        'name',
        'day_of_week',
        'start_time',
        'end_time',
        'duration_minutes',
        'is_break',
        'order',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'day_of_week'      => DayOfWeek::class,
            'is_break'         => 'boolean',
            'is_active'        => 'boolean',
            'duration_minutes' => 'integer',
            'order'            => 'integer',
        ];
    }

    // ── Relations ──────────────────────────────────────────────

    public function timetableEntries(): HasMany
    {
        return $this->hasMany(TimetableEntry::class);
    }

    // ── Scopes ─────────────────────────────────────────────────

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeForDay($query, int $dayOfWeek)
    {
        return $query->where('day_of_week', $dayOfWeek);
    }

    public function scopeNotBreak($query)
    {
        return $query->where('is_break', false);
    }

    // ── Accessors ──────────────────────────────────────────────

    public function getDayLabelAttribute(): string
    {
        return $this->day_of_week instanceof DayOfWeek
            ? $this->day_of_week->label()
            : '';
    }
}
