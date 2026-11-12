import express from "express";
import ExcelJS from "exceljs";
import { prisma } from "../index.js";
import {
	createCustomerSchema,
	updateCustomerSchema,
	customerFiltersSchema,
} from "../utils/validation.js";
import { requireRole, requireAdminOrViewer, requireMobileAccess } from "../middleware/auth.js";
import { NotFoundError, ForbiddenError, ValidationError } from "../middleware/errorHandler.js";

const router = express.Router();

// GET /api/customers - Get all customers with pagination and filters
router.get("/", requireRole("admin", "user", "viewer"), async (req, res, next) => {
	try {
		const { page, limit, sortBy, sortOrder, search, userId, userFullName, userUsername, isActive, status, fromDate, toDate } =
			customerFiltersSchema.parse(req.query);

		const where = {};
		if (search) {
			where.OR = [
				{ name: { contains: search } },
				{ email: { contains: search } },
				{ phone: { contains: search } },
			];
		}
		if (userId) where.userId = userId;
		if (typeof isActive === "boolean") where.isActive = isActive;
		if (status) where.status = status;
		if (fromDate || toDate) {
			where.createdAt = {};
			if (fromDate) where.createdAt.gte = new Date(fromDate);
			if (toDate) where.createdAt.lte = new Date(toDate);
		}

		// If user is not admin/viewer, only show their own customers
		if (!["admin", "viewer"].includes(req.user.role)) {
			where.userId = req.user.id;
		} else if (userFullName || userUsername) {
			// Filter by user's fullName or username
			const userWhere = {};
			if (userFullName) userWhere.fullName = { contains: userFullName };
			if (userUsername) userWhere.username = { contains: userUsername };

			const users = await prisma.user.findMany({
				where: userWhere,
				select: { id: true },
			});
			const userIds = users.map(u => u.id);
			if (userIds.length > 0) {
				where.userId = { in: userIds };
			} else {
				where.userId = { in: [] }; // No matches
			}
		}

		const [customers, totalCount] = await Promise.all([
			prisma.customer.findMany({
				where,
				include: {
					user: {
						select: { id: true, fullName: true, username: true },
					},
				},
				orderBy: { [sortBy || "createdAt"]: sortOrder },
				skip: (page - 1) * limit,
				take: limit,
			}),
			prisma.customer.count({ where }),
		]);

		const totalPages = Math.ceil(totalCount / limit);

		res.json({
			items: customers,
			pagesCount: totalPages,
			currentPage: page,
			type: "CustomerDto",
			totalItems: totalCount,
			calculatedTotalPages: totalPages,
			currentPageSize: limit,
			totalCount,
			totalPages,
		});
	} catch (error) {
		next(error);
	}
});

// GET /api/customers/export - Export customers to Excel
router.get("/export", requireAdminOrViewer, async (req, res, next) => {
	try {
		const { search, userId, userFullName, userUsername, isActive, status, fromDate, toDate } =
			customerFiltersSchema.parse(req.query);

		const where = {};
		if (search) {
			where.OR = [
				{ name: { contains: search } },
				{ email: { contains: search } },
				{ phone: { contains: search } },
			];
		}
		if (userId) where.userId = userId;
		if (typeof isActive === "boolean") where.isActive = isActive;
		if (status) where.status = status;
		if (fromDate || toDate) {
			where.createdAt = {};
			if (fromDate) where.createdAt.gte = new Date(fromDate);
			if (toDate) where.createdAt.lte = new Date(toDate);
		}

		// If user is not admin/viewer, only show their own customers
		if (!["admin", "viewer"].includes(req.user.role)) {
			where.userId = req.user.id;
		} else if (userFullName || userUsername) {
			const userWhere = {};
			if (userFullName) userWhere.fullName = { contains: userFullName };
			if (userUsername) userWhere.username = { contains: userUsername };

			const users = await prisma.user.findMany({
				where: userWhere,
				select: { id: true },
			});
			const userIds = users.map(u => u.id);
			if (userIds.length > 0) {
				where.userId = { in: userIds };
			} else {
				where.userId = { in: [] };
			}
		}

		const customers = await prisma.customer.findMany({
			where,
			include: {
				user: {
					select: { id: true, fullName: true, username: true },
				},
			},
			orderBy: { createdAt: "desc" },
		});

		// Create Excel workbook
		const workbook = new ExcelJS.Workbook();
		const worksheet = workbook.addWorksheet("Customers");

		// Define columns
		worksheet.columns = [
			{ header: "Name", key: "name", width: 30 },
			{ header: "Email", key: "email", width: 30 },
			{ header: "Phone", key: "phone", width: 20 },
			{ header: "Address", key: "address", width: 40 },
			{ header: "Status", key: "status", width: 15 },
			{ header: "Status Timestamps", key: "statusTimestamps", width: 40 },
			{ header: "Longitude", key: "longitude", width: 15 },
			{ header: "Latitude", key: "latitude", width: 15 },
			{ header: "Assigned User", key: "user", width: 25 },
			{ header: "Active", key: "isActive", width: 10 },
			{ header: "Notes", key: "notes", width: 40 },
			{ header: "Created At", key: "createdAt", width: 25 },
			{ header: "Updated At", key: "updatedAt", width: 25 },
		];

		// Style header row
		worksheet.getRow(1).font = { bold: true };
		worksheet.getRow(1).fill = {
			type: "pattern",
			pattern: "solid",
			fgColor: { argb: "FF4472C4" },
		};
		worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };

		// Add data rows
		customers.forEach((customer) => {
			worksheet.addRow({
				name: customer.name,
				email: customer.email || "",
				phone: customer.phone || "",
				address: customer.address || "",
				status: customer.status,
				statusTimestamps: customer.statusTimestamps ? JSON.stringify(customer.statusTimestamps) : "",
				longitude: customer.longitude || "",
				latitude: customer.latitude || "",
				user: customer.user?.fullName || "",
				isActive: customer.isActive ? "Yes" : "No",
				notes: customer.notes || "",
				createdAt: customer.createdAt.toISOString(),
				updatedAt: customer.updatedAt.toISOString(),
			});
		});

		// Set response headers
		const dateStr = new Date().toISOString().split("T")[0];
		const filename = `customers-export-${dateStr}.xlsx`;

		res.setHeader(
			"Content-Type",
			"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
		);
		res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

		// Write to response
		await workbook.xlsx.write(res);
		res.end();
	} catch (error) {
		next(error);
	}
});

// GET /api/customers/:id - Get customer by ID
router.get("/:id", requireRole("admin", "user", "viewer"), async (req, res, next) => {
	try {
		const id = req.params.id;
		// Validate UUID format
		const uuidRegex =
			/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
		if (!uuidRegex.test(id)) {
			return res
				.status(400)
				.json({ error: "Invalid customer ID format" });
		}

		const customer = await prisma.customer.findUnique({
			where: { id },
			include: {
				user: { select: { id: true, fullName: true, username: true } },
			},
		});

		if (!customer) {
			throw new NotFoundError("Customer not found");
		}

		// Check authorization
		if (
			!["admin", "viewer"].includes(req.user.role) &&
			customer.userId !== req.user.id
		) {
			throw new ForbiddenError("Not authorized to view this customer");
		}

		res.json(customer);
	} catch (error) {
		next(error);
	}
});

// POST /api/customers - Create new customer
router.post("/", requireRole("admin", "user"), async (req, res, next) => {
	try {
		const data = createCustomerSchema.parse(req.body);

		// If user is not admin, they can only create customers for themselves
		let userId = data.userId;
		if (!["admin"].includes(req.user.role)) {
			userId = req.user.id;
		}

		// Verify the target user exists
		const targetUser = await prisma.user.findUnique({
			where: { id: userId },
		});
		if (!targetUser) {
			throw new NotFoundError("Assigned user not found");
		}

		const existingCustomer = await prisma.customer.findFirst({
			where: {
				OR: [{ email: data.email }, { phone: data.phone }],
			},
		});
		if (existingCustomer) {
			throw new ConflictError(
				"Customer with this phone or email already exists",
			);
		}

		// Initialize statusTimestamps as JSON string
		const statusTimestamps = JSON.stringify({
			pending: new Date().toISOString(),
		});

		const customer = await prisma.customer.create({
			data: {
				name: data.name,
				email: data.email || null,
				phone: data.phone || null,
				address: data.address || null,
				notes: data.notes || null,
				userId,
				longitude: data.longitude || null,
				latitude: data.latitude || null,
				status: data.status,
				statusTimestamps,
			},
			include: {
				user: { select: { id: true, fullName: true, username: true } },
			},
		});

		res.status(201).json(customer);
	} catch (error) {
		next(error);
	}
});

// PUT /api/customers/:id - Update customer
router.put("/:id", requireRole("admin", "user"), async (req, res, next) => {
	try {
		const id = req.params.id;
		// Validate UUID format
		const uuidRegex =
			/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
		if (!uuidRegex.test(id)) {
			return res
				.status(400)
				.json({ error: "Invalid customer ID format" });
		}

		const data = updateCustomerSchema.parse(req.body);

		const customer = await prisma.customer.findUnique({ where: { id } });
		if (!customer) {
			throw new NotFoundError("Customer not found");
		}

		// Check authorization
		if (
			!["admin"].includes(req.user.role) &&
			customer.userId !== req.user.id
		) {
			throw new ForbiddenError("Not authorized to update this customer");
		}

		// If user is not admin, they can't reassign customer
		let userId = data.userId;
		if (!["admin"].includes(req.user.role)) {
			userId = customer.userId;
		}

		// If reassigning, verify target user exists
		if (userId && userId !== customer.userId) {
			const targetUser = await prisma.user.findUnique({
				where: { id: userId },
			});
			if (!targetUser) {
				throw new NotFoundError("Assigned user not found");
			}
		}

		// Status transition validation
		if (data.status && data.status !== customer.status) {
			const validTransitions = {
				pending: ['approved', 'cancelled'],
				approved: [],      // Terminal
				cancelled: [],     // Terminal
			};

			if (!validTransitions[customer.status]?.includes(data.status)) {
				throw new ValidationError(`Cannot change status from ${customer.status} to ${data.status}`);
			}

			// Update timestamps (stored as JSON string)
			const timestamps = customer.statusTimestamps ? JSON.parse(customer.statusTimestamps) : { pending: customer.createdAt.toISOString() };
			timestamps[data.status] = new Date().toISOString();
			data.statusTimestamps = JSON.stringify(timestamps);
		}

		const updatedCustomer = await prisma.customer.update({
			where: { id },
			data: {
				...data,
				userId: userId || customer.userId,
			},
			include: {
				user: { select: { id: true, fullName: true, username: true } },
			},
		});

		res.json(updatedCustomer);
	} catch (error) {
		next(error);
	}
});

// DELETE /api/customers/:id - Delete customer (soft delete)
router.delete("/:id", requireRole("admin"), async (req, res, next) => {
	try {
		const id = req.params.id;
		// Validate UUID format
		const uuidRegex =
			/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
		if (!uuidRegex.test(id)) {
			return res
				.status(400)
				.json({ error: "Invalid customer ID format" });
		}

		const customer = await prisma.customer.findUnique({ where: { id } });
		if (!customer) {
			throw new NotFoundError("Customer not found");
		}

		await prisma.customer.update({
			where: { id },
			data: { isActive: false },
		});

		res.json({ message: "Customer deactivated successfully" });
	} catch (error) {
		next(error);
	}
});

export default router;