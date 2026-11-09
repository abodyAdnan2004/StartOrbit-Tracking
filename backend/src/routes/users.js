import express from 'express';
import { prisma } from '../index.js';
import { hashPassword } from '../utils/password.js';
import { createUserSchema, updateUserSchema, userFiltersSchema } from '../utils/validation.js';
import { requireRole } from '../middleware/auth.js';
import { NotFoundError, ConflictError } from '../middleware/errorHandler.js';

const router = express.Router();

// GET /api/users - Get all users with pagination and filters
router.get('/', requireRole('admin', 'manager'), async (req, res, next) => {
  try {
    const { page, limit, sortBy, sortOrder, search, roleId, isActive } = userFiltersSchema.parse(req.query);

    const where = {};
    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (roleId) where.roleId = roleId;
    if (typeof isActive === 'boolean') where.isActive = isActive;

    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        include: { role: true },
        orderBy: { [sortBy || 'createdAt']: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      items: users.map(user => ({
        employeeId: user.employeeId,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber || '',
        roles: [{
          name: user.role.name,
          description: user.role.description || '',
          isSystemRole: user.role.isSystemRole,
          id: user.role.id,
          isActive: user.role.isActive,
        }],
        id: user.id,
        isActive: user.isActive,
      })),
      pagesCount: totalPages,
      currentPage: page,
      type: 'UserDto',
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

// GET /api/users/:id - Get user by ID
router.get('/:id', requireRole('admin', 'manager'), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    res.json({
      employeeId: user.employeeId,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      phoneNumber: user.phoneNumber || '',
      roles: [{
        name: user.role.name,
        description: user.role.description || '',
        isSystemRole: user.role.isSystemRole,
        id: user.role.id,
        isActive: user.role.isActive,
      }],
      id: user.id,
      isActive: user.isActive,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/users - Create new user (admin only)
router.post('/', requireRole('admin'), async (req, res, next) => {
  try {
    const data = createUserSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: data.username },
          { email: data.email },
          { employeeId: data.employeeId },
        ],
      },
    });

    if (existingUser) {
      throw new ConflictError('User with this username, email, or employee ID already exists');
    }

    // Hash password
    const passwordHash = await hashPassword(data.password);

    // Create user
    const user = await prisma.user.create({
      data: {
        employeeId: data.employeeId,
        username: data.username,
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        fullName: `${data.firstName} ${data.lastName}`,
        phoneNumber: data.phoneNumber,
        roleId: data.roleId,
        isActive: data.isActive,
      },
      include: { role: true },
    });

    res.status(201).json({
      employeeId: user.employeeId,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      phoneNumber: user.phoneNumber || '',
      roles: [{
        name: user.role.name,
        description: user.role.description || '',
        isSystemRole: user.role.isSystemRole,
        id: user.role.id,
        isActive: user.role.isActive,
      }],
      id: user.id,
      isActive: user.isActive,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/users/:id - Update user
router.put('/:id', requireRole('admin', 'manager'), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const data = updateUserSchema.parse(req.body);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      throw new NotFoundError('User not found');
    }

    // Check for unique constraints if username/email being updated
    if (data.username || data.email) {
      const conflict = await prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [
                ...(data.username ? [{ username: data.username }] : []),
                ...(data.email ? [{ email: data.email }] : []),
              ],
            },
          ],
        },
      });
      if (conflict) {
        throw new ConflictError('Username or email already in use');
      }
    }

    // Update user
    const user = await prisma.user.update({
      where: { id },
      data: {
        ...data,
        fullName: data.firstName || data.lastName
          ? `${data.firstName || existingUser.firstName} ${data.lastName || existingUser.lastName}`
          : undefined,
      },
      include: { role: true },
    });

    res.json({
      employeeId: user.employeeId,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      phoneNumber: user.phoneNumber || '',
      roles: [{
        name: user.role.name,
        description: user.role.description || '',
        isSystemRole: user.role.isSystemRole,
        id: user.role.id,
        isActive: user.role.isActive,
      }],
      id: user.id,
      isActive: user.isActive,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/users/:id - Delete user (soft delete by setting isActive to false)
router.delete('/:id', requireRole('admin'), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Soft delete
    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({ message: 'User deactivated successfully' });
  } catch (error) {
    next(error);
  }
});

// GET /api/users/:id/customers - Get customers assigned to a user
router.get('/:id/customers', requireRole('admin', 'manager'), async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const { page, limit, sortBy, sortOrder, search, isActive } = userFiltersSchema.parse(req.query);

    const where = { userId };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (typeof isActive === 'boolean') where.isActive = isActive;

    const [customers, totalCount] = await Promise.all([
      prisma.customer.findMany({
        where,
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

export default router;