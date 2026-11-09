import type { AuthResponse } from '~/features/auth/types'

export const hasRole = (role: string) => {
  const userData = JSON.parse(localStorage.getItem('userData')!) as AuthResponse
  if (!userData.user.role) return false
  return userData.user.role === role
}
