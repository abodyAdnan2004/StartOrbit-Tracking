import type { AuthResponse } from '~/features/auth/types'

export const hasRole = (role: string) => {
  const userData = JSON.parse(localStorage.getItem('userData')!) as AuthResponse
  if (!userData.role) return false
  if (Array.isArray(role)) return role.findIndex((r) => r === userData.role) != -1
  return userData.role === role
}
