<?php
// ===== app/Models/Central/PlanModule.php =====

declare(strict_types=1);

namespace App\Models\Central;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PlanModule extends Model
{
    protected $connection = 'central';

    protected $fillable = [
        'plan_id',
        'module_key',
        'is_enabled',
    ];

    protected function casts(): array
    {
        return [
            'is_enabled' => 'boolean',
        ];
    }

    // -------------------------------------------------------------------------
    // Relations
    // -------------------------------------------------------------------------

    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    public function module(): BelongsTo
    {
        return $this->belongsTo(SystemModule::class, 'module_key', 'key');
    }
}
