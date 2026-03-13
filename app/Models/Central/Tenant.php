<?php
// ===== app/Models/Central/Tenant.php =====

declare(strict_types=1);

namespace App\Models\Central;

use App\Enums\ModuleKey;
use App\Enums\SubscriptionStatus;
use App\Enums\TenantStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Carbon;
use Stancl\Tenancy\Database\Models\Tenant as BaseTenant;
use Stancl\Tenancy\Contracts\TenantWithDatabase;
use Stancl\Tenancy\Database\Concerns\HasDatabase;
use Stancl\Tenancy\Database\Concerns\HasDomains;

class Tenant extends BaseTenant implements TenantWithDatabase
{
    use HasDatabase, HasDomains;

    protected $connection = 'central';

    public static function getCustomColumns(): array
    {
        return [
            'id',
            'name',
            'slug',
            'status',
            'plan_id',
            'trial_ends_at',
            'has_maternelle',
            'has_primary',
            'has_college',
            'has_lycee',
        ];
    }

    protected function casts(): array
    {
        return [
            'status' => TenantStatus::class,
            'plan_id' => 'integer',
            'trial_ends_at' => 'datetime',
            'has_maternelle' => 'boolean',
            'has_primary' => 'boolean',
            'has_college' => 'boolean',
            'has_lycee' => 'boolean',
        ];
    }

    // -------------------------------------------------------------------------
    // Relations
    // -------------------------------------------------------------------------

    public function profile(): HasOne
    {
        return $this->hasOne(TenantProfile::class);
    }

    public function domains(): HasMany
    {
        return $this->hasMany(Domain::class);
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class, 'tenant_id', 'id');
    }

    public function currentSubscription(): HasOne
    {
        return $this->hasOne(Subscription::class, 'tenant_id', 'id')
            ->ofMany(
                ['created_at' => 'max'],
                fn (Builder $q) => $q->whereIn('status', [
                    SubscriptionStatus::Active->value,
                    SubscriptionStatus::Trial->value,
                ])
            );
    }

    public function tenantModules(): HasMany
    {
        return $this->hasMany(TenantModule::class, 'tenant_id', 'id');
    }

    public function activityLogs(): HasMany
    {
        return $this->hasMany(ActivityLog::class, 'tenant_id', 'id');
    }

    public function supportTickets(): HasMany
    {
        return $this->hasMany(SupportTicket::class, 'tenant_id', 'id');
    }

    // -------------------------------------------------------------------------
    // Scopes
    // -------------------------------------------------------------------------

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', TenantStatus::Active);
    }

    public function scopeOnTrial(Builder $query): Builder
    {
        return $query->where('status', TenantStatus::Trial)
            ->where('trial_ends_at', '>', Carbon::now());
    }

    public function scopeTrialExpired(Builder $query): Builder
    {
        return $query->where('status', TenantStatus::Trial)
            ->where('trial_ends_at', '<', Carbon::now());
    }

    // -------------------------------------------------------------------------
    // Methods
    // -------------------------------------------------------------------------

    public function isOnTrial(): bool
    {
        return $this->status === TenantStatus::Trial
            && $this->trial_ends_at !== null
            && $this->trial_ends_at->isFuture();
    }

    public function trialDaysLeft(): int
    {
        if ($this->trial_ends_at === null || $this->trial_ends_at->isPast()) {
            return 0;
        }

        return (int) Carbon::now()->diffInDays($this->trial_ends_at);
    }

    public function getSchoolTypesLabelAttribute(): string
    {
        $types = [];

        if ($this->has_maternelle) {
            $types[] = 'Maternelle';
        }
        if ($this->has_primary) {
            $types[] = 'Primaire';
        }
        if ($this->has_college) {
            $types[] = 'Collège';
        }
        if ($this->has_lycee) {
            $types[] = 'Lycée';
        }

        return implode(' + ', $types);
    }

    public function hasSchoolType(string $type): bool
    {
        $column = 'has_' . $type;

        return (bool) ($this->$column ?? false);
    }

    /**
     * Retourne les clés de modules actifs pour ce tenant.
     * Logique : modules du plan actuel + overrides tenant_modules.
     *
     * @return list<string>
     */
    public function getActiveModules(): array
    {
        $planModuleKeys = PlanModule::where('plan_id', $this->plan_id)
            ->where('is_enabled', true)
            ->pluck('module_key')
            ->toArray();

        $tenantOverrides = TenantModule::where('tenant_id', $this->id)
            ->get()
            ->keyBy('module_key');

        $activeModules = [];

        foreach (ModuleKey::cases() as $module) {
            $key      = $module->value;
            $override = $tenantOverrides->get($key);

            $isEnabled = $override !== null
                ? (bool) $override->is_enabled
                : in_array($key, $planModuleKeys, true);

            if ($isEnabled) {
                $activeModules[] = $key;
            }
        }

        return $activeModules;
    }

    public function hasModule(string $moduleKey): bool
    {
        return in_array($moduleKey, $this->getActiveModules(), true);
    }

    public function getCurrentSubscription(): ?Subscription
    {
        return $this->subscriptions()
            ->whereIn('status', [
                SubscriptionStatus::Active->value,
                SubscriptionStatus::Trial->value,
            ])
            ->orderByDesc('created_at')
            ->first();
    }
}
