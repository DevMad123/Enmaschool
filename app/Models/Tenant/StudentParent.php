<?php

declare(strict_types=1);

namespace App\Models\Tenant;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentParent extends Model
{
    protected $table = 'student_parents';

    protected $fillable = [
        'student_id',
        'parent_id',
        'is_primary_contact',
        'can_pickup',
    ];

    protected function casts(): array
    {
        return [
            'is_primary_contact' => 'boolean',
            'can_pickup'         => 'boolean',
        ];
    }

    // ── Relations ──────────────────────────────────────────────

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(ParentModel::class, 'parent_id');
    }
}
