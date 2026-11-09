import { AuthService } from '../service'
import type { LoginBody, MeResponse, Role, Token } from '../types'

const authService = new AuthService()

export const useAuthStore = defineStore('auth-store', () => {
  const isLoading = ref(false)

  const readTokenData = (): Token => {
    if (typeof window === 'undefined') return {} as Token
    const stored = localStorage.getItem('tokenData')
    return stored ? (JSON.parse(stored) as Token) : ({} as Token)
  }

  const readUserData = (): MeResponse => {
    if (typeof window === 'undefined') return {} as MeResponse
    const stored = localStorage.getItem('userData')
    return stored ? (JSON.parse(stored) as MeResponse) : ({} as MeResponse)
  }

  const tokenState = ref(typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '')
  const tokenDataState = ref<Token>(readTokenData())
  const userDataState = ref<MeResponse>(readUserData())

  const token = computed({
    get: () => tokenState.value,
    set: (value: string) => {
      tokenState.value = value
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', value)
      }
    },
  })

  const tokenData = computed({
    get: () => tokenDataState.value,
    set: (value: Token) => {
      tokenDataState.value = value
      if (typeof window !== 'undefined') {
        localStorage.setItem('tokenData', JSON.stringify(value))
      }
    },
  })

  const userData = computed({
    get: () => userDataState.value,
    set: (value: MeResponse) => {
      userDataState.value = value
      if (typeof window !== 'undefined') {
        localStorage.setItem('userData', JSON.stringify(value))
      }
    },
  })

  const isLogged = computed(() => !!token.value)

  const setUserData = (value: MeResponse) => {
    userData.value = value
  }

  const login = async (body: LoginBody) => {
    try {
      isLoading.value = true
      const response = await authService.login(body)

      if (response.isSuccess) {
        token.value = response.token.accessToken
        tokenData.value = response.token
        userData.value = response.user
        navigateTo('/')
      } else {
        throw new Error(response.message || 'Login failed')
      }
    } catch (error) {
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const me = async (): Promise<MeResponse | false> => {
    try {
      isLoading.value = true
      const response = await authService.me()
      userData.value = response
      return response
    } catch (error) {
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const hasRole = (roleName: string) => {
    if (!userData.value || !userData.value.roles) return false
    return userData.value.roles.some((role: Role) => role.name === roleName)
  }

  const logout = () => {
    token.value = ''
    tokenData.value = {} as Token
    userData.value = {} as MeResponse
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
      localStorage.removeItem('tokenData')
      localStorage.removeItem('userData')
    }
    navigateTo('/login')
  }

  return {
    isLoading,
    token,
    tokenData,
    userData,
    setUserData,
    login,
    logout,
    isLogged,
    me,
    hasRole,
  }
})
