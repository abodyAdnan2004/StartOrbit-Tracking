// Auth Types
export type UserRole = "admin" | "user" | "viewer";

export interface User {
	id: string;
	username: string;
	email: string;
	firstName: string;
	lastName: string;
	fullName: string;
	phoneNumber: string;
	role: UserRole;
	isActive: boolean;
}

export interface Token {
	accessToken: string;
	refreshToken: string;
	expiresAt: string;
	tokenType: string;
	expiresInSeconds: number;
}

export interface AuthResponse {
	isSuccess: boolean;
	message: string;
	errorCode: string | null;
	user: User;
	token: Token;
}

export interface LoginRequest {
	loginIdentifier: string;
	password: string;
	rememberMe?: boolean;
}

export interface RegisterRequest {
	username: string;
	email: string;
	password: string;
	firstName: string;
	lastName: string;
	phoneNumber?: string;
	role?: UserRole;
}

export interface ChangePasswordRequest {
	currentPassword: string;
	newPassword: string;
	confirmPassword: string;
}
