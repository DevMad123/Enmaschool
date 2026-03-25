// ===== src/app/routes.tsx =====

import { useState, useEffect } from 'react';
import { Navigate, type RouteObject } from 'react-router-dom';
import { useAuthStore } from '@/modules/auth/store/authStore';

// ── Pages ────────────────────────────────────────────────────────────
import { LoginPage } from '@/modules/auth/pages/LoginPage';
import { AdminLoginPage } from '@/modules/superadmin/pages/AdminLoginPage';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { SuperAdminLayout } from '@/modules/superadmin/layout/SuperAdminLayout';
import { DashboardPage as SuperAdminDashboardPage } from '@/modules/superadmin/pages/DashboardPage';
import { TenantListPage } from '@/modules/superadmin/pages/tenants/TenantListPage';
import { TenantDetailPage } from '@/modules/superadmin/pages/tenants/TenantDetailPage';
import { CreateTenantPage } from '@/modules/superadmin/pages/tenants/CreateTenantPage';
import { EditTenantPage } from '@/modules/superadmin/pages/tenants/EditTenantPage';
import { PlanListPage } from '@/modules/superadmin/pages/plans/PlanListPage';
import { GlobalUsersPage } from '@/modules/superadmin/pages/users/GlobalUsersPage';
import { SystemModulesPage } from '@/modules/superadmin/pages/modules/SystemModulesPage';
import { ActivityLogPage } from '@/modules/superadmin/pages/activity/ActivityLogPage';
import { TicketListPage } from '@/modules/superadmin/pages/support/TicketListPage';
import { TicketDetailPage } from '@/modules/superadmin/pages/support/TicketDetailPage';
import { SystemSettingsPage } from '@/modules/superadmin/pages/settings/SystemSettingsPage';

// ── School module pages (Phase 2) ────────────────────────────────────
import { SchoolSettingsPage } from '@/modules/school/pages/SchoolSettingsPage';
import { AcademicYearsPage } from '@/modules/school/pages/AcademicYearsPage';
import { SchoolLevelsPage } from '@/modules/school/pages/SchoolLevelsPage';
import { ClassesPage } from '@/modules/school/pages/ClassesPage';
import { ClasseDetailPage } from '@/modules/school/pages/ClasseDetailPage';
import { SubjectsPage } from '@/modules/school/pages/SubjectsPage';
import { RoomsPage } from '@/modules/school/pages/RoomsPage';

// ── School module pages (Phase 4) ────────────────────────────────────
import { StudentsPage } from '@/modules/school/pages/StudentsPage';
import { StudentDetailPage } from '@/modules/school/pages/StudentDetailPage';

// ── School module pages (Phase 5) ────────────────────────────────────
import { TeachersPage } from '@/modules/school/pages/TeachersPage';
import { TeacherDetailPage } from '@/modules/school/pages/TeacherDetailPage';

// ── School module pages (Phase 6) ────────────────────────────────────
import { GradesPage } from '@/modules/school/pages/GradesPage';
import { GradesSheetPage } from '@/modules/school/pages/GradesSheetPage';
import { StudentGradesSummaryPage } from '@/modules/school/pages/StudentGradesSummaryPage';
import { ClassGradesSummaryPage } from '@/modules/school/pages/ClassGradesSummaryPage';

// ── School module pages (Phase 7) ────────────────────────────────────
import { ReportCardsPage } from '@/modules/school/pages/ReportCardsPage';
import { ReportCardEditorPage } from '@/modules/school/pages/ReportCardEditorPage';

// ── School module pages (Phase 8) ────────────────────────────────────
import { TimetablePage } from '@/modules/school/pages/TimetablePage';

// ── School module pages (Phase 9) ────────────────────────────────────
import { AttendancePage } from '@/modules/school/pages/AttendancePage';
import { AttendanceSheetPage } from '@/modules/school/pages/AttendanceSheetPage';
import { ClassAttendanceStatsPage } from '@/modules/school/pages/ClassAttendanceStatsPage';
import { JustificationsPage } from '@/modules/school/pages/JustificationsPage';

// ── School module pages (Phase 10) ───────────────────────────────────
import { PaymentsPage } from '@/modules/school/pages/PaymentsPage';
import { StudentPaymentPage } from '@/modules/school/pages/StudentPaymentPage';
import { FeeConfigPage } from '@/modules/school/pages/FeeConfigPage';
import { DailyReportPage } from '@/modules/school/pages/DailyReportPage';

// ── School module pages (Phase 11) ───────────────────────────────────
import { MessagingPage } from '@/modules/school/pages/MessagingPage';
import { AnnouncementsPage } from '@/modules/school/pages/AnnouncementsPage';

// ── School module pages (Phase 12) ───────────────────────────────────
import { SchoolDashboardPage } from '@/modules/school/pages/SchoolDashboardPage';
import { DirectionDashboardPage } from '@/modules/school/pages/DirectionDashboardPage';
import { AcademicDashboardPage } from '@/modules/school/pages/AcademicDashboardPage';
import { AttendanceDashboardPage } from '@/modules/school/pages/AttendanceDashboardPage';
import { FinancialDashboardPage } from '@/modules/school/pages/FinancialDashboardPage';
import { TeacherDashboardPage } from '@/modules/school/pages/TeacherDashboardPage';
import { ReportsPage } from '@/modules/school/pages/ReportsPage';

// ── School module pages (Phase 3) ────────────────────────────────────
import { UsersPage } from '@/modules/school/pages/users/UsersPage';
import { UserDetailPage } from '@/modules/school/pages/users/UserDetailPage';
import { InvitationsPage } from '@/modules/school/pages/users/InvitationsPage';
import { RolesPermissionsPage } from '@/modules/school/pages/users/RolesPermissionsPage';
import { AcceptInvitationPage } from '@/modules/school/pages/users/AcceptInvitationPage';

// ── Hydration hook (waits for Zustand persist to rehydrate from localStorage)
function useHydrated() {
  const [hydrated, setHydrated] = useState(() => useAuthStore.persist.hasHydrated());
  useEffect(() => {
    if (hydrated) return;
    const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
    // Guard against hydration completing between render and this effect firing
    if (useAuthStore.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return hydrated;
}

// ── Guard : authenticated (tenant) ──────────────────────────────────
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const hydrated = useHydrated();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!hydrated) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// ── Guard : authenticated (super_admin) ──────────────────────────────
function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const hydrated = useHydrated();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const roles = useAuthStore((s) => s.roles);

  if (!hydrated) return null;

  if (!isAuthenticated || !roles.includes('super_admin')) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}

// ── Guard : role-based (tenant) ───────────────────────────────────────
function RoleRoute({
  roles,
  children,
}: {
  roles: string[];
  children: React.ReactNode;
}) {
  const userRoles = useAuthStore((s) => s.roles);
  const hasAccess = roles.some((r) => userRoles.includes(r));

  if (!hasAccess) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}

// ── Status pages ─────────────────────────────────────────────────────
function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">403</h1>
        <p className="text-lg text-gray-600 mb-6">
          Accès refusé. Vous n&apos;avez pas la permission d&apos;accéder à
          cette page.
        </p>
        <a
          href="/dashboard"
          className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Retour au tableau de bord
        </a>
      </div>
    </div>
  );
}

function TrialExpiredPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center max-w-md">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
          <svg
            className="h-8 w-8 text-amber-600"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Période d&apos;essai expirée
        </h1>
        <p className="text-gray-600 mb-6">
          Votre période d&apos;essai est terminée. Contactez notre équipe pour
          activer votre abonnement et continuer à utiliser Enma School.
        </p>
        <a
          href="mailto:support@enmaschool.com"
          className="inline-flex items-center rounded-lg bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Contacter le support
        </a>
      </div>
    </div>
  );
}

function SuspendedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center max-w-md">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <svg
            className="h-8 w-8 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Compte suspendu
        </h1>
        <p className="text-gray-600 mb-6">
          Votre compte a été suspendu. Veuillez contacter notre équipe support
          pour résoudre ce problème et rétablir l&apos;accès.
        </p>
        <a
          href="mailto:support@enmaschool.com"
          className="inline-flex items-center rounded-lg bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Contacter le support
        </a>
      </div>
    </div>
  );
}

// ── Dashboard placeholder ────────────────────────────────────────────
function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">
        Tableau de bord
      </h1>
      <p className="text-gray-500">
        Bienvenue, {user?.first_name ?? 'utilisateur'} 👋
      </p>
    </div>
  );
}

// ── SuperAdmin placeholder pages ─────────────────────────────────────
function AdminPlaceholderPage({ title }: { title: string }) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">{title}</h1>
      <p className="text-gray-500 text-sm">
        Cette page est en cours de développement.
      </p>
    </div>
  );
}

// ── Routes ───────────────────────────────────────────────────────────
export const routes: RouteObject[] = [
  {
    path: '/login',
    element: <LoginPage />,
  },

  // Route publique — accepter une invitation (sans layout)
  {
    path: '/accept-invitation',
    element: <AcceptInvitationPage />,
  },

  // ── Tenant app routes ─────────────────────────────────────────────
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/school/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <Navigate to="/school/dashboard" replace />,
      },
      {
        path: 'dashboard-home',
        element: (
          <RoleRoute
            roles={[
              'school_admin',
              'director',
              'teacher',
              'accountant',
              'staff',
              'student',
              'parent',
            ]}
          >
            <DashboardPage />
          </RoleRoute>
        ),
      },

      // ── School Configuration (Phase 2) ───────────────────────────────
      {
        path: 'school/settings',
        element: (
          <RoleRoute roles={['school_admin', 'director']}>
            <SchoolSettingsPage />
          </RoleRoute>
        ),
      },
      {
        path: 'school/academic-years',
        element: (
          <RoleRoute roles={['school_admin', 'director']}>
            <AcademicYearsPage />
          </RoleRoute>
        ),
      },
      {
        path: 'school/levels',
        element: (
          <RoleRoute roles={['school_admin', 'director']}>
            <SchoolLevelsPage />
          </RoleRoute>
        ),
      },
      {
        path: 'school/classes',
        element: (
          <RoleRoute roles={['school_admin', 'director', 'teacher']}>
            <ClassesPage />
          </RoleRoute>
        ),
      },
      {
        path: 'school/classes/:id',
        element: (
          <RoleRoute roles={['school_admin', 'director', 'teacher']}>
            <ClasseDetailPage />
          </RoleRoute>
        ),
      },
      {
        path: 'school/subjects',
        element: (
          <RoleRoute roles={['school_admin', 'director', 'teacher']}>
            <SubjectsPage />
          </RoleRoute>
        ),
      },
      {
        path: 'school/rooms',
        element: (
          <RoleRoute roles={['school_admin', 'director']}>
            <RoomsPage />
          </RoleRoute>
        ),
      },

      // ── Élèves (Phase 4) ─────────────────────────────────────────────
      {
        path: 'school/students',
        element: (
          <RoleRoute roles={['school_admin', 'director', 'teacher']}>
            <StudentsPage />
          </RoleRoute>
        ),
      },
      {
        path: 'school/students/:id',
        element: (
          <RoleRoute roles={['school_admin', 'director', 'teacher']}>
            <StudentDetailPage />
          </RoleRoute>
        ),
      },

      // ── Enseignants (Phase 5) ────────────────────────────────────────
      {
        path: 'school/teachers',
        element: (
          <RoleRoute roles={['school_admin', 'director', 'teacher']}>
            <TeachersPage />
          </RoleRoute>
        ),
      },
      {
        path: 'school/teachers/:id',
        element: (
          <RoleRoute roles={['school_admin', 'director', 'teacher']}>
            <TeacherDetailPage />
          </RoleRoute>
        ),
      },

      // ── Notes (Phase 6) ──────────────────────────────────────────────
      {
        path: 'school/grades',
        element: (
          <RoleRoute roles={['school_admin', 'director', 'teacher']}>
            <GradesPage />
          </RoleRoute>
        ),
      },
      {
        path: 'school/grades/sheet',
        element: (
          <RoleRoute roles={['school_admin', 'director', 'teacher']}>
            <GradesSheetPage />
          </RoleRoute>
        ),
      },
      {
        path: 'school/students/:id/grades',
        element: (
          <RoleRoute roles={['school_admin', 'director', 'teacher']}>
            <StudentGradesSummaryPage />
          </RoleRoute>
        ),
      },
      {
        path: 'school/classes/:id/grades',
        element: (
          <RoleRoute roles={['school_admin', 'director', 'teacher']}>
            <ClassGradesSummaryPage />
          </RoleRoute>
        ),
      },

      // ── Bulletins Scolaires (Phase 7) ───────────────────────────────
      {
        path: 'school/report-cards',
        element: (
          <RoleRoute roles={['school_admin', 'director', 'teacher']}>
            <ReportCardsPage />
          </RoleRoute>
        ),
      },
      {
        path: 'school/report-cards/:id/edit',
        element: (
          <RoleRoute roles={['school_admin', 'director', 'teacher']}>
            <ReportCardEditorPage />
          </RoleRoute>
        ),
      },

      // ── Emploi du Temps (Phase 8) ───────────────────────────────────
      {
        path: 'school/timetable',
        element: (
          <RoleRoute roles={['school_admin', 'director', 'teacher']}>
            <TimetablePage />
          </RoleRoute>
        ),
      },

      // ── Présences & Absences (Phase 9) ──────────────────────────────
      {
        path: 'school/attendance',
        element: (
          <RoleRoute roles={['school_admin', 'director', 'teacher']}>
            <AttendancePage />
          </RoleRoute>
        ),
      },
      {
        path: 'school/attendance/sheet',
        element: (
          <RoleRoute roles={['school_admin', 'director', 'teacher']}>
            <AttendanceSheetPage />
          </RoleRoute>
        ),
      },
      {
        path: 'school/attendance/class/:id',
        element: (
          <RoleRoute roles={['school_admin', 'director', 'teacher']}>
            <ClassAttendanceStatsPage />
          </RoleRoute>
        ),
      },
      {
        path: 'school/attendance/justifications',
        element: (
          <RoleRoute roles={['school_admin', 'director']}>
            <JustificationsPage />
          </RoleRoute>
        ),
      },

      // ── Frais Scolaires & Paiements (Phase 10) ──────────────────────
      {
        path: 'school/payments',
        element: (
          <RoleRoute roles={['school_admin', 'director', 'accountant']}>
            <PaymentsPage />
          </RoleRoute>
        ),
      },
      {
        path: 'school/payments/student/:enrollmentId',
        element: (
          <RoleRoute roles={['school_admin', 'director', 'accountant']}>
            <StudentPaymentPage />
          </RoleRoute>
        ),
      },
      {
        path: 'school/payments/config',
        element: (
          <RoleRoute roles={['school_admin', 'director']}>
            <FeeConfigPage />
          </RoleRoute>
        ),
      },
      {
        path: 'school/payments/report',
        element: (
          <RoleRoute roles={['school_admin', 'director', 'accountant']}>
            <DailyReportPage />
          </RoleRoute>
        ),
      },

      // ── Dashboards & Rapports (Phase 12) ────────────────────────────
      {
        path: 'school/dashboard',
        element: (
          <RoleRoute roles={['school_admin', 'director', 'teacher', 'accountant', 'staff']}>
            <SchoolDashboardPage />
          </RoleRoute>
        ),
      },
      {
        path: 'school/dashboard/direction',
        element: (
          <RoleRoute roles={['school_admin', 'director']}>
            <DirectionDashboardPage />
          </RoleRoute>
        ),
      },
      {
        path: 'school/dashboard/academic',
        element: (
          <RoleRoute roles={['school_admin', 'director', 'teacher']}>
            <AcademicDashboardPage />
          </RoleRoute>
        ),
      },
      {
        path: 'school/dashboard/attendance',
        element: (
          <RoleRoute roles={['school_admin', 'director', 'staff']}>
            <AttendanceDashboardPage />
          </RoleRoute>
        ),
      },
      {
        path: 'school/dashboard/financial',
        element: (
          <RoleRoute roles={['school_admin', 'director', 'accountant']}>
            <FinancialDashboardPage />
          </RoleRoute>
        ),
      },
      {
        path: 'school/dashboard/teacher',
        element: (
          <RoleRoute roles={['teacher']}>
            <TeacherDashboardPage />
          </RoleRoute>
        ),
      },
      {
        path: 'school/reports',
        element: (
          <RoleRoute roles={['school_admin', 'director', 'accountant']}>
            <ReportsPage />
          </RoleRoute>
        ),
      },

      // ── Communication & Messagerie (Phase 11) ───────────────────────
      {
        path: 'school/messaging',
        element: (
          <RoleRoute roles={['school_admin', 'director', 'teacher', 'accountant', 'staff']}>
            <MessagingPage />
          </RoleRoute>
        ),
      },
      {
        path: 'school/announcements',
        element: (
          <RoleRoute roles={['school_admin', 'director', 'teacher', 'accountant', 'staff']}>
            <AnnouncementsPage />
          </RoleRoute>
        ),
      },

      // ── Rôles & Utilisateurs (Phase 3) ───────────────────────────────
      {
        path: 'school/users',
        element: (
          <RoleRoute roles={['school_admin', 'director']}>
            <UsersPage />
          </RoleRoute>
        ),
      },
      {
        path: 'school/users/:id',
        element: (
          <RoleRoute roles={['school_admin', 'director']}>
            <UserDetailPage />
          </RoleRoute>
        ),
      },
      {
        path: 'school/invitations',
        element: (
          <RoleRoute roles={['school_admin', 'director']}>
            <InvitationsPage />
          </RoleRoute>
        ),
      },
      {
        path: 'school/roles-permissions',
        element: (
          <RoleRoute roles={['school_admin']}>
            <RolesPermissionsPage />
          </RoleRoute>
        ),
      },
    ],
  },

  // ── SuperAdmin routes ─────────────────────────────────────────────
  {
    path: '/admin/login',
    element: <AdminLoginPage />,
  },
  {
    path: '/admin',
    element: (
      <AdminProtectedRoute>
        <SuperAdminLayout />
      </AdminProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/admin/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <SuperAdminDashboardPage />,
      },
      // Tenants
      {
        path: 'tenants',
        element: <TenantListPage />,
      },
      {
        path: 'tenants/create',
        element: <CreateTenantPage />,
      },
      {
        path: 'tenants/:id',
        element: <TenantDetailPage />,
      },
      {
        path: 'tenants/:id/edit',
        element: <EditTenantPage />,
      },
      {
        path: 'tenants/:id/modules',
        element: <AdminPlaceholderPage title="Modules de l'école" />,
      },
      {
        path: 'tenants/:id/activity',
        element: <AdminPlaceholderPage title="Activité de l'école" />,
      },
      // Plans
      {
        path: 'plans',
        element: <PlanListPage />,
      },
      {
        path: 'plans/create',
        element: <PlanListPage />,
      },
      {
        path: 'plans/:id/edit',
        element: <PlanListPage />,
      },
      // Modules
      {
        path: 'modules',
        element: <SystemModulesPage />,
      },
      // Subscriptions
      {
        path: 'subscriptions',
        element: <AdminPlaceholderPage title="Abonnements" />,
      },
      // Users
      {
        path: 'users',
        element: <GlobalUsersPage />,
      },
      // Activity
      {
        path: 'activity',
        element: <ActivityLogPage />,
      },
      // Tickets
      {
        path: 'tickets',
        element: <TicketListPage />,
      },
      {
        path: 'tickets/:id',
        element: <TicketDetailPage />,
      },
      // Settings
      {
        path: 'settings',
        element: <SystemSettingsPage />,
      },
    ],
  },

  {
    path: '/unauthorized',
    element: <UnauthorizedPage />,
  },
  {
    path: '/trial-expired',
    element: <TrialExpiredPage />,
  },
  {
    path: '/suspended',
    element: <SuspendedPage />,
  },
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
];
