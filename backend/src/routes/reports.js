import express from "express";
import { prisma } from "../index.js";
import { requireRole } from "../middleware/auth.js";
import { NotFoundError } from "../middleware/errorHandler.js";

const router = express.Router();

// All report routes require admin or viewer role
router.use(requireRole("admin", "viewer"));

// GET /api/reports/dashboard - Main dashboard summary
router.get("/dashboard", async (req, res, next) => {
	try {
		const { startDate, endDate } = req.query;

		const dateFilter = {};
		if (startDate || endDate) {
			dateFilter.createdAt = {};
			if (startDate) dateFilter.createdAt.gte = new Date(startDate);
			if (endDate) dateFilter.createdAt.lte = new Date(endDate);
		}

		// Parallel queries for dashboard
		const [
			totalUsers,
			activeUsers,
			totalCustomers,
			activeCustomers,
			customersByStatus,
			recentActivity,
			topCustomersAdded,
		] = await Promise.all([
			// Total users
			prisma.user.count({ where: { isActive: true } }),

			// Active users (users with customers in period or recently active)
			prisma.user.count({
				where: {
					isActive: true,
					customers: dateFilter.createdAt
						? { some: dateFilter }
						: { some: {} },
				},
			}),

			// Total customers
			prisma.customer.count({ where: { isActive: true } }),

			// Active customers (customers in period)
			prisma.customer.count({
				where: {
					isActive: true,
					createdAt: dateFilter.createdAt ? dateFilter : undefined,
				},
			}),

			// Customers by status
			prisma.customer.groupBy({
				by: ["status"],
				where: { isActive: true },
				_count: { status: true },
			}),

			// Recent user activity (last 24 hours or specified period)
			prisma.user.findMany({
				where: {
					isActive: true,
					updatedAt: dateFilter.createdAt
						? dateFilter
						: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
				},
				select: {
					id: true,
					fullName: true,
					username: true,
					role: true,
					updatedAt: true,
				},
				orderBy: { updatedAt: "desc" },
				take: 10,
			}),

			// Top users by customers added
			getTopCustomersAdded(dateFilter),
		]);

		// Format customers by status
		const statusCounts = { pending: 0, approved: 0, cancelled: 0 };
		customersByStatus.forEach((item) => {
			statusCounts[item.status] = item._count.status;
		});

		res.json({
			summary: {
				totalUsers,
				activeUsers,
				totalCustomers,
				activeCustomers,
				customersByStatus: statusCounts,
				period: { startDate, endDate },
			},
			recentActivity,
			leaderboards: {
				topCustomersAdded,
			},
		});
	} catch (error) {
		next(error);
	}
});

// GET /api/reports/customers-added - Users ranked by customers created
router.get("/customers-added", async (req, res, next) => {
	try {
		const { startDate, endDate, limit = 10 } = req.query;

		const dateFilter = buildDateFilter(startDate, endDate);

		const results = await getTopCustomersAdded(dateFilter, parseInt(limit));

		res.json({ items: results });
	} catch (error) {
		next(error);
	}
});

// GET /api/reports/customers-by-status - Customer status distribution
router.get("/customers-by-status", async (req, res, next) => {
	try {
		const { startDate, endDate } = req.query;
		const dateFilter = buildDateFilter(startDate, endDate);

		const customersByStatus = await prisma.customer.groupBy({
			by: ["status"],
			where: { isActive: true, ...dateFilter },
			_count: { status: true },
		});

		const statusCounts = { pending: 0, approved: 0, cancelled: 0 };
		customersByStatus.forEach((item) => {
			statusCounts[item.status] = item._count.status;
		});

		res.json({ items: statusCounts });
	} catch (error) {
		next(error);
	}
});

// GET /api/reports/user-activity - User activity tracking (login/creation)
router.get("/user-activity", async (req, res, next) => {
	try {
		const { startDate, endDate, page = 1, limit = 50 } = req.query;

		const dateFilter = buildDateFilter(startDate, endDate);

		const where = { isActive: true };

		// Get users with their customer counts and activity
		const users = await prisma.user.findMany({
			where,
			select: {
				id: true,
				fullName: true,
				username: true,
				email: true,
				role: true,
				createdAt: true,
				updatedAt: true,
				_count: {
					select: {
						customers: { where: { isActive: true, ...dateFilter } },
					},
				},
			},
			orderBy: { updatedAt: "desc" },
			skip: (parseInt(page) - 1) * parseInt(limit),
			take: parseInt(limit),
		});

		const activityData = users.map((user) => ({
			userId: user.id,
			fullName: user.fullName,
			username: user.username,
			email: user.email,
			role: user.role,
			createdAt: user.createdAt,
			lastActiveAt: user.updatedAt,
			customersAdded: user._count.customers,
			status: "active", // Simplified - based on recent activity
		}));

		const totalCount = await prisma.user.count({ where });

		res.json({
			items: activityData,
			pagesCount: Math.ceil(totalCount / parseInt(limit)),
			currentPage: parseInt(page),
			totalItems: totalCount,
			totalPages: Math.ceil(totalCount / parseInt(limit)),
		});
	} catch (error) {
		next(error);
	}
});

// GET /api/reports/user/:userId/activity - Detailed activity for a specific user
router.get("/user/:userId/activity", async (req, res, next) => {
	try {
		const userId = req.params.userId;
		const { startDate, endDate } = req.query;

		const dateFilter = buildDateFilter(startDate, endDate);

		// Validate UUID format
		const uuidRegex =
			/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
		if (!uuidRegex.test(userId)) {
			return res.status(400).json({ error: "Invalid user ID format" });
		}

		const user = await prisma.user.findUnique({
			where: { id: userId },
		});

		if (!user) {
			throw new NotFoundError("User not found");
		}

		// Get customers created in period
		const customersCreated = await prisma.customer.findMany({
			where: {
				userId,
				isActive: true,
				createdAt: dateFilter.createdAt ? dateFilter : undefined,
			},
			orderBy: { createdAt: "desc" },
		});

		// Get customer status distribution
		const customersByStatus = await prisma.customer.groupBy({
			by: ["status"],
			where: { userId, isActive: true },
			_count: { status: true },
		});

		const statusCounts = { pending: 0, approved: 0, cancelled: 0 };
		customersByStatus.forEach((item) => {
			statusCounts[item.status] = item._count.status;
		});

		res.json({
			user: {
				id: user.id,
				fullName: user.fullName,
				username: user.username,
				email: user.email,
				role: user.role,
			},
			period: { startDate, endDate },
			summary: {
				totalCustomers: customersCreated.length,
				customersByStatus: statusCounts,
			},
			customersCreated: customersCreated.map((c) => ({
				id: c.id,
				name: c.name,
				status: c.status,
				createdAt: c.createdAt,
			})),
		});
	} catch (error) {
		next(error);
	}
});

// Helper functions

function buildDateFilter(startDate, endDate) {
	const filter = {};
	if (startDate || endDate) {
		filter.createdAt = {};
		if (startDate) filter.createdAt.gte = new Date(startDate);
		if (endDate) filter.createdAt.lte = new Date(endDate);
	}
	return filter;
}

async function getTopCustomersAdded(dateFilter, limit = 10) {
	const users = await prisma.user.findMany({
		where: { isActive: true },
		select: {
			id: true,
			fullName: true,
			username: true,
			role: true,
			_count: {
				select: {
					customers: {
						where: dateFilter.createdAt
							? { createdAt: dateFilter, isActive: true }
							: { isActive: true },
					},
				},
			},
		},
		orderBy: { customers: { _count: "desc" } },
		take: limit,
	});

	return users.map((u) => ({
		userId: u.id,
		fullName: u.fullName,
		username: u.username,
		role: u.role,
		customersAdded: u._count.customers,
	}));
}

export default router;