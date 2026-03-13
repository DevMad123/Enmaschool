// ===== src/shared/components/layout/Sidebar.tsx =====

import { useNavigate, useLocation } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import {
  LayoutDashboard,
  LogOut,
  type LucideIcon,
} from 'lucide-react';

import { useAuthStore } from '@/modules/auth/store/authStore';
import { logoutApi } from '@/modules/auth/auth.api';
import { useUiStore } from '@/stores/uiStore';
import { navigation, type NavItem } from '@/shared/config/navigation';
import { usePermission } from '@/shared/hooks/usePermission';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/shared/components/ui/avatar';
import { Separator } from '@/shared/components/ui/separator';
import { cn } from '@/shared/lib/utils';

// ── Icon map (extend as modules grow) ────────────────────────────────
const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
};

function getIcon(name: string): LucideIcon {
  return iconMap[name] ?? LayoutDashboard;
}

// ── Nav Item component ───────────────────────────────────────────────
function SidebarNavItem({
  item,
  collapsed,
}: {
  item: NavItem;
  collapsed: boolean;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = location.pathname === item.path;
  const Icon = getIcon(item.icon);

  return (
    <button
      onClick={() => navigate(item.path)}
      className={cn(
        'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
        isActive
          ? 'bg-indigo-50 text-indigo-700'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
        collapsed && 'justify-center px-2',
      )}
      title={collapsed ? item.label : undefined}
    >
      <Icon className="h-5 w-5 shrink-0" />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </button>
  );
}

// ── Sidebar ──────────────────────────────────────────────────────────
export function Sidebar() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const school = useAuthStore((s) => s.school);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const { hasRole } = usePermission();
  const collapsed = useUiStore((s) => s.sidebarCollapsed);

  const logoutMutation = useMutation({
    mutationFn: logoutApi,
    onSettled: () => {
      clearAuth();
      navigate('/login', { replace: true });
    },
  });

  // Filter nav items by role
  const filteredNav = navigation.filter((item) => {
    if (!item.roles) return true;
    return hasRole(item.roles);
  });

  const initials = user
    ? `${(user.first_name ?? user.full_name ?? '?').charAt(0)}${(user.last_name ?? '').charAt(0)}`.trim() || '?'
    : '??';

  return (
    <aside
      className={cn(
        'flex h-full flex-col border-r border-gray-200 bg-white transition-all duration-300',
        collapsed ? 'w-[72px]' : 'w-[260px]',
      )}
    >
      {/* ── Header: logo + school ── */}
      <div
        className={cn(
          'flex items-center gap-3 border-b border-gray-100 px-4 py-5',
          collapsed && 'justify-center px-2',
        )}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-600">
          <svg
            className="h-5 w-5 text-white"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
            <path d="M6 12v5c0 1.657 2.686 3 6 3s6-1.343 6-3v-5" />
          </svg>
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900">
              {school?.name ?? 'Enma School'}
            </p>
            <p className="truncate text-xs text-gray-500">
              Espace scolaire
            </p>
          </div>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {filteredNav.map((item) => (
          <SidebarNavItem key={item.path} item={item} collapsed={collapsed} />
        ))}
      </nav>

      {/* ── Separator ── */}
      <Separator />

      {/* ── User footer ── */}
      <div
        className={cn(
          'flex items-center gap-3 p-4',
          collapsed && 'flex-col gap-2 p-2',
        )}
      >
        <Avatar className="h-9 w-9 shrink-0">
          {user?.avatar_url && <AvatarImage src={user.avatar_url} />}
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>

        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-900">
              {user?.full_name}
            </p>
            <p className="truncate text-xs capitalize text-gray-500">
              {user?.role.replace('_', ' ')}
            </p>
          </div>
        )}

        <button
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
          className={cn(
            'rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600',
            collapsed && 'mx-auto',
          )}
          title="Déconnexion"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}
