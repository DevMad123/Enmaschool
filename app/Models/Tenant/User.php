<?php
// ===== app/Models/Tenant/User.php =====

declare(strict_types=1);

namespace App\Models\Tenant;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, HasRoles, Notifiable, SoftDeletes;

    protected $fillable = [
        'first_name',
        'last_name',
        'email',
        'password',
        'avatar',
        'phone',
        'role',
        'status',
        'email_verified_at',
        'last_login_at',
        'settings',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'role' => UserRole::class,
            'status' => UserStatus::class,
            'settings' => 'array',
            'email_verified_at' => 'datetime',
            'last_login_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    // -------------------------------------------------------------------------
    // Scopes
    // -------------------------------------------------------------------------

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', UserStatus::Active);
    }

    public function scopeByRole(Builder $query, UserRole $role): Builder
    {
        return $query->where('role', $role);
    }

    public function scopeStaff(Builder $query): Builder
    {
        return $query->whereIn('role', array_column(UserRole::staffRoles(), 'value'));
    }

    // -------------------------------------------------------------------------
    // Accessors
    // -------------------------------------------------------------------------

    public function getFullNameAttribute(): string
    {
        return $this->first_name . ' ' . $this->last_name;
    }

    public function getAvatarUrlAttribute(): ?string
    {
        if ($this->avatar) {
            return Storage::disk('public')->url($this->avatar);
        }

        $initials = mb_strtoupper(
            mb_substr($this->first_name, 0, 1) . mb_substr($this->last_name, 0, 1)
        );

        return 'https://ui-avatars.com/api/?name=' . urlencode($initials)
            . '&background=4f46e5&color=ffffff&size=128';
    }

    public function isActive(): bool
    {
        return $this->status === UserStatus::Active;
    }

    public function hasModulePermission(string $module, string $action): bool
    {
        return $this->can("{$module}.{$action}");
    }
}
