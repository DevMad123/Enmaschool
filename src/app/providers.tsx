// ===== src/app/providers.tsx =====

import { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/shared/lib/queryClient';
import { useAuthStore } from '@/modules/auth/store/authStore';
import { getMeApi } from '@/modules/auth/auth.api';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const token = useAuthStore((s) => s.token);
  const setAuth = useAuthStore((s) => s.setAuth);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  useEffect(() => {
    if (!token) return;

    getMeApi()
      .then((res) => {
        const { user, permissions, roles, school } = res.data;
        setAuth(user, token, permissions, roles, school);
      })
      .catch(() => {
        clearAuth();
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
