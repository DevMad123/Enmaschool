<?php

declare(strict_types=1);

namespace App\Models\Tenant;

use App\Enums\FeeAppliesTo;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FeeType extends Model
{
    protected $fillable = [
        'name',
        'code',
        'description',
        'is_mandatory',
        'is_recurring',
        'applies_to',
        'order',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'applies_to'   => FeeAppliesTo::class,
            'is_mandatory' => 'boolean',
            'is_recurring' => 'boolean',
            'is_active'    => 'boolean',
        ];
    }

    // ── Relations ──────────────────────────────────────────────────────

    public function schedules(): HasMany
    {
        return $this->hasMany(FeeSchedule::class);
    }

    public function studentFees(): HasMany
    {
        return $this->hasMany(StudentFee::class);
    }

    // ── Scopes ─────────────────────────────────────────────────────────

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeMandatory(Builder $query): Builder
    {
        return $query->where('is_mandatory', true);
    }

    /**
     * Filtre les types de frais applicables à une catégorie de niveau.
     * Inclut les frais 'all' et ceux spécifiques à la catégorie donnée.
     */
    public function scopeForCategory(Builder $query, string $category): Builder
    {
        return $query->whereIn('applies_to', ['all', $category]);
    }
}
