import express from 'express';
import { prisma } from '../index.js';
import { createCustomerSchema, updateCustomerSchema, customerFiltersSchema } from '../utils/validation.js';
import { requireRole } from '../middleware/auth.js';
import { NotFoundError, ForbiddenError } from '../middleware/errorHandler.js';

const router = express.Router();

// GET /api/customers - Get all customers with pagination and filters
router.get('/', requireRole('admin', 'manager'), async (req, res, next) => {
  try {
    const { page, limit, sortBy, sortOrder, search, userId, isActive } = customerFiltersSchema.parse(req.query);

    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (userId) where.userId = userId;
    if (typeof isActive === 'boolean') where.isActive = isActive;

    // If user is not admin/manager, only show their own customers
    if (!['admin', 'manager'].includes(req.user.role)) {
      where.userId = req.user.id;
    }

    const [customers, totalCount] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: { user: { select: { id: true, fullName: true, username: true } } },
        orderBy: { [sortBy || 'createdAt']: sortOrder },
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
      type: 'CustomerDto',
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

// GET /api/customers/:id - Get customer by ID
router.get('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid customer ID' });
    }

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: { user: { select: { id: true, fullName: true, username: true } } },
    });

    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    // Check authorization
    if (!['admin', 'manager'].includes(req.user.role) && customer.userId !== req.user.id) {
      throw new ForbiddenError('Not authorized to view this customer');
    }

    res.json(customer);
  } catch (error) {
    next(error);
  }
});

// POST /api/customers - Create new customer
router.post('/', requireRole('admin', 'manager', 'user'), async (req, res, next) => {
  try {
    const data = createCustomerSchema.parse(req.body);

    // If user is not admin/manager, they can only create customers for themselves
    let userId = data.userId;
    if (!['admin', 'manager'].includes(req.user.role)) {
      userId = req.user.id;
    }

    // Verify the target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!targetUser) {
      throw new NotFoundError('Assigned user not found');
    }

    const customer = await prisma.customer.create({
      data: {
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        notes: data.notes || null,
        userId,
      },
      include: { user: { select: { id: true, fullName: true, username: true } } },
    });

    res.status(201).json(customer);
  } catch (error) {
    next(error);
  }
});

// PUT /api/customers/:id - Update customer
router.put('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid customer ID' });
    }

    const data = updateCustomerSchema.parse(req.body);

    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    // Check authorization
    if (!['admin', 'manager'].includes(req.user.role) && customer.userId !== req.user.id) {
      throw new ForbiddenError('Not authorized to update this customer');
    }

    // If user is not admin/manager, they can't reassign customer
    let userId = data.userId;
    if (!['admin', 'manager'].includes(req.user.role)) {
      userId = customer.userId;
    }

    // If reassigning, verify target user exists
    if (userId && userId !== customer.userId) {
      const targetUser = await prisma.user.findUnique({ where: { id: userId } });
      if (!targetUser) {
        throw new NotFoundError('Assigned user not found');
      }
    }

    const updatedCustomer = await prisma.customer.update({
      where: { id },
      data: {
        ...data,
        userId: userId || customer.userId,
      },
      include: { user: { select: { id: true, fullName: true, username: true } } },
    });

    res.json(updatedCustomer);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/customers/:id - Delete customer (soft delete)
router.delete('/:id', requireRole('admin', 'manager'), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid customer ID' });
    }

    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    await prisma.customer.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({ message: 'Customer deactivated successfully' });
  } catch (error) {
    next(error);
  }
});

// GET /api/customers/:id/locations - Get location history for a customer
router.get('/:id/locations', async (req, res, next) => {
  try {
    const customerId = parseInt(req.params.id);
    if (isNaN(customerId)) {
      return res.status(400).json({ error: 'Invalid customer ID' });
    }

    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    // Check authorization
    if (!['admin', 'manager'].includes(req.user.role) && customer.userId !== req.user.id) {
      throw new ForbiddenError('Not authorized to view this customer\'s locations');
    }

    const { page, limit, startDate, endDate } = req.query;

    const where = { customerId };
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate);
      if (endDate) where.timestamp.lte = new Date(endDate);
    }

    const [locations, totalCount] = await Promise.all([
      prisma.location.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit) || 50,
      }),
      prisma.location.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / (parseInt(limit) || 50));

    res.json({
      items: locations,
      pagesCount: totalPages,
      currentPage: parseInt(page) || 1,
      type: 'LocationDto',
      totalItems: totalCount,
      calculatedTotalPages: totalPages,
      currentPageSize: parseInt(limit) || 50,
      totalCount,
      totalPages,
    });
  } catch (error) {
    next(error);
  }
});

export default router;