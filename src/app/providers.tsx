// ===== src/app/providers.tsx =====

import { useEffect, useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { queryClient } from '@/shared/lib/queryClient';
import { useAuthStore } from '@/modules/auth/store/authStore';
import { getMeApi } from '@/modules/auth/auth.api';
import { superAdminMeApi } from '@/modules/superadmin/api/auth.api';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const [hydrated, setHydrated] = useState(() => useAuthStore.persist.hasHydrated());

  useEffect(() => {
    if (hydrated) return;
    const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
    if (useAuthStore.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Refresh user data from API after hydration
  useEffect(() => {
    if (!hydrated) return;

    const { token, roles, clearAuth } = useAuthStore.getState();
    if (!token) return;

    const isSuperAdmin = roles.includes('super_admin');

    if (isSuperAdmin) {
      superAdminMeApi()
        .then((res) => {
          const { user, roles: freshRoles } = res.data;
          useAuthStore.getState().setAuth(
            {
              id: user.id,
              first_name: user.name,
              last_name: '',
              full_name: user.name,
              email: user.email,
              role: 'school_admin',
              status: 'active',
              avatar_url: null,
              phone: null,
            },
            token,
            [],
            freshRoles,
            null,
          );
        })
        .catch(() => {
          clearAuth();
        });
    } else {
      getMeApi()
        .then((res) => {
          const { user, permissions, roles: freshRoles, school } = res.data;
          useAuthStore.getState().setAuth(user, token, permissions, freshRoles, school);
        })
        .catch(() => {
          clearAuth();
        });
    }
  }, [hydrated]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        position="top-right"
        richColors
        closeButton
        toastOptions={{ duration: 4000 }}
      />
    </QueryClientProvider>
  );
}
