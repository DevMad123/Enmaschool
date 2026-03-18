<?php

declare(strict_types=1);

namespace App\Models\Tenant;

use App\Enums\LevelCategory;
use App\Enums\LevelCode;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class SchoolLevel extends Model
{
    protected $fillable = [
        'code',
        'category',
        'label',
        'short_label',
        'order',
        'requires_serie',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'category' => LevelCategory::class,
            'code' => LevelCode::class,
            'requires_serie' => 'boolean',
            'is_active' => 'boolean',
            'order' => 'integer',
        ];
    }

    // ── Scopes ─────────────────────────────────────────────────

    /**
     * Filtre les niveaux selon les types d'école activés pour le tenant courant.
     */
    public function scopeForTenant(Builder $query): Builder
    {
        $tenant = tenant();

        if (! $tenant) {
            return $query;
        }

        $excludedCategories = [];

        if (! $tenant->has_maternelle) {
            $excludedCategories[] = LevelCategory::Maternelle->value;
        }
        if (! $tenant->has_primary) {
            $excludedCategories[] = LevelCategory::Primaire->value;
        }
        if (! $tenant->has_college) {
            $excludedCategories[] = LevelCategory::College->value;
        }
        if (! $tenant->has_lycee) {
            $excludedCategories[] = LevelCategory::Lycee->value;
        }

        if (! empty($excludedCategories)) {
            $query->whereNotIn('category', $excludedCategories);
        }

        return $query;
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    // ── Methods ────────────────────────────────────────────────

    public function requiresSerie(): bool
    {
        return $this->code->requiresSerie();
    }
}
