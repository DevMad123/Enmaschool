// ===== src/shared/config/navigation.ts =====

import type { UserRole } from '@/shared/types/auth.types';

export interface NavItem {
  label: string;
  path: string;
  icon: string;
  module?: string;
  roles?: UserRole[];
  children?: NavItem[];
}

export const navigation: NavItem[] = [
  {
    label: 'Tableau de bord',
    path: '/dashboard',
    icon: 'LayoutDashboard',
    roles: [
      'school_admin',
      'director',
      'teacher',
      'accountant',
      'staff',
      'student',
      'parent',
    ],
  },
];
