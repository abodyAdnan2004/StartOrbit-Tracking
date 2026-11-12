import type { PaginatedResponse } from "./base-types.ts";

// Customer Types
export interface Customer {
	id: string;
	name: string;
	email?: string;
	phone?: string;
	address?: string;
	notes?: string;
	status: 'pending' | 'approved' | 'cancelled';
	statusTimestamps: {
		pending: string;
		approved?: string;
		cancelled?: string;
	};
	location: [longitude: number | null, latitude: number | null];
	isActive: boolean;
	userId: string;
	user?: {
		id: string;
		fullName: string;
		username: string;
	};
	createdAt: string;
	updatedAt: string;
}

export interface CustomerFilters {
	page?: number;
	limit?: number;
	search?: string;
	userId?: string;
	userFullName?: string;
	userUsername?: string;
	isActive?: boolean;
	status?: 'pending' | 'approved' | 'cancelled';
	fromDate?: string;
	toDate?: string;
	sortBy?: string;
	sortOrder?: "asc" | "desc";
}

export type CustomerListResponse = PaginatedResponse<Customer>;

export interface CustomerCreateRequest {
	name: string;
	email?: string;
	phone?: string;
	address?: string;
	notes?: string;
	userId: string | null;
	longitude?: number | null;
	latitude?: number | null;
	status?: 'pending' | 'approved' | 'cancelled';
}

export interface CustomerUpdateRequest {
	id: string;
	name?: string;
	email?: string;
	phone?: string;
	address?: string;
	notes?: string;
	isActive?: boolean;
	userId?: string | null;
	longitude?: number | null;
	latitude?: number | null;
	status?: 'pending' | 'approved' | 'cancelled';
}