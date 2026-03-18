// ===== src/shared/config/navigation.ts =====

import type { UserRole } from '@/shared/types/auth.types';

export interface NavItem {
  label: string;
  path: string;
  icon: string;
  module?: string;
  roles?: Array<UserRole | 'super_admin'>;
  badge?: string;
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

  // ── School Configuration (Phase 2) ───────────────────────────────────
  {
    label: 'Paramètres école',
    path: '/school/settings',
    icon: 'Settings',
    module: 'school',
    roles: ['school_admin', 'director'],
  },
  {
    label: 'Années scolaires',
    path: '/school/academic-years',
    icon: 'CalendarDays',
    module: 'school',
    roles: ['school_admin', 'director'],
  },
  {
    label: 'Niveaux',
    path: '/school/levels',
    icon: 'Layers',
    module: 'school',
    roles: ['school_admin', 'director'],
  },
  {
    label: 'Classes',
    path: '/school/classes',
    icon: 'Users',
    module: 'school',
    roles: ['school_admin', 'director', 'teacher'],
  },
  {
    label: 'Matières',
    path: '/school/subjects',
    icon: 'BookOpen',
    module: 'school',
    roles: ['school_admin', 'director', 'teacher'],
  },
  {
    label: 'Salles',
    path: '/school/rooms',
    icon: 'DoorOpen',
    module: 'school',
    roles: ['school_admin', 'director'],
  },

  // ── Rôles & Utilisateurs (Phase 3) ───────────────────────────────────
  {
    label: 'Utilisateurs',
    path: '/school/users',
    icon: 'UserCog',
    module: 'users',
    roles: ['school_admin', 'director'],
  },
  {
    label: 'Invitations',
    path: '/school/invitations',
    icon: 'MailPlus',
    module: 'users',
    roles: ['school_admin', 'director'],
  },
  {
    label: 'Rôles & Permissions',
    path: '/school/roles-permissions',
    icon: 'Shield',
    module: 'users',
    roles: ['school_admin'],
  },
];

// ── SuperAdmin navigation ─────────────────────────────────────────────
// Visible uniquement pour le rôle super_admin
export const superAdminNavigation: NavItem[] = [
  {
    label: 'Dashboard',
    path: '/admin/dashboard',
    icon: 'LayoutDashboard',
    roles: ['super_admin'],
  },
  {
    label: 'Écoles',
    path: '/admin/tenants',
    icon: 'Building2',
    roles: ['super_admin'],
    children: [
      {
        label: 'Liste',
        path: '/admin/tenants',
        icon: 'Building2',
        roles: ['super_admin'],
      },
      {
        label: 'Créer',
        path: '/admin/tenants/create',
        icon: 'PlusCircle',
        roles: ['super_admin'],
      },
    ],
  },
  {
    label: 'Plans & Abonnements',
    path: '/admin/plans',
    icon: 'CreditCard',
    roles: ['super_admin'],
  },
  {
    label: 'Modules',
    path: '/admin/modules',
    icon: 'Boxes',
    roles: ['super_admin'],
  },
  {
    label: 'Utilisateurs',
    path: '/admin/users',
    icon: 'Users',
    roles: ['super_admin'],
  },
  {
    label: 'Activités',
    path: '/admin/activity',
    icon: 'ClipboardList',
    roles: ['super_admin'],
  },
  {
    label: 'Support',
    path: '/admin/tickets',
    icon: 'Ticket',
    roles: ['super_admin'],
    badge: 'tickets_open',
  },
  {
    label: 'Paramètres',
    path: '/admin/settings',
    icon: 'Settings',
    roles: ['super_admin'],
  },
];
