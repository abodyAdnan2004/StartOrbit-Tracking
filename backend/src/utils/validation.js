import { z } from "zod";

// Auth validation schemas
export const loginSchema = z.object({
	loginIdentifier: z.string().min(1, "Login identifier is required"),
	password: z.string().min(1, "Password is required"),
	rememberMe: z.boolean().optional(),
});

export const registerSchema = z.object({
	username: z
		.string()
		.min(3, "Username must be at least 3 characters")
		.max(50),
	email: z.string().email("Invalid email address"),
	password: z.string().min(8, "Password must be at least 8 characters"),
	firstName: z.string().min(1, "First name is required").max(100),
	lastName: z.string().min(1, "Last name is required").max(100),
	phoneNumber: z.string().optional(),
	role: z.enum(["admin", "user", "viewer"]).optional(), // ADD viewer
});

export const changePasswordSchema = z
	.object({
		currentPassword: z.string().min(1, "Current password is required"),
		newPassword: z
			.string()
			.min(8, "New password must be at least 8 characters"),
		confirmPassword: z.string().min(1, "Confirm password is required"),
	})
	.refine((data) => data.newPassword === data.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	});

// User validation schemas
export const createUserSchema = z.object({
	username: z
		.string()
		.min(3, "Username must be at least 3 characters")
		.max(50),
	email: z.string().email("Invalid email address"),
	password: z.string().min(8, "Password must be at least 8 characters"),
	firstName: z.string().min(1, "First name is required").max(100),
	lastName: z.string().min(1, "Last name is required").max(100),
	phoneNumber: z.string().optional(),
	role: z.enum(["admin", "user", "viewer"]).optional(), // ADD viewer
	isActive: z.boolean().default(true),
});

export const updateUserSchema = z.object({
	username: z.string().min(3).max(50).optional(),
	email: z.string().email().optional(),
	firstName: z.string().min(1).max(100).optional(),
	lastName: z.string().min(1).max(100).optional(),
	phoneNumber: z.string().optional(),
	role: z.enum(["admin", "user", "viewer"]).optional(), // ADD viewer
	isActive: z.boolean().optional(),
});

// Customer validation schemas
const uuidRegex =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const createCustomerSchema = z.object({
	name: z.string().min(1, "Customer name is required").max(200),
	email: z
		.string()
		.email("Invalid email address")
		.optional()
		.or(z.literal("")),
	phone: z.string().optional(),
	address: z.string().optional(),
	notes: z.string().optional(),
	userId: z.string().regex(uuidRegex, "Invalid user ID format").optional(),
	longitude: z.number().min(-180).max(180).optional().nullable(),
	latitude: z.number().min(-90).max(90).optional().nullable(),
	status: z
		.enum(["pending", "approved", "cancelled"])
		.optional()
		.default("pending"),
});

export const updateCustomerSchema = z
	.object({
		name: z.string().min(1).max(200).optional(),
		email: z.string().email().optional().or(z.literal("")),
		phone: z.string().optional(),
		address: z.string().optional(),
		notes: z.string().optional(),
		isActive: z.boolean().optional(),
		userId: z
			.string()
			.regex(uuidRegex, "Invalid user ID format")
			.optional(),
		longitude: z.number().min(-180).max(180).optional().nullable(),
		latitude: z.number().min(-90).max(90).optional().nullable(),
		status: z.enum(["pending", "approved", "cancelled"]).optional(),
	})
	.refine((data) => {
		// Validate status transitions: pending -> approved/cancelled only
		// This will be validated in route with current status
		return true;
	});

// REMOVED Location validation schemas - No history persistence

// Query parameter schemas
export const paginationSchema = z.object({
	page: z.number().int().positive().default(1),
	limit: z.number().int().positive().max(100).default(20),
	sortBy: z.string().optional(),
	sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const userFiltersSchema = paginationSchema.extend({
	search: z.string().optional(),
	role: z.enum(["admin", "user", "viewer"]).optional(), // ADD viewer
	isActive: z.boolean().optional(),
});

export const customerFiltersSchema = paginationSchema.extend({
	search: z.string().optional(), // searches name, email, phone
	userId: z.string().regex(uuidRegex).optional(),
	userFullName: z.string().optional(), // NEW: filter by user.fullName
	userUsername: z.string().optional(), // NEW: filter by user.username
	isActive: z.boolean().optional(),
	status: z.enum(["pending", "approved", "cancelled"]).optional(),
	fromDate: z.string().datetime().optional(), // NEW: createdAt >=
	toDate: z.string().datetime().optional(), // NEW: createdAt <=
});
