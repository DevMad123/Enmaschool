// ===== src/shared/components/layout/Header.tsx =====

import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import {
  Menu,
  ChevronLeft,
  Bell,
  User,
  Settings,
  LogOut,
} from 'lucide-react';

import { useAuthStore } from '@/modules/auth/store/authStore';
import { logoutApi } from '@/modules/auth/auth.api';
import { useUiStore } from '@/stores/uiStore';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/shared/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { Separator } from '@/shared/components/ui/separator';

interface HeaderProps {
  onMobileMenuToggle?: () => void;
}

export function Header({ onMobileMenuToggle }: HeaderProps) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const currentPage = useUiStore((s) => s.currentPage);
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);

  const logoutMutation = useMutation({
    mutationFn: logoutApi,
    onSettled: () => {
      clearAuth();
      navigate('/login', { replace: true });
    },
  });

  const initials = user
    ? `${(user.first_name ?? user.full_name ?? '?').charAt(0)}${(user.last_name ?? '').charAt(0)}`.trim() || '?'
    : '??';

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-6">
      {/* ── Left side ── */}
      <div className="flex items-center gap-3">
        {/* Desktop toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="hidden lg:inline-flex"
        >
          {collapsed ? (
            <Menu className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </Button>

        {/* Mobile toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onMobileMenuToggle}
          className="lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <Separator orientation="vertical" className="hidden h-6 lg:block" />

        {/* Breadcrumb */}
        <nav className="flex items-center text-sm">
          <span className="font-medium capitalize text-gray-900">
            {currentPage.replace(/-/g, ' ')}
          </span>
        </nav>
      </div>

      {/* ── Right side ── */}
      <div className="flex items-center gap-2">
        {/* Notifications bell */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-gray-500" />
          <Badge className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center p-0 text-[10px]">
            0
          </Badge>
        </Button>

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-gray-100 focus:outline-none">
              <Avatar className="h-8 w-8">
                {user?.avatar_url && <AvatarImage src={user.avatar_url} />}
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium text-gray-700 md:inline-block">
                {user?.first_name}
              </span>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{user?.full_name}</span>
                <span className="text-xs font-normal text-gray-500">
                  {user?.email}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                <User className="mr-2 h-4 w-4" />
                Mon profil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                Paramètres
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              className="text-red-600 focus:text-red-600 focus:bg-red-50"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
