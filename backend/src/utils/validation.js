import { z } from 'zod';

// Auth validation schemas
export const loginSchema = z.object({
  loginIdentifier: z.string().min(1, 'Login identifier is required'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

export const registerSchema = z.object({
  employeeId: z.number().int().positive('Employee ID must be a positive integer'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(50),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  phoneNumber: z.string().optional(),
  roleId: z.number().int().positive().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Confirm password is required'),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// User validation schemas
export const createUserSchema = z.object({
  employeeId: z.number().int().positive('Employee ID must be a positive integer'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(50),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  phoneNumber: z.string().optional(),
  roleId: z.number().int().positive(),
  isActive: z.boolean().default(true),
});

export const updateUserSchema = z.object({
  username: z.string().min(3).max(50).optional(),
  email: z.string().email().optional(),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phoneNumber: z.string().optional(),
  roleId: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
});

// Customer validation schemas
export const createCustomerSchema = z.object({
  name: z.string().min(1, 'Customer name is required').max(200),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  userId: z.number().int().positive('User ID is required'),
});

export const updateCustomerSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().optional(),
  userId: z.number().int().positive().optional(),
});

// Location validation schemas
export const createLocationSchema = z.object({
  latitude: z.number().min(-90).max(90, 'Latitude must be between -90 and 90'),
  longitude: z.number().min(-180).max(180, 'Longitude must be between -180 and 180'),
  altitude: z.number().optional(),
  accuracy: z.number().positive().optional(),
  speed: z.number().optional(),
  heading: z.number().min(0).max(360).optional(),
  customerId: z.number().int().positive().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const locationQuerySchema = z.object({
  userId: z.number().int().positive().optional(),
  customerId: z.number().int().positive().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(50),
});

// Query parameter schemas
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const userFiltersSchema = paginationSchema.extend({
  search: z.string().optional(),
  roleId: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
});

export const customerFiltersSchema = paginationSchema.extend({
  search: z.string().optional(),
  userId: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
});