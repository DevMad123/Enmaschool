// ===== src/modules/superadmin/pages/AdminLoginPage.tsx =====

import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Mail, Lock, Eye, EyeOff, Loader2, Shield } from 'lucide-react';

import { superAdminLoginApi } from '@/modules/superadmin/api/auth.api';
import { useAuthStore } from '@/modules/auth/store/authStore';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import type { ApiError } from '@/shared/types/api.types';

const schema = z.object({
  email: z.string().min(1, 'Email requis').email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});

type FormData = z.infer<typeof schema>;

export function AdminLoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const roles = useAuthStore((s) => s.roles);
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => superAdminLoginApi(data.email, data.password),
    onSuccess: (res) => {
      const { user, token, roles } = res.data;
      // Map SuperAdmin user shape to the generic User type
      setAuth(
        {
          id: user.id,
          first_name: user.name,
          last_name: '',
          full_name: user.name,
          email: user.email,
          role: 'school_admin', // unused for super_admin, just satisfies the type
          status: 'active',
          avatar_url: null,
          phone: null,
        },
        token,
        [],          // no granular permissions for super_admin
        roles,
        null,        // no school
      );
      navigate('/admin/dashboard', { replace: true });
    },
    onError: (error: ApiError) => {
      setApiError(error.message);
    },
  });

  const onSubmit = (data: FormData) => {
    setApiError(null);
    mutation.mutate(data);
  };

  // Already logged in as super_admin → redirect to admin dashboard
  if (isAuthenticated && roles.includes('super_admin')) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-500/30">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Enma School</h1>
          <p className="mt-1 text-sm text-indigo-600 font-medium">
            Administration centrale
          </p>
        </div>

        <h2 className="mb-6 text-center text-lg font-semibold text-gray-900">
          Connexion Super Admin
        </h2>

        {apiError && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="email">Adresse email</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="superadmin@enmaschool.com"
                className="pl-10"
                autoComplete="email"
                {...register('email')}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-red-600">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <Label htmlFor="password">Mot de passe</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className="pl-10 pr-10"
                autoComplete="current-password"
                {...register('password')}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-600">{errors.password.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connexion...
              </>
            ) : (
              'Se connecter'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
