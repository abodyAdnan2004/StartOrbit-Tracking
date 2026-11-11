import type { PaginatedResponse } from "./base-types.ts";

// Location Types
export interface Location {
	id: string;
	userId: string;
	user?: {
		id: string;
		fullName: string;
		username: string;
	};
	customerId: string | null;
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
	timestamp: Date;
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

export type LocationListResponse = PaginatedResponse<Location>;
