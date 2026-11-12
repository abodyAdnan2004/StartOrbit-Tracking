import { create } from 'zustand';
import { api } from '@/utils/api';
import { Customer } from '@/types/customer';

interface CustomerState {
  customers: Customer[];
  isLoading: boolean;
  searchQuery: string;
  filterUserId: string;
  error: string | null;

  // Actions
  loadCustomers: () => Promise<void>;
  createCustomer: (data: Partial<Customer>) => Promise<Customer>;
  updateCustomer: (id: string, data: Partial<Customer>) => Promise<Customer>;
  deleteCustomer: (id: string) => Promise<void>;
  setSearchQuery: (query: string) => void;
  setFilterUserId: (userId: string) => void;
  clearError: () => void;
}

export const useCustomerStore = create<CustomerState>((set, get) => ({
  customers: [],
  isLoading: false,
  searchQuery: '',
  filterUserId: '',
  error: null,

  loadCustomers: async () => {
    set({ isLoading: true, error: null });
    try {
      const { filterUserId } = get();
      const params = new URLSearchParams();
      if (filterUserId) params.append('userId', filterUserId);
      const response = await api.get<{ items: Customer[] }>(`/customers?${params.toString()}`);
      set({ customers: response.data.items, isLoading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to load customers', isLoading: false });
    }
  },

  createCustomer: async (data: Partial<Customer>) => {
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

  updateCustomer: async (id: string, data: Partial<Customer>) => {
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

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  setFilterUserId: (userId: string) => {
    set({ filterUserId: userId });
  },

  clearError: () => {
    set({ error: null });
  },
}));