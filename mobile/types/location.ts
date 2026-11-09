// Location Types
export interface Location {
  id: string;
  userId: string;
  user?: {
    id: string;
    fullName: string;
    username: string;
  };
  customerId?: string;
  customer?: {
    id: string;
    name: string;
  };
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface LocationFilters {
  userId?: string;
  customerId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface LocationStats {
  userId: string;
  totalDistanceMeters: number;
  totalDistanceKm: string;
  estimatedSteps: number;
  locationCount: number;
  period: {
    start: string | Date | null;
    end: string | Date | null;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  pagesCount: number;
  currentPage: number;
  type: string;
  totalItems?: number;
  calculatedTotalPages: number;
  currentPageSize: number;
  totalCount: number;
  totalPages: number;
}

export type LocationListResponse = PaginatedResponse<Location>;