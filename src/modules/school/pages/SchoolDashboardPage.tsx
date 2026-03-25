// ===== src/modules/school/pages/SchoolDashboardPage.tsx =====
// Routeur de rôle pour les dashboards

import { useAuthStore } from '@/modules/auth/store/authStore';
import { DirectionDashboardPage } from './DirectionDashboardPage';
import { TeacherDashboardPage } from './TeacherDashboardPage';
import { FinancialDashboardPage } from './FinancialDashboardPage';

export function SchoolDashboardPage() {
  const roles = useAuthStore((s) => s.roles);

  if (roles.includes('teacher')) {
    return <TeacherDashboardPage />;
  }

  if (roles.includes('accountant')) {
    return <FinancialDashboardPage />;
  }

  // school_admin, director, staff → direction dashboard
  return <DirectionDashboardPage />;
}
