import type { AxiosError } from 'axios'

export interface PaginatedResponse<T> {
  items: T[]
  pagesCount: number
  currentPage: number
  type: string
  totalItems?: number
  calculatedTotalPages: number
  currentPageSize: number
  totalCount: number
  totalPages: number
}

export interface WithoutPagination<T> {
  items: T[]
}
export interface SingleObjectResponse<T> {
  item: T
  code: number
  message?: string
  error?: null
}
export interface BaseFilters extends Record<string, any> {
  pageNumber: number
  pageSize: number
}
export type ValidationErrors = Record<string, string[]>
export interface ApiErrorResponse {
  errors?: ValidationErrors
  title?: string
  detail?: string
}
export type ApiError = AxiosError<ApiErrorResponse>
