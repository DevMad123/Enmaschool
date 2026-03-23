<?php
// ===== app/Http/Controllers/Central/GlobalUserController.php =====

declare(strict_types=1);

namespace App\Http\Controllers\Central;

use App\Http\Controllers\Controller;
use App\Models\Central\SuperAdmin;
use App\Models\Central\Tenant;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class GlobalUserController extends Controller
{
    use ApiResponse;

    // -------------------------------------------------------------------------
    // GET /central/users
    // -------------------------------------------------------------------------

    public function index(Request $request): JsonResponse
    {
        $perPage  = min((int) $request->input('per_page', 15), 100);
        $page     = max((int) $request->input('page', 1), 1);
        $search   = $request->input('search');
        $tenantId = $request->input('tenant_id');
        $role     = $request->input('role');
        $status   = $request->input('status');

        // Gather tenant schemas we need to query
        $tenantsQuery = Tenant::query()->with('profile', 'plan');
        if ($tenantId) {
            $tenantsQuery->where('id', $tenantId);
        }
        $tenants = $tenantsQuery->get();

        if ($tenants->isEmpty()) {
            return $this->success([
                'data' => [],
                'meta' => [
                    'current_page' => $page,
                    'last_page'    => 1,
                    'per_page'     => $perPage,
                    'total'        => 0,
                ],
            ]);
        }

        // Build UNION ALL across all tenant schemas
        $centralDb = config('tenancy.database.central_connection', 'central');
        $prefix    = config('tenancy.database.prefix', 'tenant_');
        $suffix    = config('tenancy.database.suffix', '');

        $unions   = [];
        $bindings = [];

        // Include superadmins (central table) unless filtered by tenant or non-superadmin role
        if (! $tenantId && ! $status && (! $role || $role === 'superadmin')) {
            $superSub      = "SELECT sa.id, '' AS first_name, sa.name AS last_name, sa.email, "
                           . "NULL AS avatar, NULL AS phone, "
                           . "'superadmin' AS role, 'active' AS status, sa.last_login_at, sa.created_at, "
                           . "NULL AS tenant_id, 'Super Admin' AS tenant_name, NULL AS tenant_plan "
                           . "FROM super_admins sa WHERE 1=1";
            $superBindings = [];

            if ($search) {
                $like = '%' . $search . '%';
                $superSub .= " AND (sa.name ILIKE ? OR sa.email ILIKE ?)";
                $superBindings = array_merge($superBindings, [$like, $like]);
            }

            $unions[]  = "({$superSub})";
            $bindings  = array_merge($bindings, $superBindings);
        }

        // Include tenant users unless filtered to superadmin-only role
        if ($role !== 'superadmin') {
            foreach ($tenants as $tenant) {
                $schema = $prefix . $tenant->id . $suffix;
                $tenantName = $tenant->name;
                $planName   = $tenant->plan?->name;

                $sub = "SELECT u.id, u.first_name, u.last_name, u.email, u.avatar, u.phone, "
                     . "u.role, u.status, u.last_login_at, u.created_at, "
                     . "? AS tenant_id, ? AS tenant_name, ? AS tenant_plan "
                     . "FROM \"{$schema}\".users u "
                     . "WHERE u.deleted_at IS NULL";

                $subBindings = [$tenant->id, $tenantName, $planName];

                if ($search) {
                    $like = '%' . $search . '%';
                    $sub .= " AND (u.first_name ILIKE ? OR u.last_name ILIKE ? OR u.email ILIKE ?)";
                    $subBindings = array_merge($subBindings, [$like, $like, $like]);
                }
                if ($role) {
                    $sub .= " AND u.role = ?";
                    $subBindings[] = $role;
                }
                if ($status) {
                    $sub .= " AND u.status = ?";
                    $subBindings[] = $status;
                }

                $unions[]  = "({$sub})";
                $bindings  = array_merge($bindings, $subBindings);
            }
        }

        if (empty($unions)) {
            return response()->json([
                'success' => true,
                'data'    => [],
                'meta'    => ['current_page' => $page, 'last_page' => 1, 'per_page' => $perPage, 'total' => 0],
            ]);
        }

        $unionSql = implode(' UNION ALL ', $unions);

        // Count total
        $countSql  = "SELECT COUNT(*) AS total FROM ({$unionSql}) AS all_users";
        $total     = DB::connection($centralDb)->selectOne($countSql, $bindings)->total ?? 0;
        $lastPage  = max((int) ceil($total / $perPage), 1);

        // Fetch page
        $offset = ($page - 1) * $perPage;
        $dataSql = "SELECT * FROM ({$unionSql}) AS all_users ORDER BY created_at DESC LIMIT ? OFFSET ?";
        $rows = DB::connection($centralDb)->select($dataSql, array_merge($bindings, [$perPage, $offset]));

        // Map to frontend-compatible shape
        $data = array_map(fn ($r) => [
            'id'            => $r->id,
            'tenant_id'     => $r->tenant_id,
            'tenant_name'   => $r->tenant_name,
            'first_name'    => $r->first_name,
            'last_name'     => $r->last_name,
            'full_name'     => $r->first_name . ' ' . $r->last_name,
            'email'         => $r->email,
            'role'          => $r->role,
            'role_label'    => $this->roleLabel($r->role),
            'status'        => $r->status,
            'status_label'  => $this->statusLabel($r->status),
            'status_color'  => $this->statusColor($r->status),
            'avatar_url'    => $r->avatar,
            'phone'         => $r->phone,
            'last_login_at' => $r->last_login_at,
            'created_at'    => $r->created_at,
            'tenant_plan'   => $r->tenant_plan,
        ], $rows);

        return response()->json([
            'success' => true,
            'data'    => $data,
            'meta'    => [
                'current_page' => $page,
                'last_page'    => $lastPage,
                'per_page'     => $perPage,
                'total'        => (int) $total,
            ],
        ]);
    }

    // -------------------------------------------------------------------------
    // POST /central/users/{id}/deactivate
    // -------------------------------------------------------------------------

    public function deactivate(Request $request): JsonResponse
    {
        $id       = $request->route('id');
        $tenantId = $request->input('tenant_id');

        if (! $tenantId) {
            return $this->error('tenant_id est requis.', 422);
        }

        $schema = $this->tenantSchema((string) $tenantId);
        if (! $schema) {
            return $this->error('École introuvable.', 404);
        }

        $centralDb = config('tenancy.database.central_connection', 'central');
        $updated = DB::connection($centralDb)->table("{$schema}.users")
            ->where('id', $id)
            ->update(['status' => 'inactive', 'updated_at' => now()]);

        if (! $updated) {
            return $this->error('Utilisateur introuvable.', 404);
        }

        return $this->success(null, 'Utilisateur désactivé.');
    }

    // -------------------------------------------------------------------------
    // POST /central/users/bulk-deactivate
    // -------------------------------------------------------------------------

    public function bulkDeactivate(Request $request): JsonResponse
    {
        $request->validate(['ids' => 'required|array']);

        // ids = array of { id, tenant_id }
        $ids = $request->input('ids', []);
        $count = 0;

        // We need tenant_id per user to know which schema to update.
        // Since GlobalUsersPage sends plain user IDs (not with tenant), we skip this for now.
        // TODO: improve by passing tenant_id with each user id.

        return $this->success(['count' => $count], "{$count} utilisateur(s) désactivé(s).");
    }

    // -------------------------------------------------------------------------
    // POST /central/users/{id}/reset-password
    // -------------------------------------------------------------------------

    public function resetPassword(Request $request): JsonResponse
    {
        $id       = $request->route('id');
        $tenantId = $request->input('tenant_id');
        $temporary = Str::random(12);

        // Superadmin: tenant_id is null — update central super_admins table
        if (! $tenantId) {
            $superAdmin = SuperAdmin::find($id);
            if (! $superAdmin) {
                return $this->error('Utilisateur introuvable.', 404);
            }
            $superAdmin->update(['password' => Hash::make($temporary)]);

            return $this->success(
                ['temporary_password' => $temporary],
                'Mot de passe réinitialisé.',
            );
        }

        $schema = $this->tenantSchema((string) $tenantId);
        if (! $schema) {
            return $this->error('École introuvable.', 404);
        }

        $centralDb = config('tenancy.database.central_connection', 'central');
        $updated = DB::connection($centralDb)->table("{$schema}.users")
            ->where('id', $id)
            ->update(['password' => Hash::make($temporary), 'updated_at' => now()]);

        if (! $updated) {
            return $this->error('Utilisateur introuvable.', 404);
        }

        return $this->success(
            ['temporary_password' => $temporary],
            'Mot de passe réinitialisé.',
        );
    }

    // -------------------------------------------------------------------------
    // GET /central/users/{id}/activity
    // -------------------------------------------------------------------------

    public function activity(Request $request): JsonResponse
    {
        $id       = $request->route('id');
        $tenantId = $request->input('tenant_id');

        if (! $tenantId) {
            return $this->success([]);
        }

        $schema = $this->tenantSchema((string) $tenantId);
        if (! $schema) {
            return $this->success([]);
        }

        $centralDb = config('tenancy.database.central_connection', 'central');

        try {
            $logs = DB::connection($centralDb)
                ->table("{$schema}.activity_logs")
                ->where('causer_id', $id)
                ->orderByDesc('created_at')
                ->limit(20)
                ->get(['id', 'description', 'activity_type', 'created_at']);

            return $this->success($logs->toArray());
        } catch (\Exception) {
            return $this->success([]);
        }
    }

    // -------------------------------------------------------------------------
    // GET /central/users/{id}
    // -------------------------------------------------------------------------

    public function show(Request $request): JsonResponse
    {
        $id       = $request->route('id');
        $tenantId = $request->input('tenant_id');

        if (! $tenantId) {
            return $this->error('tenant_id est requis.', 422);
        }

        $tenant = Tenant::with('profile', 'plan')->find($tenantId);
        if (! $tenant) {
            return $this->error('École introuvable.', 404);
        }

        $schema    = $this->tenantSchema((string) $tenantId);
        $centralDb = config('tenancy.database.central_connection', 'central');

        $r = DB::connection($centralDb)
            ->table("{$schema}.users")
            ->where('id', $id)
            ->first();

        if (! $r) {
            return $this->error('Utilisateur introuvable.', 404);
        }

        return $this->success([
            'id'            => $r->id,
            'tenant_id'     => $tenant->id,
            'tenant_name'   => $tenant->name,
            'tenant_plan'   => $tenant->plan?->name,
            'first_name'    => $r->first_name,
            'last_name'     => $r->last_name,
            'full_name'     => $r->first_name . ' ' . $r->last_name,
            'email'         => $r->email,
            'role'          => $r->role,
            'role_label'    => $this->roleLabel($r->role),
            'status'        => $r->status,
            'status_label'  => $this->statusLabel($r->status),
            'status_color'  => $this->statusColor($r->status),
            'avatar_url'    => $r->avatar,
            'phone'         => $r->phone,
            'last_login_at' => $r->last_login_at,
            'created_at'    => $r->created_at,
        ]);
    }

    // -------------------------------------------------------------------------
    // GET /central/users/export
    // -------------------------------------------------------------------------

    public function export(Request $request): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $filters  = $request->only(['search', 'tenant_id', 'role', 'status']);
        $tenants  = Tenant::with('profile', 'plan')->get();
        $centralDb = config('tenancy.database.central_connection', 'central');
        $prefix    = config('tenancy.database.prefix', 'tenant_');
        $suffix    = config('tenancy.database.suffix', '');

        $rows = [];
        foreach ($tenants as $tenant) {
            if (! empty($filters['tenant_id']) && $filters['tenant_id'] !== $tenant->id) {
                continue;
            }
            $schema = $prefix . $tenant->id . $suffix;
            try {
                $query = DB::connection($centralDb)->table("{$schema}.users")
                    ->whereNull('deleted_at')
                    ->select('first_name', 'last_name', 'email', 'role', 'status');

                if (! empty($filters['role'])) {
                    $query->where('role', $filters['role']);
                }
                if (! empty($filters['status'])) {
                    $query->where('status', $filters['status']);
                }
                foreach ($query->get() as $r) {
                    $rows[] = [$r->first_name . ' ' . $r->last_name, $r->email, $r->role, $r->status, $tenant->name];
                }
            } catch (\Exception) {
                // Skip schemas that don't exist yet
            }
        }

        $headers = ['Content-Type' => 'text/csv', 'Content-Disposition' => 'attachment; filename="users.csv"'];

        return response()->stream(function () use ($rows): void {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['Nom', 'Email', 'Rôle', 'Statut', 'École']);
            foreach ($rows as $row) {
                fputcsv($out, $row);
            }
            fclose($out);
        }, 200, $headers);
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private function tenantSchema(string $tenantId): ?string
    {
        $prefix = config('tenancy.database.prefix', 'tenant_');
        $suffix = config('tenancy.database.suffix', '');
        $tenant = Tenant::find($tenantId);

        return $tenant ? $prefix . $tenantId . $suffix : null;
    }

    private function roleLabel(string $role): string
    {
        return match ($role) {
            'school_admin' => 'Administrateur scolaire',
            'director'     => 'Directeur',
            'teacher'      => 'Enseignant',
            'accountant'   => 'Comptable',
            'staff'        => 'Personnel',
            'student'      => 'Élève',
            'parent'       => 'Parent',
            default        => ucfirst($role),
        };
    }

    private function statusLabel(string $status): string
    {
        return match ($status) {
            'active'    => 'Actif',
            'inactive'  => 'Inactif',
            'suspended' => 'Suspendu',
            default     => ucfirst($status),
        };
    }

    private function statusColor(string $status): string
    {
        return match ($status) {
            'active'    => 'green',
            'inactive'  => 'gray',
            'suspended' => 'red',
            default     => 'gray',
        };
    }
}
