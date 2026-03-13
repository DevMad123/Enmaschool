<?php
// ===== app/Models/Central/ActivityLog.php =====

declare(strict_types=1);

namespace App\Models\Central;

use App\Enums\ActivityType;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ActivityLog extends Model
{
    /**
     * Les logs sont immuables — pas de colonne updated_at.
     */
    public const UPDATED_AT = null;

    protected $connection = 'central';

    protected $fillable = [
        'log_type',
        'actor_type',
        'actor_id',
        'actor_name',
        'tenant_id',
        'tenant_name',
        'activity_type',
        'module',
        'description',
        'subject_type',
        'subject_id',
        'subject_name',
        'properties',
        'ip_address',
        'user_agent',
    ];

    protected function casts(): array
    {
        return [
            'activity_type' => ActivityType::class,
            'properties'    => 'array',
            'created_at'    => 'datetime',
        ];
    }

    // -------------------------------------------------------------------------
    // Relations
    // -------------------------------------------------------------------------

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'tenant_id', 'id');
    }

    // -------------------------------------------------------------------------
    // Scopes
    // -------------------------------------------------------------------------

    public function scopeCentral(Builder $query): Builder
    {
        return $query->where('log_type', 'central');
    }

    public function scopeTenant(Builder $query): Builder
    {
        return $query->where('log_type', 'tenant');
    }

    public function scopeForTenant(Builder $query, string $tenantId): Builder
    {
        return $query->where('tenant_id', $tenantId);
    }

    public function scopeForActor(Builder $query, string $type, int $id): Builder
    {
        return $query->where('actor_type', $type)->where('actor_id', $id);
    }

    public function scopeRecent(Builder $query): Builder
    {
        return $query->orderByDesc('created_at');
    }
}
