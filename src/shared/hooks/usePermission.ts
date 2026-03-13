// ===== src/shared/hooks/usePermission.ts =====

import { useCallback } from 'react';
import { useAuthStore } from '@/modules/auth/store/authStore';
import type { UserRole } from '@/shared/types/auth.types';

export function usePermission() {
  const permissions = useAuthStore((s) => s.permissions);
  const roles = useAuthStore((s) => s.roles);
  const school = useAuthStore((s) => s.school);

  const hasPermission = useCallback(
    (permission: string): boolean => permissions.includes(permission),
    [permissions],
  );

  const hasRole = useCallback(
    (role: UserRole | UserRole[]): boolean => {
      const check = Array.isArray(role) ? role : [role];
      return check.some((r) => roles.includes(r));
    },
    [roles],
  );

  const hasModule = useCallback(
    (module: string): boolean =>
      school?.active_modules.includes(module) ?? false,
    [school],
  );

  const canAccess = useCallback(
    (module: string, permission?: string): boolean => {
      if (!hasModule(module)) return false;
      if (permission && !hasPermission(permission)) return false;
      return true;
    },
    [hasModule, hasPermission],
  );

  return { hasPermission, hasRole, hasModule, canAccess };
}
