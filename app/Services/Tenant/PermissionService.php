<?php
// ===== app/Services/Tenant/PermissionService.php =====

declare(strict_types=1);

namespace App\Services\Tenant;

use App\Enums\UserRole;
use App\Models\Tenant\User;
use Illuminate\Support\Collection;
use RuntimeException;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class PermissionService
{
    /**
     * Libellés des modules pour l'affichage.
     */
    private const MODULE_LABELS = [
        'school'         => 'Paramètres école',
        'users'          => 'Utilisateurs',
        'academic_years' => 'Années scolaires',
        'levels'         => 'Niveaux',
        'classes'        => 'Classes',
        'subjects'       => 'Matières',
        'rooms'          => 'Salles',
        'students'       => 'Élèves',
        'grades'         => 'Notes & Évaluations',
        'report_cards'   => 'Bulletins',
        'attendance'     => 'Présences',
        'payments'       => 'Frais scolaires',
        'timetable'      => 'Emploi du temps',
        'messaging'      => 'Communication',
        'reports'        => 'Rapports',
    ];

    /**
     * Libellés des actions.
     */
    private const ACTION_LABELS = [
        'view'     => 'Voir',
        'create'   => 'Créer',
        'edit'     => 'Modifier',
        'delete'   => 'Supprimer',
        'manage'   => 'Gérer',
        'input'    => 'Saisir',
        'validate' => 'Valider',
        'generate' => 'Générer',
        'publish'  => 'Publier',
        'import'   => 'Importer',
        'export'   => 'Exporter',
        'invite'   => 'Inviter',
        'send'     => 'Envoyer',
        'reports'  => 'Rapports',
    ];

    public function getRolesWithPermissions(): Collection
    {
        return Role::where('guard_name', 'web')
            ->with('permissions')
            ->get()
            ->map(function (Role $role): array {
                return [
                    'name'                => $role->name,
                    'label'               => UserRole::tryFrom($role->name)?->label() ?? $role->name,
                    'permissions_count'   => $role->permissions->count(),
                    'permissions_by_module' => $this->groupByModule($role->permissions->pluck('name')),
                ];
            });
    }

    public function updateRolePermissions(string $roleName, array $permissions): void
    {
        if ($roleName === 'school_admin') {
            throw new RuntimeException('Les permissions de l\'administrateur ne peuvent pas être modifiées.');
        }

        $role = Role::where('name', $roleName)->where('guard_name', 'web')->firstOrFail();
        $role->syncPermissions($permissions);
    }

    public function getUserPermissions(User $user): array
    {
        $allPermissions = $user->getAllPermissions()->pluck('name');

        return [
            'user_id'              => $user->id,
            'role'                 => ['value' => $user->role->value, 'label' => $user->role->label()],
            'all_permissions'      => $allPermissions->toArray(),
            'permissions_by_module' => $this->groupByModule($allPermissions),
        ];
    }

    public function canManageRole(User $manager, UserRole $targetRole): bool
    {
        return in_array($targetRole, $manager->role->manageable(), true);
    }

    public function getAvailablePermissions(): array
    {
        $permissions = Permission::where('guard_name', 'web')->pluck('name');
        $result = [];

        foreach ($permissions as $permission) {
            [$module, $action] = array_pad(explode('.', $permission, 2), 2, '');
            // Normaliser le module pour les sous-clés (ex: users.roles.manage → module: users)
            $moduleKey = explode('.', $permission)[0];

            if (!isset($result[$moduleKey])) {
                $result[$moduleKey] = [
                    'key'     => $moduleKey,
                    'label'   => self::MODULE_LABELS[$moduleKey] ?? ucfirst($moduleKey),
                    'actions' => [],
                ];
            }

            $actionKey = ltrim(str_replace($moduleKey . '.', '', $permission), '.');

            $result[$moduleKey]['actions'][] = [
                'key'        => $actionKey,
                'label'      => self::ACTION_LABELS[$actionKey] ?? ucfirst($actionKey),
                'permission' => $permission,
            ];
        }

        return $result;
    }

    /**
     * Groupe une liste de permissions par module.
     *
     * @param  \Illuminate\Support\Collection<int, string>  $permissions
     * @return array<string, string[]>
     */
    private function groupByModule(Collection $permissions): array
    {
        $grouped = [];

        foreach ($permissions as $permission) {
            $parts  = explode('.', $permission);
            $module = $parts[0];
            $action = implode('.', array_slice($parts, 1));

            $grouped[$module][] = $action;
        }

        return $grouped;
    }
}
