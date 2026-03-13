<?php
// ===== app/Services/Central/SubscriptionService.php =====

declare(strict_types=1);

namespace App\Services\Central;

use App\Enums\SubscriptionStatus;
use App\Enums\TenantStatus;
use App\Models\Central\Plan;
use App\Models\Central\Subscription;
use App\Models\Central\SuperAdmin;
use App\Models\Central\Tenant;
use Illuminate\Support\Collection;

class SubscriptionService
{
    public function __construct(
        private readonly ModuleService      $moduleService,
        private readonly ActivityLogService $activityLogService
    ) {}

    /**
     * Assigne un nouveau plan à un tenant et crée une subscription.
     *
     * @param array{
     *   starts_at?: \DateTimeInterface|string|null,
     *   ends_at?: \DateTimeInterface|string|null,
     *   billing_cycle?: string|null,
     *   price_paid?: float|null,
     *   notes?: string|null,
     * } $options
     */
    public function assignPlan(
        Tenant $tenant,
        Plan $plan,
        array $options,
        SuperAdmin $by
    ): Subscription {
        // 1. Désactiver les subscriptions actives/trial actuelles
        Subscription::where('tenant_id', $tenant->id)
            ->whereIn('status', [
                SubscriptionStatus::Active->value,
                SubscriptionStatus::Trial->value,
            ])
            ->update([
                'status'       => SubscriptionStatus::Cancelled->value,
                'cancelled_at' => now(),
            ]);

        // 2. Créer la nouvelle subscription
        $subscription = Subscription::create([
            'tenant_id'     => $tenant->id,
            'plan_id'       => $plan->id,
            'status'        => SubscriptionStatus::Active->value,
            'starts_at'     => $options['starts_at'] ?? now(),
            'ends_at'       => $options['ends_at'] ?? null,
            'billing_cycle' => $options['billing_cycle'] ?? null,
            'price_paid'    => $options['price_paid'] ?? null,
            'notes'         => $options['notes'] ?? null,
            'created_by'    => $by->id,
        ]);

        // 3. Mettre à jour le plan du tenant
        $tenant->update(['plan_id' => $plan->id, 'status' => TenantStatus::Active]);

        // 4. Synchroniser les modules selon le nouveau plan
        $this->moduleService->syncModulesFromPlan($tenant, $plan);

        // 5. Log
        $this->activityLogService->logSuperAdminAction(
            admin: $by,
            type: 'update',
            description: "Plan changé vers «{$plan->name}» pour «{$tenant->name}»",
            extra: [
                'tenant_id'   => $tenant->id,
                'tenant_name' => $tenant->name,
                'properties'  => [
                    'plan'          => $plan->name,
                    'billing_cycle' => $options['billing_cycle'] ?? null,
                    'price_paid'    => $options['price_paid'] ?? null,
                ],
            ]
        );

        return $subscription->load(['plan', 'createdBy']);
    }

    /**
     * Annule une subscription.
     */
    public function cancelSubscription(
        Subscription $subscription,
        string $reason,
        SuperAdmin $by
    ): void {
        $subscription->update([
            'status'               => SubscriptionStatus::Cancelled->value,
            'cancelled_at'         => now(),
            'cancellation_reason'  => $reason,
        ]);

        $tenant = $subscription->tenant;

        if ($tenant !== null) {
            $tenant->update(['status' => TenantStatus::Suspended]);
        }

        $this->activityLogService->logSuperAdminAction(
            admin: $by,
            type: 'update',
            description: "Subscription annulée" . ($tenant ? " pour «{$tenant->name}»" : ''),
            extra: [
                'tenant_id'   => $tenant?->id,
                'tenant_name' => $tenant?->name,
                'properties'  => ['reason' => $reason, 'subscription_id' => $subscription->id],
            ]
        );
    }

    /**
     * Retourne les subscriptions trial qui expirent dans $daysAhead jours.
     */
    public function getExpiringTrials(int $daysAhead = 3): Collection
    {
        return Subscription::where('status', SubscriptionStatus::Trial->value)
            ->where('trial_ends_at', '<=', now()->addDays($daysAhead))
            ->where('trial_ends_at', '>=', now())
            ->with(['tenant', 'plan'])
            ->get();
    }
}
