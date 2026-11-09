// Customer Types
export interface Customer {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  isActive: boolean;
  userId: number;
  user?: {
    id: number;
    fullName: string;
    username: string;
  };
  createdAt: string;
  updatedAt: string;
  // For map markers
  latitude?: number;
  longitude?: number;
}

export interface CustomerFilters {
  page?: number;
  limit?: number;
  search?: string;
  userId?: number;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
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

export type CustomerListResponse = PaginatedResponse<Customer>;