export type UserRole = 'user' | 'shopowner' | 'admin';

export interface AuthSession {
  isAuthenticated: boolean;
  role: UserRole;
  email: string;
  name: string;
  token?: string;
  shopOwnerId?: string;
  shopName?: string;
  loginTime: string;
}

export interface OtpState {
  email: string;
  role: 'admin' | 'shopowner';
  code: string;
  createdAt: number;
  expiresAt: number;
  attempts: number;
}
