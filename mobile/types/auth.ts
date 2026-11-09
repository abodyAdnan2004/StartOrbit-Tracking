// Auth Types
export interface User {
  id: number;
  employeeId: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phoneNumber: string;
  role: string;
  roleId: number;
  isActive: boolean;
}

export interface Role {
  name: string;
  description: string;
  isSystemRole: boolean;
  id: number;
  isActive: boolean;
}

export interface Token {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  tokenType: string;
  expiresInSeconds: number;
}

export interface AuthResponse {
  isSuccess: boolean;
  message: string;
  errorCode: string | null;
  user: User;
  token: Token;
}

export interface LoginRequest {
  loginIdentifier: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  employeeId: number;
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  roleId?: number;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}