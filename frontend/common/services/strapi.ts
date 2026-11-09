import { strapi } from '@strapi/client'

export const strapiClient = strapi({
  baseURL: `${import.meta.env.VITE_BASE_URL}api`,
  auth: typeof window !== 'undefined' ? localStorage.getItem('token') || undefined : undefined,
})
