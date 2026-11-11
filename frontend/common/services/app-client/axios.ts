import axios from 'axios'
import { useToast } from '~/common/composables/toaster'

export const baseURL = import.meta.env.VITE_BASE_URL

const axiosIns = axios.create({
  baseURL: `${baseURL}api`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ℹ️ Add request interceptor to send the authorization header on each subsequent request after login
axiosIns.interceptors.request.use((config) => {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    return config
  }

  const token = localStorage.getItem('token')
  const locale = localStorage.getItem('locale') || 'en'

  if (config.method === 'get') {
    config.params = config.params || {}
  }

  // Ensure headers object exists
  config.headers = config.headers || {}
  config.headers['Accept-Language'] = locale

  // Only add Authorization header if token exists and is not empty
  if (token && token.trim() !== '') {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

const getSuccessMessage = (method: string) => {
  const locale = localStorage.getItem('locale') || 'ar'

  const messages = {
    en: {
      post: 'Data added successfully',
      put: 'Data updated successfully',
      delete: 'Data deleted successfully',
    },
    ar: {
      post: 'تمت إضافة البيانات بنجاح',
      put: 'تم التعديل بنجاح',
      delete: 'تم حذف البيانات بنجاح',
    },
  }

  return (
    messages[locale as keyof typeof messages]?.[method as keyof typeof messages.en] || 'Success'
  )
}

// ℹ️ Add response interceptor to handle 401
axiosIns.interceptors.response.use(
  (response) => {
    // Check for post, put, delete methods and status 200
    if (response.status === 200) {
      if (response.config.url !== '/file/multi') {
        const method = response.config.method
        if (method && ['post', 'put', 'delete'].includes(method)) {
          useToast({
            title: getSuccessMessage(method),
            isError: false,
          })
        }
      }
    }
    return response
  },
  (error) => {
    // Handle error
    if (error.response?.data?.message) {
      useToast({
        title: error.response.data.message,
        message: error.response.data.message,
        isError: true,
      })
    } else {
      useToast({
        title: 'حدث خطا',
        message: 'حدث خطأ , يرجى المحاولة مرة أخرى',
        isError: true,
      })
    }
    // Handle 401 Unauthorized - redirect to login
    if (!error.response || error.response.status === 401) {
      localStorage.removeItem('userData')
      localStorage.removeItem('token')
      localStorage.removeItem('tokenData')
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
    throw error
  }
)

axiosIns.defaults.paramsSerializer = (params) => {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined) return

    if (Array.isArray(value)) {
      value.forEach((v) => searchParams.append(key, v.toString()))
    } else {
      searchParams.append(key, value.toString())
    }
  })

  return searchParams.toString()
}

export default axiosIns