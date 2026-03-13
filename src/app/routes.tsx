// ===== src/app/routes.tsx =====

import { Navigate, type RouteObject } from 'react-router-dom';
import { useAuthStore } from '@/modules/auth/store/authStore';
import type { UserRole } from '@/shared/types/auth.types';

// ── Lazy-loaded pages ────────────────────────────────────────────────
import { LoginPage } from '@/modules/auth/pages/LoginPage';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';

// ── Guard : authenticated ────────────────────────────────────────────
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// ── Guard : role-based ───────────────────────────────────────────────
function RoleRoute({
  roles,
  children,
}: {
  roles: UserRole[];
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

// ── Routes ───────────────────────────────────────────────────────────
export const routes: RouteObject[] = [
  {
    path: '/login',
    element: <LoginPage />,
  },
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
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
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
