<?php
// ===== app/Http/Controllers/Central/ActivityLogController.php =====

declare(strict_types=1);

namespace App\Http\Controllers\Central;

use App\Http\Controllers\Controller;
use App\Http\Resources\Central\ActivityLogResource;
use App\Models\Central\Tenant;
use App\Services\Central\ActivityLogService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ActivityLogController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly ActivityLogService $activityLogService
    ) {}

    // -------------------------------------------------------------------------
    // GET /central/activity-logs
    // -------------------------------------------------------------------------

    public function index(Request $request): JsonResponse
    {
        $filters = array_filter([
            'log_type'      => $request->input('log_type'),
            'actor_type'    => $request->input('actor_type'),
            'tenant_id'     => $request->input('tenant_id'),
            'activity_type' => $request->input('activity_type'),
            'date_from'     => $request->input('date_from'),
            'date_to'       => $request->input('date_to'),
            'search'        => $request->input('search'),
            'per_page'      => 50,
        ], fn ($v) => $v !== null);

        $paginator = $this->activityLogService->getGlobalActivity($filters);

        return $this->paginated(
            $paginator->setCollection(
                $paginator->getCollection()->transform(
                    fn ($log) => new ActivityLogResource($log)
                )
            )
        );
    }

    // -------------------------------------------------------------------------
    // GET /central/tenants/{tenant}/activity
    // -------------------------------------------------------------------------

    public function tenantActivity(Request $request, Tenant $tenant): JsonResponse
    {
        $filters = array_filter([
            'activity_type' => $request->input('activity_type'),
            'date_from'     => $request->input('date_from'),
            'date_to'       => $request->input('date_to'),
            'per_page'      => 50,
        ], fn ($v) => $v !== null);

        $paginator = $this->activityLogService->getTenantActivity($tenant, $filters);

        return $this->paginated(
            $paginator->setCollection(
                $paginator->getCollection()->transform(
                    fn ($log) => new ActivityLogResource($log)
                )
            )
        );
    }

    // -------------------------------------------------------------------------
    // GET /central/activity-logs/export
    // -------------------------------------------------------------------------

    public function export(Request $request): StreamedResponse|JsonResponse
    {
        $filters = array_filter([
            'log_type'      => $request->input('log_type'),
            'actor_type'    => $request->input('actor_type'),
            'tenant_id'     => $request->input('tenant_id'),
            'activity_type' => $request->input('activity_type'),
            'date_from'     => $request->input('date_from'),
            'date_to'       => $request->input('date_to'),
            'per_page'      => 5000,
        ], fn ($v) => $v !== null);

        $paginator = $this->activityLogService->getGlobalActivity($filters);
        $logs      = $paginator->getCollection();

        // Génère un CSV simple (Laravel Excel n'est pas requis dans la stack actuelle)
        $headers = [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="activity-logs-' . now()->format('Y-m-d') . '.csv"',
        ];

        $rows   = [];
        $rows[] = ['Date', 'Acteur', 'Type acteur', 'École', 'Action', 'Description', 'IP'];

        foreach ($logs as $log) {
            $activityType = $log->activity_type;
            $rows[] = [
                $log->created_at?->format('Y-m-d H:i:s'),
                $log->actor_name,
                $log->actor_type,
                $log->tenant_name ?? '',
                $activityType instanceof \App\Enums\ActivityType ? $activityType->label() : (string) $activityType,
                $log->description,
                $log->ip_address ?? '',
            ];
        }

        $callback = function () use ($rows): void {
            $handle = fopen('php://output', 'w');
            // UTF-8 BOM pour Excel
            fwrite($handle, "\xEF\xBB\xBF");
            foreach ($rows as $row) {
                fputcsv($handle, $row, ';');
            }
            fclose($handle);
        };

        return response()->stream($callback, 200, $headers);
    }
}
