import type { PaginatedResponse } from "./base-types.ts";

// Customer Types
export interface Customer {
	id: string;
	name: string;
	email?: string;
	phone?: string;
	address?: string;
	notes?: string;
	isActive: boolean;
	userId: string;
	user?: {
		id: string;
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
	userId?: string;
	isActive?: boolean;
	sortBy?: string;
	sortOrder?: "asc" | "desc";
}

export type CustomerListResponse = PaginatedResponse<Customer>;
