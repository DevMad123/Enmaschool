<?php

declare(strict_types=1);

namespace App\Models\Tenant;

use App\Enums\Gender;
use App\Enums\ParentRelationship;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

// NB: "Parent" est un mot réservé en PHP → ParentModel
class ParentModel extends Model
{
    use SoftDeletes;

    protected $table = 'parents';

    protected $fillable = [
        'first_name',
        'last_name',
        'gender',
        'relationship',
        'phone',
        'phone_secondary',
        'email',
        'profession',
        'address',
        'national_id',
        'is_emergency_contact',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'gender'               => Gender::class,
            'relationship'         => ParentRelationship::class,
            'is_emergency_contact' => 'boolean',
        ];
    }

    // ── Accessors ──────────────────────────────────────────────

    public function getFullNameAttribute(): string
    {
        return "{$this->last_name} {$this->first_name}";
    }

    // ── Relations ──────────────────────────────────────────────

    public function students(): BelongsToMany
    {
        return $this->belongsToMany(Student::class, 'student_parents', 'parent_id', 'student_id')
            ->withPivot('is_primary_contact', 'can_pickup')
            ->withTimestamps();
    }
}
