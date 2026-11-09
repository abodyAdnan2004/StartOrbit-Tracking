import express from 'express';
import { prisma } from '../index.js';
import { io } from '../index.js';
import { createLocationSchema, locationQuerySchema } from '../utils/validation.js';
import { requireRole } from '../middleware/auth.js';
import { NotFoundError, ForbiddenError } from '../middleware/errorHandler.js';

const router = express.Router();

// POST /api/locations - Ingest location from mobile app (batch support)
router.post('/', async (req, res, next) => {
  try {
    // Support both single location and batch of locations
    const locations = Array.isArray(req.body) ? req.body : [req.body];

    if (locations.length === 0) {
      return res.status(400).json({ error: 'No locations provided' });
    }

    // Validate each location
    const validatedLocations = locations.map(loc => createLocationSchema.parse(loc));

    // Create locations in database
    const createdLocations = await Promise.all(
      validatedLocations.map(loc =>
        prisma.location.create({
          data: {
            userId: req.user.id,
            ...loc,
          },
        })
      )
    );

    // Broadcast to relevant frontend clients via Socket.io
    // Only broadcast the latest location per user for real-time map
    const latestLocation = createdLocations[createdLocations.length - 1];
    io.to(`user:${req.user.id}`).emit('location:update', {
      userId: req.user.id,
      userName: req.user.fullName,
      latitude: latestLocation.latitude,
      longitude: latestLocation.longitude,
      accuracy: latestLocation.accuracy,
      speed: latestLocation.speed,
      heading: latestLocation.heading,
      timestamp: latestLocation.timestamp,
      customerId: latestLocation.customerId,
    });

    // Also broadcast to admin/manager rooms for dashboard
    io.to('role:admin').emit('location:update', {
      userId: req.user.id,
      userName: req.user.fullName,
      latitude: latestLocation.latitude,
      longitude: latestLocation.longitude,
      accuracy: latestLocation.accuracy,
      speed: latestLocation.speed,
      heading: latestLocation.heading,
      timestamp: latestLocation.timestamp,
      customerId: latestLocation.customerId,
    });
    io.to('role:manager').emit('location:update', {
      userId: req.user.id,
      userName: req.user.fullName,
      latitude: latestLocation.latitude,
      longitude: latestLocation.longitude,
      accuracy: latestLocation.accuracy,
      speed: latestLocation.speed,
      heading: latestLocation.heading,
      timestamp: latestLocation.timestamp,
      customerId: latestLocation.customerId,
    });

    res.status(201).json({
      message: 'Locations recorded successfully',
      count: createdLocations.length,
      locations: createdLocations,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/locations - Get location history with filters
router.get('/', async (req, res, next) => {
  try {
    const { userId, customerId, startDate, endDate, page, limit } = locationQuerySchema.parse(req.query);

    const where = {};

    // If user is not admin/manager, they can only see their own locations
    if (!['admin', 'manager'].includes(req.user.role)) {
      where.userId = req.user.id;
    } else if (userId) {
      where.userId = userId;
    }

    if (customerId) where.customerId = customerId;

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate);
      if (endDate) where.timestamp.lte = new Date(endDate);
    }

    const [locations, totalCount] = await Promise.all([
      prisma.location.findMany({
        where,
        include: {
          user: { select: { id: true, fullName: true, username: true } },
          customer: { select: { id: true, name: true } },
        },
        orderBy: { timestamp: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.location.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      items: locations,
      pagesCount: totalPages,
      currentPage: page,
      type: 'LocationDto',
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

// GET /api/locations/latest - Get latest location for each user (for real-time map)
router.get('/latest', requireRole('admin', 'manager'), async (req, res, next) => {
  try {
    // Get latest location per user using a subquery
    const latestLocations = await prisma.$queryRaw`
      SELECT DISTINCT ON (l."userId")
        l.id, l."userId", l."customerId", l.latitude, l.longitude,
        l.altitude, l.accuracy, l.speed, l.heading, l.timestamp, l.metadata,
        u."fullName", u.username
      FROM "locations" l
      JOIN "users" u ON u.id = l."userId"
      WHERE u."isActive" = true
      ORDER BY l."userId", l.timestamp DESC
    `;

    res.json({
      items: latestLocations,
      pagesCount: 1,
      currentPage: 1,
      type: 'LocationDto',
      totalItems: latestLocations.length,
      calculatedTotalPages: 1,
      currentPageSize: latestLocations.length,
      totalCount: latestLocations.length,
      totalPages: 1,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/locations/user/:userId - Get locations for specific user
router.get('/user/:userId', async (req, res, next) => {
  try {
    const targetUserId = parseInt(req.params.userId);
    if (isNaN(targetUserId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Check authorization
    if (!['admin', 'manager'].includes(req.user.role) && targetUserId !== req.user.id) {
      throw new ForbiddenError('Not authorized to view this user\'s locations');
    }

    const { startDate, endDate, page, limit } = locationQuerySchema.parse(req.query);

    const where = { userId: targetUserId };
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate);
      if (endDate) where.timestamp.lte = new Date(endDate);
    }

    const [locations, totalCount] = await Promise.all([
      prisma.location.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true } },
        },
        orderBy: { timestamp: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.location.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      items: locations,
      pagesCount: totalPages,
      currentPage: page,
      type: 'LocationDto',
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

// GET /api/locations/stats/distance/:userId - Calculate distance walked for a user
router.get('/stats/distance/:userId', async (req, res, next) => {
  try {
    const targetUserId = parseInt(req.params.userId);
    if (isNaN(targetUserId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Check authorization
    if (!['admin', 'manager'].includes(req.user.role) && targetUserId !== req.user.id) {
      throw new ForbiddenError('Not authorized');
    }

    const { startDate, endDate } = req.query;

    const where = { userId: targetUserId };
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate);
      if (endDate) where.timestamp.lte = new Date(endDate);
    }

    // Get locations ordered by time
    const locations = await prisma.location.findMany({
      where,
      orderBy: { timestamp: 'asc' },
      select: { latitude: true, longitude: true, timestamp: true },
    });

    // Calculate total distance using Haversine formula
    let totalDistance = 0; // in meters
    for (let i = 1; i < locations.length; i++) {
      totalDistance += calculateDistance(
        locations[i - 1].latitude,
        locations[i - 1].longitude,
        locations[i].latitude,
        locations[i].longitude
      );
    }

    // Estimate steps (average step length ~0.75m)
    const estimatedSteps = Math.round(totalDistance / 0.75);

    res.json({
      userId: targetUserId,
      totalDistanceMeters: Math.round(totalDistance),
      totalDistanceKm: (totalDistance / 1000).toFixed(2),
      estimatedSteps,
      locationCount: locations.length,
      period: {
        start: startDate || locations[0]?.timestamp,
        end: endDate || locations[locations.length - 1]?.timestamp,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Haversine formula to calculate distance between two coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export default router;