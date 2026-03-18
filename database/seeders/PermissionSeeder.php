<?php
// ===== database/seeders/PermissionSeeder.php =====

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class PermissionSeeder extends Seeder
{
    /**
     * Toutes les permissions de la plateforme (format: module.action).
     */
    private const PERMISSIONS = [
        // École
        'school.settings.view',
        'school.settings.edit',

        // Utilisateurs
        'users.view',
        'users.create',
        'users.edit',
        'users.delete',
        'users.invite',
        'users.roles.manage',

        // Années scolaires & Structure
        'academic_years.view',
        'academic_years.manage',
        'levels.view',
        'levels.manage',
        'classes.view',
        'classes.manage',
        'subjects.view',
        'subjects.manage',
        'rooms.view',
        'rooms.manage',

        // Élèves (Phase 4)
        'students.view',
        'students.create',
        'students.edit',
        'students.delete',
        'students.import',

        // Notes (Phase 6)
        'grades.view',
        'grades.input',
        'grades.validate',
        'grades.delete',

        // Bulletins (Phase 7)
        'report_cards.view',
        'report_cards.generate',
        'report_cards.publish',

        // Présences (Phase 9)
        'attendance.view',
        'attendance.input',
        'attendance.reports',

        // Frais scolaires (Phase 10)
        'payments.view',
        'payments.create',
        'payments.validate',
        'payments.reports',

        // Emploi du temps (Phase 8)
        'timetable.view',
        'timetable.manage',

        // Communication (Phase 11)
        'messaging.view',
        'messaging.send',

        // Rapports (Phase 12)
        'reports.view',
        'reports.export',
    ];

    /**
     * Permissions par rôle (hors school_admin qui reçoit tout).
     */
    private const ROLE_PERMISSIONS = [
        'director' => [
            'school.settings.view',
            'users.view', 'users.create', 'users.edit',
            'academic_years.view', 'academic_years.manage',
            'levels.view', 'levels.manage',
            'classes.view', 'classes.manage',
            'subjects.view', 'subjects.manage',
            'rooms.view', 'rooms.manage',
            'students.view', 'students.create', 'students.edit', 'students.import',
            'grades.view', 'grades.validate',
            'report_cards.view', 'report_cards.generate', 'report_cards.publish',
            'attendance.view', 'attendance.reports',
            'payments.view', 'payments.reports',
            'timetable.view', 'timetable.manage',
            'messaging.view', 'messaging.send',
            'reports.view', 'reports.export',
        ],
        'teacher' => [
            'classes.view', 'subjects.view',
            'students.view',
            'grades.view', 'grades.input',
            'report_cards.view',
            'attendance.view', 'attendance.input',
            'timetable.view',
            'messaging.view', 'messaging.send',
        ],
        'accountant' => [
            'students.view',
            'payments.view', 'payments.create', 'payments.validate', 'payments.reports',
            'reports.view', 'reports.export',
        ],
        'staff' => [
            'students.view', 'students.create', 'students.edit',
            'classes.view', 'subjects.view', 'rooms.view',
            'attendance.view',
            'messaging.view',
        ],
    ];

    public function run(): void
    {
        // 1. Créer toutes les permissions (idempotent)
        foreach (self::PERMISSIONS as $permission) {
            Permission::firstOrCreate(
                ['name' => $permission, 'guard_name' => 'web']
            );
        }

        // 2. S'assurer que tous les rôles existent
        $allRoles = ['school_admin', 'director', 'teacher', 'accountant', 'staff', 'student', 'parent'];
        foreach ($allRoles as $roleName) {
            Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
        }

        // 3. school_admin → toutes les permissions
        $schoolAdmin = Role::where('name', 'school_admin')->where('guard_name', 'web')->first();
        if ($schoolAdmin) {
            $schoolAdmin->syncPermissions(Permission::where('guard_name', 'web')->get());
        }

        // 4. Autres rôles → permissions définies
        foreach (self::ROLE_PERMISSIONS as $roleName => $permissions) {
            $role = Role::where('name', $roleName)->where('guard_name', 'web')->first();
            if ($role) {
                $role->syncPermissions($permissions);
            }
        }
    }
}
