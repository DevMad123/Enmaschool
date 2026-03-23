<?php

declare(strict_types=1);

namespace App\Models\Tenant;

use App\Enums\JustificationStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AbsenceJustification extends Model
{
    protected $fillable = [
        'enrollment_id',
        'date_from',
        'date_to',
        'reason',
        'document_path',
        'status',
        'reviewed_by',
        'reviewed_at',
        'review_note',
        'submitted_by',
    ];

    protected $casts = [
        'date_from'   => 'date',
        'date_to'     => 'date',
        'status'      => JustificationStatus::class,
        'reviewed_at' => 'datetime',
    ];

    // ── Relations ──────────────────────────────────────────────────────────

    public function enrollment(): BelongsTo
    {
        return $this->belongsTo(Enrollment::class);
    }

    public function reviewedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function submittedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }

    /**
     * Attendances couvertes par cette justification
     * (même enrollment_id + date dans la plage).
     */
    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class, 'enrollment_id', 'enrollment_id')
                    ->whereBetween('date', [$this->date_from, $this->date_to]);
    }

    // ── Scopes ─────────────────────────────────────────────────────────────

    public function scopePending(Builder $query): Builder
    {
        return $query->where('status', 'pending');
    }

    public function scopeApproved(Builder $query): Builder
    {
        return $query->where('status', 'approved');
    }

    public function scopeForEnrollment(Builder $query, int $enrollmentId): Builder
    {
        return $query->where('enrollment_id', $enrollmentId);
    }
}
