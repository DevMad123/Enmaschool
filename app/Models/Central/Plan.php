<?php
// ===== app/Models/Central/Plan.php =====

declare(strict_types=1);

namespace App\Models\Central;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Plan extends Model
{
    protected $connection = 'central';

    protected $fillable = [
        'name',
        'slug',
        'price_monthly',
        'price_yearly',
        'trial_days',
        'max_students',
        'max_teachers',
        'max_storage_gb',
        'features',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'price_monthly' => 'decimal:2',
            'price_yearly' => 'decimal:2',
            'trial_days' => 'integer',
            'max_students' => 'integer',
            'max_teachers' => 'integer',
            'max_storage_gb' => 'integer',
            'features' => 'array',
            'is_active' => 'boolean',
        ];
    }

    // -------------------------------------------------------------------------
    // Relations
    // -------------------------------------------------------------------------

    public function tenants(): HasMany
    {
        return $this->hasMany(Tenant::class);
    }

    public function planModules(): HasMany
    {
        return $this->hasMany(PlanModule::class);
    }

    public function systemModules(): BelongsToMany
    {
        return $this->belongsToMany(
            SystemModule::class,
            'plan_modules',
            'plan_id',    // FK in pivot → this model (Plan)
            'module_key', // FK in pivot → SystemModule
            'id',         // local key on Plan
            'key'         // local key on SystemModule
        )->withPivot('is_enabled');
    }

    // -------------------------------------------------------------------------
    // Scopes
    // -------------------------------------------------------------------------

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    // -------------------------------------------------------------------------
    // Methods
    // -------------------------------------------------------------------------

    public function hasFeature(string $feature): bool
    {
        $features = $this->features ?? [];

        return in_array('*', $features, true)
            || in_array($feature, $features, true);
    }

    /**
     * Retourne les clés de modules actifs pour ce plan.
     *
     * @return list<string>
     */
    public function getActiveModules(): array
    {
        return $this->planModules()
            ->where('is_enabled', true)
            ->pluck('module_key')
            ->toArray();
    }
}
