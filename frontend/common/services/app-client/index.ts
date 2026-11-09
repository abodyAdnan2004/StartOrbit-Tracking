import type { AxiosResponse } from 'axios'
import type { PaginatedResponse } from '~/common/utils/types/ApiResponses'
import axios from './axios'

interface IAppClient<T> {
  get: (
    url: string,
    id?: string | null,
    params?: Record<string, any>
  ) => Promise<AxiosResponse<PaginatedResponse<T> | T>>
  post: (url: string, data: T) => Promise<AxiosResponse<T>>
  put: (url: string, data: T) => Promise<AxiosResponse<T>>
  delete: (url: string, id: string) => Promise<AxiosResponse<T>>
}

export class AppClient<T> implements IAppClient<T> {
  get(
    url: string,
    id?: string | null,
    params?: Record<string, any>
  ): Promise<AxiosResponse<PaginatedResponse<T> | T>> {
    if (params) {
      params.deleted = false
    } else {
      params = { deleted: false }
    }
    if (id) url += '/' + id
    return axios.get<PaginatedResponse<T> | T>(url, { params }) as Promise<
      AxiosResponse<PaginatedResponse<T> | T>
    >
  }

  post(url: string, data: T): Promise<AxiosResponse<T>> {
    return axios.post<T>(url, data)
  }

  put(url: string, data: T): Promise<AxiosResponse<T>> {
    return axios.put(url, data)
  }

  delete(url: string, id: string): Promise<AxiosResponse<any>> {
    return axios.delete(`${url}/${id}`)
  }
}
