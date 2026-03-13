<?php
// ===== app/Http/Middleware/EnsureTenantIsActive.php =====

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Enums\TenantStatus;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureTenantIsActive
{
    public function handle(Request $request, Closure $next): Response
    {
        $tenant = tenant();

        if (! $tenant) {
            return response()->json([
                'success' => false,
                'message' => 'Aucun établissement identifié.',
                'code' => 'NO_TENANT',
            ], 403);
        }

        if ($tenant->status === TenantStatus::Suspended) {
            return response()->json([
                'success' => false,
                'message' => 'L\'établissement est suspendu.',
                'code' => 'TENANT_SUSPENDED',
            ], 403);
        }

        if ($tenant->status === TenantStatus::Cancelled) {
            return response()->json([
                'success' => false,
                'message' => 'L\'abonnement de l\'établissement est annulé.',
                'code' => 'TENANT_CANCELLED',
            ], 403);
        }

        if ($tenant->status === TenantStatus::Trial && $tenant->trial_ends_at?->isPast()) {
            return response()->json([
                'success' => false,
                'message' => 'La période d\'essai est expirée.',
                'code' => 'TRIAL_EXPIRED',
            ], 402);
        }

        return $next($request);
    }
}
