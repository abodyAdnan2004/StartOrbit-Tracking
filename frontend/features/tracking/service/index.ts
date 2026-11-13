import axios from '~/common/services/app-client/axios'

interface ITrackingService {
  // Real-time only via Socket.io - no REST endpoints
  getCustomers: (userId: string) => Promise<any[]>
}

export class TrackingService implements ITrackingService {
  async getCustomers(userId: string): Promise<any[]> {
    const response = await axios.get(`/users/${userId}/customers`)
    return response.data.items || response.data
  }
}

export const trackingService = new TrackingService()
