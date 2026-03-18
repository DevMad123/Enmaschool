<?php

declare(strict_types=1);

namespace App\Models\Tenant;

use App\Enums\RoomType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Room extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'code',
        'type',
        'capacity',
        'floor',
        'building',
        'equipment',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'type' => RoomType::class,
            'equipment' => 'array',
            'is_active' => 'boolean',
            'capacity' => 'integer',
        ];
    }

    // ── Relations ──────────────────────────────────────────────

    public function classes(): HasMany
    {
        return $this->hasMany(Classe::class);
    }
}
