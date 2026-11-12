import { create } from 'zustand';
import { api } from '@/utils/api';
import { Customer, CustomerCreateRequest, CustomerUpdateRequest, CustomerFilters } from '@/types/customer';

interface CustomerState {
  customers: Customer[];
  isLoading: boolean;
  searchQuery: string;
  error: string | null;

  // Actions
  loadCustomers: (filters?: CustomerFilters) => Promise<void>;
  createCustomer: (data: CustomerCreateRequest) => Promise<Customer>;
  updateCustomer: (id: string, data: CustomerUpdateRequest) => Promise<Customer>;
  deleteCustomer: (id: string) => Promise<void>;
  exportCustomers: (filters?: CustomerFilters) => Promise<Blob>;
  setSearchQuery: (query: string) => void;
  clearError: () => void;
}

export const useCustomerStore = create<CustomerState>((set, get) => ({
  customers: [],
  isLoading: false,
  searchQuery: '',
  error: null,

  loadCustomers: async (filters?: CustomerFilters) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, String(value));
          }
        });
      }
      const response = await api.get<{ items: Customer[] }>(`/customers?${params.toString()}`);
      set({ customers: response.data.items, isLoading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to load customers', isLoading: false });
    }
  },

  createCustomer: async (data: CustomerCreateRequest) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post<Customer>('/customers', data);
      set(state => ({
        customers: [response.data, ...state.customers],
        isLoading: false,
      }));
      return response.data;
    } catch (error: any) {
      set({ error: error.message || 'Failed to create customer', isLoading: false });
      throw error;
    }
  },

  updateCustomer: async (id: string, data: CustomerUpdateRequest) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.put<Customer>(`/customers/${id}`, data);
      set(state => ({
        customers: state.customers.map(c => c.id === id ? response.data : c),
        isLoading: false,
      }));
      return response.data;
    } catch (error: any) {
      set({ error: error.message || 'Failed to update customer', isLoading: false });
      throw error;
    }
  },

  deleteCustomer: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/customers/${id}`);
      set(state => ({
        customers: state.customers.filter(c => c.id !== id),
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error.message || 'Failed to delete customer', isLoading: false });
      throw error;
    }
  },

  exportCustomers: async (filters?: CustomerFilters) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, String(value));
          }
        });
      }
      const response = await api.get(`/customers/export?${params.toString()}`, {
        responseType: 'blob',
      });
      set({ isLoading: false });
      return response.data;
    } catch (error: any) {
      set({ error: error.message || 'Failed to export customers', isLoading: false });
      throw error;
    }
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  clearError: () => {
    set({ error: null });
  },
}));