import express from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../index.js';
import { generateTokens, saveRefreshToken, revokeAllUserRefreshTokens, isRefreshTokenValid, revokeRefreshToken } from '../utils/jwt.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { loginSchema, registerSchema, changePasswordSchema } from '../utils/validation.js';
import { ValidationError, UnauthorizedError, ConflictError } from '../middleware/errorHandler.js';

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);

    // Find user by username or email
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: data.loginIdentifier },
          { email: data.loginIdentifier },
        ],
        isActive: true,
      },
      include: { role: true },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Verify password
    const isValid = await verifyPassword(data.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens({
      id: user.id,
      username: user.username,
      role: user.role.name,
    });

    // Save refresh token
    await saveRefreshToken(user.id, refreshToken);

    // If rememberMe, extend refresh token expiry (handled by frontend)
    if (data.rememberMe) {
      // Frontend should store refresh token securely
    }

    // Return user data matching frontend AuthResponse format
    const tokenData = {
      accessToken,
      refreshToken,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
      tokenType: 'Bearer',
      expiresInSeconds: 15 * 60,
    };

    res.json({
      isSuccess: true,
      message: 'Login successful',
      errorCode: null,
      user: {
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
      },
      token: tokenData,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/register (admin only - for creating initial users)
router.post('/register', async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);

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

    // Get default role if not provided
    let roleId = data.roleId;
    if (!roleId) {
      const defaultRole = await prisma.role.findFirst({
        where: { name: 'user' },
      });
      if (!defaultRole) {
        throw new Error('Default role not found. Please run seed first.');
      }
      roleId = defaultRole.id;
    }

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
        roleId,
      },
      include: { role: true },
    });

    res.status(201).json({
      isSuccess: true,
      message: 'User created successfully',
      errorCode: null,
      user: {
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
      },
      token: null, // No auto-login on register
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/me
router.get('/me', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { role: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedError('User not found or inactive');
    }

    res.json({
      data: {
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
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new UnauthorizedError('Refresh token required');
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Check if token exists in database and is valid
    const isValid = await isRefreshTokenValid(refreshToken);
    if (!isValid) {
      throw new UnauthorizedError('Invalid or revoked refresh token');
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { role: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedError('User not found or inactive');
    }

    // Revoke old refresh token
    await revokeRefreshToken(refreshToken);

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens({
      id: user.id,
      username: user.username,
      role: user.role.name,
    });

    // Save new refresh token
    await saveRefreshToken(user.id, newRefreshToken);

    const tokenData = {
      accessToken,
      refreshToken: newRefreshToken,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      tokenType: 'Bearer',
      expiresInSeconds: 15 * 60,
    };

    res.json({
      isSuccess: true,
      message: 'Token refreshed',
      errorCode: null,
      user: {
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
      },
      token: tokenData,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/logout
router.post('/logout', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    }

    res.json({
      isSuccess: true,
      message: 'Logged out successfully',
      errorCode: null,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/change-password
router.post('/change-password', async (req, res, next) => {
  try {
    const data = changePasswordSchema.parse(req.body);
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    // Verify current password
    const isValid = await verifyPassword(data.currentPassword, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    // Hash new password
    const newPasswordHash = await hashPassword(data.newPassword);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash },
    });

    // Revoke all refresh tokens (force re-login on other devices)
    await revokeAllUserRefreshTokens(user.id);

    res.json({
      isSuccess: true,
      message: 'Password changed successfully. Please log in again.',
      errorCode: null,
    });
  } catch (error) {
    next(error);
  }
});

export default router;