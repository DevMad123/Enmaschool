// ===== src/shared/types/auth.types.ts =====

export type UserRole =
  | 'school_admin'
  | 'director'
  | 'teacher'
  | 'accountant'
  | 'staff'
  | 'student'
  | 'parent';

export type UserStatus = 'active' | 'inactive' | 'suspended';

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  avatar_url: string | null;
  phone: string | null;
}

export interface School {
  name: string;
  logo: string | null;
  has_maternelle: boolean;
  has_primary: boolean;
  has_college: boolean;
  has_lycee: boolean;
  active_modules: string[];
}

export interface LoginCredentials {
  email: string;
  password: string;
  device_name?: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  permissions: string[];
  roles: string[];
  school: School;
}

export interface MeResponse {
  user: User;
  permissions: string[];
  roles: string[];
  school: School;
}

export interface RefreshTokenResponse {
  token: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  permissions: string[];
  roles: string[];
  school: School | null;
  isAuthenticated: boolean;
  setAuth: (
    user: User,
    token: string,
    permissions: string[],
    roles: string[],
    school: School,
  ) => void;
  clearAuth: () => void;
  updateUser: (partial: Partial<User>) => void;
}
