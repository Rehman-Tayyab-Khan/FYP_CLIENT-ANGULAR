interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  user: AuthUser;
}

interface AuthUser {
  id: string;
  role: 'admin' | 'doctor' | 'fdo';
  first_name: string;
  last_name: string;
  email: string;
  permissions?: string[];
  created_at?: string;
}

interface LogoutResponse {
  success: boolean;
  message: string;
  redirectTo?: string;
}

export type { LoginRequest, LoginResponse, AuthUser, LogoutResponse };
