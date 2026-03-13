<?php
// ===== app/Models/Central/SystemModule.php =====

declare(strict_types=1);

namespace App\Models\Central;

use App\Enums\ModuleKey;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class SystemModule extends Model
{
    protected $connection = 'central';

    protected $fillable = [
        'key',
        'name',
        'description',
        'icon',
        'is_core',
        'is_active',
        'available_for',
        'order',
    ];

    protected function casts(): array
    {
        return [
            'key'           => ModuleKey::class,
            'is_core'       => 'boolean',
            'is_active'     => 'boolean',
            'available_for' => 'array',
        ];
    }

    // -------------------------------------------------------------------------
    // Relations
    // -------------------------------------------------------------------------

    /**
     * Plans qui ont accès à ce module.
     * Pivot FK : module_key references system_modules.key (non-standard PK)
     */
    public function plans(): BelongsToMany
    {
        return $this->belongsToMany(
            Plan::class,
            'plan_modules',
            'module_key', // FK in pivot → this model
            'plan_id',    // FK in pivot → Plan
            'key',        // local key on SystemModule
            'id'          // local key on Plan
        )->withPivot('is_enabled');
    }

    /**
     * Tenants qui ont ce module (via tenant_modules).
     */
    public function tenants(): BelongsToMany
    {
        return $this->belongsToMany(
            Tenant::class,
            'tenant_modules',
            'module_key', // FK in pivot → this model
            'tenant_id',  // FK in pivot → Tenant
            'key',        // local key on SystemModule
            'id'          // local key on Tenant (UUID)
        )->withPivot('is_enabled', 'enabled_at', 'disabled_at');
    }

    // -------------------------------------------------------------------------
    // Scopes
    // -------------------------------------------------------------------------

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeCore(Builder $query): Builder
    {
        return $query->where('is_core', true);
    }

    public function scopeAvailableFor(Builder $query, string $schoolType): Builder
    {
        return $query->whereJsonContains('available_for', $schoolType);
    }
}
