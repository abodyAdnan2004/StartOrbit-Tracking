import type { Location } from "./location.ts";
// Reports Types
export interface DashboardSummary {
	totalUsers: number;
	activeUsers: number;
	totalCustomers: number;
	activeCustomers: number;
	totalLocations: number;
	usersWithLocations: number;
	period: {
		startDate?: string;
		endDate?: string;
	};
}

export interface LeaderboardUser {
	userId: string;
	fullName: string;
	username: string;
	role: string;
	value: number;
	label: string;
}

export interface TopCustomersAdded extends LeaderboardUser {
	customersAdded: number;
}

export interface TopStepsWalked extends LeaderboardUser {
	distanceMeters: number;
	distanceKm: string;
	estimatedSteps: number;
	locationCount: number;
}

export interface TopActiveUsers extends LeaderboardUser {
	locationCount: number;
	lastActiveAt: string;
	lastLocationAt: string | null;
	hoursSinceLastLocation: number;
	activityScore: number;
}

export interface ActivationTrackingItem {
	userId: string;
	fullName: string;
	username: string;
	email: string;
	role: string;
	createdAt: string;
	lastActiveAt: string;
	lastLocationAt: string | null;
	lastLocation: { latitude: number; longitude: number } | null;
	locationCount: number;
	customerCount: number;
	status: "active" | "recent" | "idle" | "inactive";
}

export interface UserActivityDetail {
	user: {
		id: string;
		fullName: string;
		username: string;
		email: string;
		role: string;
	};
	period: { startDate?: string; endDate?: string };
	summary: {
		totalLocations: number;
		totalDistanceMeters: number;
		totalDistanceKm: string;
		estimatedSteps: number;
		customersCreated: number;
		activeDays: number;
	};
	dailyActivity: DailyActivity[];
	recentLocations: Location[];
	customersCreated: { id: string; name: string; createdAt: string }[];
}

export interface DailyActivity {
	date: string;
	locationCount: number;
	distanceMeters: number;
	distanceKm: string;
	estimatedSteps: number;
	uniqueCustomers: number;
}

export interface HeatmapData {
	latitude: number;
	longitude: number;
	intensity: number;
	uniqueUsers: number;
}
