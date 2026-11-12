import axios from '~/common/services/app-client/axios'
import type { PaginatedResponse } from '~/common/utils/types/ApiResponses'
import type { CustomerDto, CustomerCreateDto, CustomerUpdateDto, CustomerFilters } from '../types'

interface ICustomerService {
  get: (filters: CustomerFilters) => Promise<PaginatedResponse<CustomerDto>>
  getById: (id: string) => Promise<CustomerDto>
  create: (data: CustomerCreateDto) => Promise<CustomerDto>
  update: (id: string, data: CustomerUpdateDto) => Promise<CustomerDto>
  delete: (id: string) => Promise<void>
  exportExcel: (filters?: Partial<CustomerFilters>) => Promise<Blob>
}

export class CustomerService implements ICustomerService {
  async get(filters: CustomerFilters): Promise<PaginatedResponse<CustomerDto>> {
    const response = await axios.get<PaginatedResponse<CustomerDto>>('/customers', {
      params: filters,
    })
    return response.data
  }

  async getById(id: string): Promise<CustomerDto> {
    const response = await axios.get<CustomerDto>(`/customers/${id}`)
    return response.data
  }

  async create(data: CustomerCreateDto): Promise<CustomerDto> {
    const response = await axios.post<CustomerDto>('/customers', data)
    return response.data
  }

  async update(id: string, data: CustomerUpdateDto): Promise<CustomerDto> {
    const response = await axios.put<CustomerDto>(`/customers/${id}`, data)
    return response.data
  }

  async delete(id: string): Promise<void> {
    await axios.delete(`/customers/${id}`)
  }

  async exportExcel(filters?: Partial<CustomerFilters>): Promise<Blob> {
    const response = await axios.get('/customers/export', {
      params: filters,
      responseType: 'blob'
    })
    return response.data
  }
}

export const customerService = new CustomerService()
