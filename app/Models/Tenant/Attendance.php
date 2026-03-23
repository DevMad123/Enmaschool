<?php

declare(strict_types=1);

namespace App\Models\Tenant;

use App\Enums\AttendanceStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

class Attendance extends Model
{
    protected $fillable = [
        'enrollment_id',
        'timetable_entry_id',
        'date',
        'period_id',
        'status',
        'minutes_late',
        'recorded_by',
        'recorded_at',
        'note',
    ];

    protected $casts = [
        'date'        => 'date',
        'status'      => AttendanceStatus::class,
        'recorded_at' => 'datetime',
    ];

    // ── Relations ──────────────────────────────────────────────────────────

    public function enrollment(): BelongsTo
    {
        return $this->belongsTo(Enrollment::class);
    }

    public function timetableEntry(): BelongsTo
    {
        return $this->belongsTo(TimetableEntry::class);
    }

    public function period(): BelongsTo
    {
        return $this->belongsTo(Period::class);
    }

    public function recordedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }

    // ── Accessors ──────────────────────────────────────────────────────────

    public function getStudentAttribute(): ?Student
    {
        return $this->enrollment?->student;
    }

    public function getIsAbsentAttribute(): bool
    {
        return $this->status->isAbsent();
    }

    public function getIsPresentAttribute(): bool
    {
        return $this->status->isPresent();
    }

    // ── Scopes ─────────────────────────────────────────────────────────────

    public function scopeForEnrollment(Builder $query, int $enrollmentId): Builder
    {
        return $query->where('enrollment_id', $enrollmentId);
    }

    public function scopeForClass(Builder $query, int $classeId): Builder
    {
        return $query->join('enrollments', 'enrollments.id', '=', 'attendances.enrollment_id')
                     ->where('enrollments.classe_id', $classeId)
                     ->select('attendances.*');
    }

    public function scopeForDate(Builder $query, Carbon|string $date): Builder
    {
        return $query->whereDate('date', $date);
    }

    public function scopeForPeriod(Builder $query, int $periodId): Builder
    {
        return $query->where('period_id', $periodId);
    }

    public function scopeForEntry(Builder $query, int $entryId): Builder
    {
        return $query->where('timetable_entry_id', $entryId);
    }

    public function scopeAbsent(Builder $query): Builder
    {
        return $query->whereIn('status', ['absent', 'excused']);
    }

    public function scopeUnjustified(Builder $query): Builder
    {
        return $query->where('status', 'absent');
    }

    public function scopeJustified(Builder $query): Builder
    {
        return $query->where('status', 'excused');
    }

    public function scopePresent(Builder $query): Builder
    {
        return $query->whereIn('status', ['present', 'late']);
    }

    public function scopeBetweenDates(Builder $query, string $from, string $to): Builder
    {
        return $query->whereBetween('date', [$from, $to]);
    }
}
