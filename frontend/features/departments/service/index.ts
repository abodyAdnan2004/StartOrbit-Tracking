import axios from '~/common/services/app-client/axios'
import type { PaginatedResponse } from '~/common/utils/types/ApiResponses'
import type { Department, DepartmentDto, DepartmentFilters, DepartmentUpdateDto } from '../types'

interface IDepartmentService {
  get: (filters: DepartmentFilters) => Promise<PaginatedResponse<DepartmentDto>>
  getById: (id: number, includeSubDepartments?: boolean) => Promise<DepartmentDto>
  getByCode: (code: string) => Promise<DepartmentDto>
  getHierarchy: () => Promise<DepartmentDto[]>
  getSubDepartments: (id: number) => Promise<DepartmentDto[]>
  getTopLevel: (filters: DepartmentFilters) => Promise<PaginatedResponse<DepartmentDto>>
  getWithBudget: (filters: DepartmentFilters) => Promise<PaginatedResponse<DepartmentDto>>
  create: (data: Department) => Promise<DepartmentDto>
  update: (id: number, data: DepartmentUpdateDto) => Promise<DepartmentDto>
  delete: (id: number) => Promise<void>
}

export class DepartmentService implements IDepartmentService {
  async get(filters: DepartmentFilters): Promise<PaginatedResponse<DepartmentDto>> {
    const response = await axios.get<PaginatedResponse<DepartmentDto>>('/Department', {
      params: filters,
    })
    return response.data
  }

  async getById(id: number, includeSubDepartments?: boolean): Promise<DepartmentDto> {
    const params = includeSubDepartments ? { includeSubDepartments } : {}
    const response = await axios.get<DepartmentDto>(`/Department/${id}`, { params })
    return response.data
  }

  async getByCode(code: string): Promise<DepartmentDto> {
    const response = await axios.get<DepartmentDto>(`/Department/by-code/${code}`)
    return response.data
  }

  async getHierarchy(): Promise<DepartmentDto[]> {
    const response = await axios.get<DepartmentDto[]>('/Department/hierarchy')
    return response.data
  }

  async getSubDepartments(id: number): Promise<DepartmentDto[]> {
    const response = await axios.get<DepartmentDto[]>(`/Department/${id}/sub-departments`)
    return response.data
  }

  async getTopLevel(filters: DepartmentFilters): Promise<PaginatedResponse<DepartmentDto>> {
    const response = await axios.get<PaginatedResponse<DepartmentDto>>('/Department/top-level', {
      params: filters,
    })
    return response.data
  }

  async getWithBudget(filters: DepartmentFilters): Promise<PaginatedResponse<DepartmentDto>> {
    const response = await axios.get<PaginatedResponse<DepartmentDto>>('/Department/with-budget', {
      params: filters,
    })
    return response.data
  }

  async create(data: Department): Promise<DepartmentDto> {
    const response = await axios.post<DepartmentDto>('/Department', data)
    return response.data
  }

  async update(id: number, data: DepartmentUpdateDto): Promise<DepartmentDto> {
    const response = await axios.put<DepartmentDto>(`/Department/${id}`, data)
    return response.data
  }

  async delete(id: number): Promise<void> {
    await axios.delete(`/Department/${id}`)
  }
}
