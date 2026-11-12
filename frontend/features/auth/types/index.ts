export interface LoginBody {
  loginIdentifier: string
  password: string
  rememberMe?: boolean
}

export interface AuthResponse {
  isSuccess: boolean
  message: string
  errorCode: string | null
  user: User
  token: Token
}

export type UserRole = 'admin' | 'user' | 'viewer'

export interface User {
  username: string
  email: string
  firstName: string
  lastName: string
  fullName: string
  phoneNumber: string
  role: UserRole
  id: string
  isActive: boolean
}

export interface Role {
  name: string
  description: string
  id: string
  isActive: boolean
}

export interface Permission {
  // Add permission properties as needed
  [key: string]: any
}

export interface Token {
  accessToken: string
  refreshToken: string
  expiresAt: string
  tokenType: string
  expiresInSeconds: number
}

// Keep MeResponse as User for backward compatibility
export type MeResponse = User
