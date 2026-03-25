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
  // ── Dashboards (Phase 12) ────────────────────────────────────────────
  {
    label: 'Tableau de bord',
    path: '/school/dashboard',
    icon: 'LayoutDashboard',
    roles: ['school_admin', 'director', 'teacher', 'accountant', 'staff'],
  },
  {
    label: 'Dashboard Direction',
    path: '/school/dashboard/direction',
    icon: 'Home',
    roles: ['school_admin', 'director'],
  },
  {
    label: 'Dashboard Académique',
    path: '/school/dashboard/academic',
    icon: 'TrendingUp',
    roles: ['school_admin', 'director', 'teacher'],
  },
  {
    label: 'Dashboard Présences',
    path: '/school/dashboard/attendance',
    icon: 'UserCheck',
    roles: ['school_admin', 'director', 'staff'],
  },
  {
    label: 'Dashboard Financier',
    path: '/school/dashboard/financial',
    icon: 'BarChart2',
    roles: ['school_admin', 'director', 'accountant'],
  },
  {
    label: 'Rapports & Exports',
    path: '/school/reports',
    icon: 'Download',
    roles: ['school_admin', 'director', 'accountant'],
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

  // ── Élèves (Phase 4) ─────────────────────────────────────────────────
  {
    label: 'Élèves',
    path: '/school/students',
    icon: 'GraduationCap',
    module: 'students',
    roles: ['school_admin', 'director', 'teacher'],
  },

  // ── Enseignants (Phase 5) ─────────────────────────────────────────────
  {
    label: 'Enseignants',
    path: '/school/teachers',
    icon: 'GraduationCap',
    module: 'users',
    roles: ['school_admin', 'director', 'teacher'],
  },

  // ── Notes (Phase 6) ──────────────────────────────────────────────────
  {
    label: 'Notes',
    path: '/school/grades',
    icon: 'ClipboardList',
    module: 'school',
    roles: ['school_admin', 'director', 'teacher'],
  },

  // ── Bulletins (Phase 7) ───────────────────────────────────────────────
  {
    label: 'Bulletins',
    path: '/school/report-cards',
    icon: 'FileText',
    module: 'school',
    roles: ['school_admin', 'director', 'teacher'],
  },

  // ── Emploi du Temps (Phase 8) ─────────────────────────────────────────
  {
    label: 'Emploi du temps',
    path: '/school/timetable',
    icon: 'CalendarRange',
    module: 'school',
    roles: ['school_admin', 'director', 'teacher'],
  },

  // ── Présences & Absences (Phase 9) ───────────────────────────────────
  {
    label: 'Présences',
    path: '/school/attendance',
    icon: 'ClipboardCheck',
    module: 'school',
    roles: ['school_admin', 'director', 'teacher'],
  },

  // ── Frais Scolaires & Paiements (Phase 10) ───────────────────────────
  {
    label: 'Frais scolaires',
    path: '/school/payments',
    icon: 'Wallet',
    module: 'payments',
    roles: ['school_admin', 'director', 'accountant'],
  },

  // ── Communication & Messagerie (Phase 11) ───────────────────────────
  {
    label: 'Messagerie',
    path: '/school/messaging',
    icon: 'MessageSquare',
    module: 'messaging',
    roles: ['school_admin', 'director', 'teacher', 'accountant', 'staff'],
  },
  {
    label: 'Annonces',
    path: '/school/announcements',
    icon: 'Megaphone',
    module: 'messaging',
    roles: ['school_admin', 'director', 'teacher', 'accountant', 'staff'],
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
