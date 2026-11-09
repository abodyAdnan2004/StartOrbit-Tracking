import axios from '~/common/services/app-client/axios.js'

interface AppUser {
  id?: string
  fullName?: string
  token?: string
  role?: string
}
//TODO: use cookies instead of localStorage
export const useAppUserStore = defineStore('appUserStore', () => {
  const user = ref<AppUser>(JSON.parse(localStorage.getItem('user') ?? '{}'))
  const isError = ref<boolean>(false)
  const isChangePasswordDialogOpen = ref<boolean>(false)
  const login = async (email: string, password: string) => {
    const res = await axios.post('login', { email, password })
    if (res.data) {
      localStorage.setItem('user', JSON.stringify(res.data))
      user.value = res.data
    }
  }
  const isInRole = (role: string | string[]) => {
    if (!user.value.role) return false
    if (Array.isArray(role)) return role.findIndex((r) => r === user.value.role) != -1
    return user.value.role === role
  }
  const logout = () => {
    localStorage.removeItem('user')
    useRouter().push('/login')
  }
  return {
    user,
    isChangePasswordDialogOpen,
    login,
    isError,
    logout,
    isInRole,
  }
})
