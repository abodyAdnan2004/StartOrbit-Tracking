import axios from '~/common/services/app-client/axios'
import type { AuthResponse, LoginBody, MeResponse } from '../types'

interface IAuthService {
  login: (body: LoginBody) => Promise<AuthResponse>
  me: () => Promise<MeResponse>
}

export class AuthService implements IAuthService {
  async login(body: LoginBody): Promise<AuthResponse> {
    const response = await axios.post<AuthResponse>('/Auth/login', body)
    return response.data
  }

  async me(): Promise<MeResponse> {
    const response = await axios.get<{ data: MeResponse }>('/Auth/me')
    return response.data.data
  }
}
