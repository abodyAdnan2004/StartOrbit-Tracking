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

export interface User {
  employeeId: number
  username: string
  email: string
  firstName: string
  lastName: string
  fullName: string
  phoneNumber: string
  roles: Role[]
  id: number
  isActive: boolean
}

export interface Role {
  name: string
  description: string
  isSystemRole: boolean
  id: number
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
