<?php

declare(strict_types=1);

namespace App\Models\Tenant;

use App\Enums\SubjectCategory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Subject extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'code',
        'coefficient',
        'color',
        'category',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'category' => SubjectCategory::class,
            'is_active' => 'boolean',
            'coefficient' => 'decimal:1',
        ];
    }

    // ── Relations ──────────────────────────────────────────────

    public function classes(): BelongsToMany
    {
        return $this->belongsToMany(Classe::class, 'class_subjects', 'subject_id', 'class_id')
            ->withPivot('coefficient_override', 'hours_per_week', 'is_active')
            ->withTimestamps();
    }
}
