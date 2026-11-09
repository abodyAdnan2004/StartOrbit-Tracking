import axios from '~/common/services/app-client/axios'
import type { PaginatedResponse } from '~/common/utils/types/ApiResponses'
import type { UserDto, UserCreateDto, UserUpdateDto, UserFilters, ChangePasswordDto } from '../types'

interface IUserService {
  get: (filters: UserFilters) => Promise<PaginatedResponse<UserDto>>
  getById: (id: number) => Promise<UserDto>
  create: (data: UserCreateDto) => Promise<UserDto>
  update: (id: number, data: UserUpdateDto) => Promise<UserDto>
  delete: (id: number) => Promise<void>
  changePassword: (id: number, data: ChangePasswordDto) => Promise<void>
  getMe: () => Promise<UserDto>
}

export class UserService implements IUserService {
  async get(filters: UserFilters): Promise<PaginatedResponse<UserDto>> {
    const response = await axios.get<PaginatedResponse<UserDto>>('/users', {
      params: filters,
    })
    return response.data
  }

  async getById(id: number): Promise<UserDto> {
    const response = await axios.get<UserDto>(`/users/${id}`)
    return response.data
  }

  async create(data: UserCreateDto): Promise<UserDto> {
    const response = await axios.post<UserDto>('/users', data)
    return response.data
  }

  async update(id: number, data: UserUpdateDto): Promise<UserDto> {
    const response = await axios.put<UserDto>(`/users/${id}`, data)
    return response.data
  }

  async delete(id: number): Promise<void> {
    await axios.delete(`/users/${id}`)
  }

  async changePassword(id: number, data: ChangePasswordDto): Promise<void> {
    await axios.post(`/users/${id}/change-password`, data)
  }

  async getMe(): Promise<UserDto> {
    const response = await axios.get<{ data: UserDto }>('/auth/me')
    return response.data.data
  }
}

export const userService = new UserService()