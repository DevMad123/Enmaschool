<?php
// ===== app/Observers/Central/TenantObserver.php =====

declare(strict_types=1);

namespace App\Observers\Central;

use App\Enums\ActivityType;
use App\Models\Central\Tenant;
use App\Services\Central\ActivityLogService;

class TenantObserver
{
    public function __construct(
        private readonly ActivityLogService $activityLogService
    ) {}

    /**
     * Déclenché après la création d'un tenant.
     */
    public function created(Tenant $tenant): void
    {
        $this->activityLogService->log([
            'log_type'      => 'central',
            'actor_type'    => 'super_admin',
            'actor_id'      => $this->resolveActorId(),
            'actor_name'    => $this->resolveActorName(),
            'activity_type' => ActivityType::Create,
            'description'   => "École créée : {$tenant->name}",
            'subject_type'  => Tenant::class,
            'subject_name'  => $tenant->name,
            'properties'    => [
                'tenant_id' => $tenant->id,
                'slug'      => $tenant->slug,
            ],
        ]);
    }

    /**
     * Déclenché après la modification d'un tenant.
     * Enregistre les champs modifiés (avant / après).
     */
    public function updated(Tenant $tenant): void
    {
        $changes  = $tenant->getChanges();
        $original = array_intersect_key($tenant->getOriginal(), $changes);

        // Ignorer les mises à jour qui ne touchent que timestamps
        unset($changes['updated_at'], $original['updated_at']);

        if (empty($changes)) {
            return;
        }

        $this->activityLogService->log([
            'log_type'      => 'central',
            'actor_type'    => 'super_admin',
            'actor_id'      => $this->resolveActorId(),
            'actor_name'    => $this->resolveActorName(),
            'activity_type' => ActivityType::Update,
            'description'   => "École modifiée : {$tenant->name}",
            'subject_type'  => Tenant::class,
            'subject_name'  => $tenant->name,
            'properties'    => [
                'before' => $original,
                'after'  => $changes,
            ],
        ]);
    }

    /**
     * Déclenché après la suppression d'un tenant.
     */
    public function deleted(Tenant $tenant): void
    {
        $this->activityLogService->log([
            'log_type'      => 'central',
            'actor_type'    => 'super_admin',
            'actor_id'      => $this->resolveActorId(),
            'actor_name'    => $this->resolveActorName(),
            'activity_type' => ActivityType::Delete,
            'description'   => "École supprimée : {$tenant->name}",
            'subject_type'  => Tenant::class,
            'subject_name'  => $tenant->name,
            'properties'    => [
                'tenant_id' => $tenant->id,
                'slug'      => $tenant->slug,
            ],
        ]);
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private function resolveActorId(): int
    {
        return (int) (auth()->guard('sanctum')->id() ?? 0);
    }

    private function resolveActorName(): string
    {
        /** @var \App\Models\Central\SuperAdmin|null $user */
        $user = auth()->guard('sanctum')->user();

        return $user?->name ?? 'Système';
    }
}
