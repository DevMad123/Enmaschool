<?php
// ===== app/Models/Central/TenantModule.php =====

declare(strict_types=1);

namespace App\Models\Central;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TenantModule extends Model
{
    protected $connection = 'central';

    protected $fillable = [
        'tenant_id',
        'module_key',
        'is_enabled',
        'enabled_at',
        'disabled_at',
        'enabled_by',
        'disabled_by',
        'override_reason',
    ];

    protected function casts(): array
    {
        return [
            'is_enabled'  => 'boolean',
            'enabled_at'  => 'datetime',
            'disabled_at' => 'datetime',
        ];
    }

    // -------------------------------------------------------------------------
    // Relations
    // -------------------------------------------------------------------------

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'tenant_id', 'id');
    }

    public function enabledBy(): BelongsTo
    {
        return $this->belongsTo(SuperAdmin::class, 'enabled_by');
    }

    public function disabledBy(): BelongsTo
    {
        return $this->belongsTo(SuperAdmin::class, 'disabled_by');
    }
}
