<?php
// ===== app/Http/Controllers/Central/GlobalUserController.php =====

declare(strict_types=1);

namespace App\Http\Controllers\Central;

use App\Http\Controllers\Controller;
use App\Models\Central\Tenant;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

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
    // Helpers
    // -------------------------------------------------------------------------

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
