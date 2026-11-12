// Location Types (Real-time only - no history persistence)
export interface Location {
	userId: string;
	latitude: number;
	longitude: number;
	altitude?: number;
	accuracy?: number;
	speed?: number;
	heading?: number;
	timestamp: Date;
	metadata?: Record<string, unknown>;
}