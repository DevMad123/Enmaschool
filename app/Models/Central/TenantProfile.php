<?php
// ===== app/Models/Central/TenantProfile.php =====

declare(strict_types=1);

namespace App\Models\Central;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TenantProfile extends Model
{
    protected $connection = 'central';

    protected $fillable = [
        'tenant_id',
        'logo',
        'address',
        'phone',
        'email',
        'website',
        'city',
        'country',
        'timezone',
        'language',
        'currency',
    ];

    // -------------------------------------------------------------------------
    // Relations
    // -------------------------------------------------------------------------

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}
