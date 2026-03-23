<?php

declare(strict_types=1);

namespace App\Models\Tenant;

use App\Enums\OverrideType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TimetableOverride extends Model
{
    protected $fillable = [
        'timetable_entry_id',
        'date',
        'type',
        'substitute_teacher_id',
        'new_room_id',
        'rescheduled_to_slot_id',
        'reason',
        'notified_at',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'type'         => OverrideType::class,
            'date'         => 'date',
            'notified_at'  => 'datetime',
        ];
    }

    // ── Relations ──────────────────────────────────────────────

    public function timetableEntry(): BelongsTo
    {
        return $this->belongsTo(TimetableEntry::class);
    }

    public function substituteTeacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class, 'substitute_teacher_id');
    }

    public function newRoom(): BelongsTo
    {
        return $this->belongsTo(Room::class, 'new_room_id');
    }

    public function rescheduledToSlot(): BelongsTo
    {
        return $this->belongsTo(TimeSlot::class, 'rescheduled_to_slot_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
