<?php
// ===== app/Services/Central/ActivityLogService.php =====

declare(strict_types=1);

namespace App\Services\Central;

use App\Enums\ActivityType;
use App\Models\Central\ActivityLog;
use App\Models\Central\SuperAdmin;
use App\Models\Central\Tenant;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ActivityLogService
{
    /**
     * Enregistre une entrée dans le journal d'activité.
     *
     * @param array{
     *   log_type: string,
     *   actor_type: string,
     *   actor_id: int,
     *   actor_name: string,
     *   tenant_id?: string|null,
     *   tenant_name?: string|null,
     *   activity_type: ActivityType|string,
     *   module?: string|null,
     *   description: string,
     *   subject_type?: string|null,
     *   subject_id?: int|null,
     *   subject_name?: string|null,
     *   properties?: array|null,
     *   ip_address?: string|null,
     * } $data
     */
    public function log(array $data): ActivityLog
    {
        $activityType = $data['activity_type'] instanceof ActivityType
            ? $data['activity_type']->value
            : $data['activity_type'];

        return ActivityLog::create([
            'log_type'      => $data['log_type'],
            'actor_type'    => $data['actor_type'],
            'actor_id'      => $data['actor_id'],
            'actor_name'    => $data['actor_name'],
            'tenant_id'     => $data['tenant_id'] ?? null,
            'tenant_name'   => $data['tenant_name'] ?? null,
            'activity_type' => $activityType,
            'module'        => $data['module'] ?? null,
            'description'   => $data['description'],
            'subject_type'  => $data['subject_type'] ?? null,
            'subject_id'    => $data['subject_id'] ?? null,
            'subject_name'  => $data['subject_name'] ?? null,
            'properties'    => $data['properties'] ?? null,
            'ip_address'    => $data['ip_address'] ?? request()->ip(),
            'user_agent'    => $data['user_agent'] ?? request()->userAgent(),
        ]);
    }

    /**
     * Raccourci pour les actions d'un super admin en contexte central.
     */
    public function logSuperAdminAction(
        SuperAdmin $admin,
        string $type,
        string $description,
        array $extra = []
    ): ActivityLog {
        return $this->log(array_merge([
            'log_type'      => 'central',
            'actor_type'    => 'super_admin',
            'actor_id'      => $admin->id,
            'actor_name'    => $admin->name,
            'activity_type' => $type,
            'description'   => $description,
        ], $extra));
    }

    /**
     * Journal d'activité d'un tenant, avec filtres et pagination.
     *
     * @param array{
     *   activity_type?: string,
     *   actor_type?: string,
     *   date_from?: string,
     *   date_to?: string,
     *   per_page?: int,
     * } $filters
     */
    public function getTenantActivity(
        Tenant $tenant,
        array $filters = []
    ): LengthAwarePaginator {
        $query = ActivityLog::where('tenant_id', $tenant->id)
            ->recent();

        $this->applyFilters($query, $filters);

        return $query->paginate($filters['per_page'] ?? 20);
    }

    /**
     * Journal global (toutes actions centrales), avec filtres et pagination.
     *
     * @param array{
     *   activity_type?: string,
     *   actor_type?: string,
     *   log_type?: string,
     *   tenant_id?: string,
     *   date_from?: string,
     *   date_to?: string,
     *   per_page?: int,
     * } $filters
     */
    public function getGlobalActivity(array $filters = []): LengthAwarePaginator
    {
        $query = ActivityLog::recent();

        if (isset($filters['log_type'])) {
            $query->where('log_type', $filters['log_type']);
        }

        if (isset($filters['tenant_id'])) {
            $query->where('tenant_id', $filters['tenant_id']);
        }

        $this->applyFilters($query, $filters);

        return $query->paginate($filters['per_page'] ?? 20);
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    private function applyFilters(\Illuminate\Database\Eloquent\Builder $query, array $filters): void
    {
        if (isset($filters['activity_type'])) {
            $query->where('activity_type', $filters['activity_type']);
        }

        if (isset($filters['actor_type'])) {
            $query->where('actor_type', $filters['actor_type']);
        }

        if (isset($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }

        if (isset($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }
    }
}
