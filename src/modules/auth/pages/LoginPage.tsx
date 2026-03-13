// ===== src/modules/auth/pages/LoginPage.tsx =====

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';

import { loginApi } from '@/modules/auth/auth.api';
import { useAuthStore } from '@/modules/auth/store/authStore';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import type { ApiError } from '@/shared/types/api.types';

// ── Zod schema ───────────────────────────────────────────────────────
const loginSchema = z.object({
  email: z
    .string()
    .min(1, "L'adresse email est requise")
    .email('Adresse email invalide'),
  password: z
    .string()
    .min(1, 'Le mot de passe est requis')
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
});

type LoginFormData = z.infer<typeof loginSchema>;

// ── Component ────────────────────────────────────────────────────────
export function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Redirect if already authenticated
  if (isAuthenticated) {
    navigate('/dashboard', { replace: true });
    return null;
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const mutation = useMutation({
    mutationFn: (data: LoginFormData) =>
      loginApi(data.email, data.password, 'web'),
    onSuccess: (res) => {
      const { user, token, permissions, roles, school } = res.data;
      setAuth(user, token, permissions, roles, school);
      navigate('/dashboard', { replace: true });
    },
    onError: (error: ApiError) => {
      setApiError(error.message);
    },
  });

  const onSubmit = (data: LoginFormData) => {
    setApiError(null);
    mutation.mutate(data);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-4">
      {/* Card */}
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-500/30">
            <svg
              className="h-8 w-8 text-white"
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
          <h1 className="mt-4 text-2xl font-bold text-gray-900">
            Enma School
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Bienvenue sur votre espace
          </p>
        </div>

        {/* Title */}
        <h2 className="mb-6 text-center text-lg font-semibold text-gray-900">
          Connexion
        </h2>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="email">Adresse email</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="exemple@ecole.ci"
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
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-600">{errors.password.message}</p>
            )}
          </div>

          {/* Forgot password */}
          <div className="flex justify-end">
            <a
              href="/forgot-password"
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
            >
              Mot de passe oublié ?
            </a>
          </div>

          {/* API error */}
          {apiError && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
              <p className="text-sm text-red-700">{apiError}</p>
            </div>
          )}

          {/* Submit */}
          <Button
            type="submit"
            className="w-full"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Connexion en cours…
              </>
            ) : (
              'Se connecter'
            )}
          </Button>
        </form>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} Enma School — Tous droits réservés
        </p>
      </div>
    </div>
  );
}
