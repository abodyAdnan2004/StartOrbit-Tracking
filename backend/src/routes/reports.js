import express from 'express';
import { prisma } from '../index.js';
import { requireRole } from '../middleware/auth.js';
import { NotFoundError } from '../middleware/errorHandler.js';

const router = express.Router();

// All report routes require admin or manager role
router.use(requireRole('admin', 'manager'));

// GET /api/reports/dashboard - Main dashboard summary
router.get('/dashboard', async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.timestamp = {};
      if (startDate) dateFilter.timestamp.gte = new Date(startDate);
      if (endDate) dateFilter.timestamp.lte = new Date(endDate);
    }

    // Parallel queries for dashboard
    const [
      totalUsers,
      activeUsers,
      totalCustomers,
      activeCustomers,
      totalLocations,
      usersWithLocations,
      recentLogins,
      topCustomersAdded,
      topStepsWalked,
      topActiveUsers,
    ] = await Promise.all([
      // Total users
      prisma.user.count({ where: { isActive: true } }),

      // Active users (users with locations in period)
      prisma.user.count({
        where: {
          isActive: true,
          locations: dateFilter.timestamp ? { some: dateFilter } : { some: {} },
        },
      }),

      // Total customers
      prisma.customer.count({ where: { isActive: true } }),

      // Active customers (customers with locations in period)
      prisma.customer.count({
        where: {
          isActive: true,
          locations: dateFilter.timestamp ? { some: dateFilter } : { some: {} },
        },
      }),

      // Total location points
      prisma.location.count({ where: dateFilter }),

      // Users who have sent locations
      prisma.user.count({
        where: {
          isActive: true,
          locations: { some: dateFilter },
        },
      }),

      // Recent logins (last 24 hours or specified period)
      prisma.user.findMany({
        where: {
          isActive: true,
          updatedAt: dateFilter.timestamp ? dateFilter : { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
        select: { id: true, fullName: true, username: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
        take: 10,
      }),

      // Top users by customers added
      getTopCustomersAdded(dateFilter),

      // Top users by steps walked
      getTopStepsWalked(dateFilter),

      // Top active users (by location updates + login frequency)
      getTopActiveUsers(dateFilter),
    ]);

    res.json({
      summary: {
        totalUsers,
        activeUsers,
        totalCustomers,
        activeCustomers,
        totalLocations,
        usersWithLocations,
        period: { startDate, endDate },
      },
      recentActivity: recentLogins,
      leaderboards: {
        topCustomersAdded,
        topStepsWalked,
        topActiveUsers,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/reports/customers-added - Users ranked by customers created
router.get('/customers-added', async (req, res, next) => {
  try {
    const { startDate, endDate, limit = 10 } = req.query;

    const dateFilter = buildDateFilter(startDate, endDate);

    const results = await getTopCustomersAdded(dateFilter, parseInt(limit));

    res.json({ items: results });
  } catch (error) {
    next(error);
  }
});

// GET /api/reports/steps-walked - Users ranked by distance/steps
router.get('/steps-walked', async (req, res, next) => {
  try {
    const { startDate, endDate, limit = 10 } = req.query;

    const dateFilter = buildDateFilter(startDate, endDate);

    const results = await getTopStepsWalked(dateFilter, parseInt(limit));

    res.json({ items: results });
  } catch (error) {
    next(error);
  }
});

// GET /api/reports/active-users - Users ranked by activity
router.get('/active-users', async (req, res, next) => {
  try {
    const { startDate, endDate, limit = 10 } = req.query;

    const dateFilter = buildDateFilter(startDate, endDate);

    const results = await getTopActiveUsers(dateFilter, parseInt(limit));

    res.json({ items: results });
  } catch (error) {
    next(error);
  }
});

// GET /api/reports/activation-tracking - User login/activation tracking
router.get('/activation-tracking', async (req, res, next) => {
  try {
    const { startDate, endDate, userId, page = 1, limit = 50 } = req.query;

    const dateFilter = buildDateFilter(startDate, endDate);

    const where = { isActive: true };
    if (userId) where.id = parseInt(userId);

    // Get users with their login/activation data
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        username: true,
        email: true,
        role: { select: { name: true } },
        createdAt: true,
        updatedAt: true,
        locations: {
          where: dateFilter,
          select: { timestamp: true },
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
        _count: {
          select: {
            locations: { where: dateFilter },
            customers: { where: { isActive: true } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
    });

    // Calculate activation metrics for each user
    const activationData = users.map(user => {
      const lastLocation = user.locations[0] || null;
      const locationCount = user._count.locations;
      const customerCount = user._count.customers;

      // Determine activity status
      let status = 'inactive';
      if (lastLocation) {
        const hoursSinceLocation = (Date.now() - new Date(lastLocation.timestamp).getTime()) / (1000 * 60 * 60);
        if (hoursSinceLocation < 1) status = 'active';
        else if (hoursSinceLocation < 24) status = 'recent';
        else status = 'idle';
      }

      return {
        userId: user.id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        role: user.role.name,
        createdAt: user.createdAt,
        lastActiveAt: user.updatedAt,
        lastLocationAt: lastLocation?.timestamp || null,
        lastLocation: lastLocation ? { latitude: lastLocation.latitude, longitude: lastLocation.longitude } : null,
        locationCount,
        customerCount,
        status,
      };
    });

    const totalCount = await prisma.user.count({ where });

    res.json({
      items: activationData,
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
router.get('/user/:userId/activity', async (req, res, next) => {
  try {
    const userId = parseInt(req.params.userId);
    const { startDate, endDate } = req.query;

    const dateFilter = buildDateFilter(startDate, endDate);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Get locations in period
    const locations = await prisma.location.findMany({
      where: { userId, ...dateFilter },
      orderBy: { timestamp: 'asc' },
      include: { customer: { select: { id: true, name: true } } },
    });

    // Get customers created in period
    const customersCreated = await prisma.customer.findMany({
      where: { userId, createdAt: dateFilter.timestamp ? dateFilter : undefined },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate daily activity
    const dailyActivity = calculateDailyActivity(locations);

    // Calculate distance/steps
    let totalDistance = 0;
    for (let i = 1; i < locations.length; i++) {
      totalDistance += calculateDistance(
        locations[i - 1].latitude,
        locations[i - 1].longitude,
        locations[i].latitude,
        locations[i].longitude
      );
    }

    res.json({
      user: {
        id: user.id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        role: user.role.name,
      },
      period: { startDate, endDate },
      summary: {
        totalLocations: locations.length,
        totalDistanceMeters: Math.round(totalDistance),
        totalDistanceKm: (totalDistance / 1000).toFixed(2),
        estimatedSteps: Math.round(totalDistance / 0.75),
        customersCreated: customersCreated.length,
        activeDays: dailyActivity.filter(d => d.locationCount > 0).length,
      },
      dailyActivity,
      recentLocations: locations.slice(-20).reverse(),
      customersCreated: customersCreated.map(c => ({
        id: c.id,
        name: c.name,
        createdAt: c.createdAt,
      })),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/reports/heatmap - Location heatmap data
router.get('/heatmap', async (req, res, next) => {
  try {
    const { startDate, endDate, userId, bounds } = req.query;

    const dateFilter = buildDateFilter(startDate, endDate);
    const where = { ...dateFilter };

    if (userId) where.userId = parseInt(userId);
    if (bounds) {
      const [minLat, minLng, maxLat, maxLng] = bounds.split(',').map(Number);
      where.latitude = { gte: minLat, lte: maxLat };
      where.longitude = { gte: minLng, lte: maxLng };
    }

    const locations = await prisma.location.findMany({
      where,
      select: { latitude: true, longitude: true, timestamp: true, userId: true },
      take: 10000, // Limit for performance
    });

    // Aggregate into grid for heatmap
    const gridSize = 0.001; // ~100m grid
    const grid = new Map();

    locations.forEach(loc => {
      const latGrid = Math.floor(loc.latitude / gridSize) * gridSize;
      const lngGrid = Math.floor(loc.longitude / gridSize) * gridSize;
      const key = `${latGrid},${lngGrid}`;

      if (!grid.has(key)) {
        grid.set(key, { latitude: latGrid, longitude: lngGrid, count: 0, users: new Set() });
      }
      const cell = grid.get(key);
      cell.count++;
      cell.users.add(loc.userId);
    });

    const heatmapData = Array.from(grid.values()).map(cell => ({
      latitude: cell.latitude,
      longitude: cell.longitude,
      intensity: cell.count,
      uniqueUsers: cell.users.size,
    }));

    res.json({ items: heatmapData });
  } catch (error) {
    next(error);
  }
});

// Helper functions

function buildDateFilter(startDate, endDate) {
  const filter = {};
  if (startDate || endDate) {
    filter.timestamp = {};
    if (startDate) filter.timestamp.gte = new Date(startDate);
    if (endDate) filter.timestamp.lte = new Date(endDate);
  }
  return filter;
}

async function getTopCustomersAdded(dateFilter, limit = 10) {
  const users = await prisma.user.findMany({
    where: { isActive: true },
    include: {
      role: true,
      _count: {
        select: {
          customers: {
            where: dateFilter.timestamp ? { createdAt: dateFilter } : { isActive: true },
          },
        },
      },
    },
    orderBy: { customers: { _count: 'desc' } },
    take: limit,
  });

  return users.map(u => ({
    userId: u.id,
    fullName: u.fullName,
    username: u.username,
    role: u.role.name,
    customersAdded: u._count.customers,
  }));
}

async function getTopStepsWalked(dateFilter, limit = 10) {
  const users = await prisma.user.findMany({
    where: { isActive: true, locations: { some: dateFilter } },
    select: {
      id: true,
      fullName: true,
      username: true,
      role: { select: { name: true } },
      locations: {
        where: dateFilter,
        orderBy: { timestamp: 'asc' },
        select: { latitude: true, longitude: true },
      },
    },
  });

  const userDistances = users.map(user => {
    let distance = 0;
    const locs = user.locations;
    for (let i = 1; i < locs.length; i++) {
      distance += calculateDistance(
        locs[i - 1].latitude, locs[i - 1].longitude,
        locs[i].latitude, locs[i].longitude
      );
    }
    return {
      userId: user.id,
      fullName: user.fullName,
      username: user.username,
      role: user.role.name,
      distanceMeters: Math.round(distance),
      distanceKm: (distance / 1000).toFixed(2),
      estimatedSteps: Math.round(distance / 0.75),
      locationCount: locs.length,
    };
  });

  return userDistances
    .sort((a, b) => b.distanceMeters - a.distanceMeters)
    .slice(0, limit);
}

async function getTopActiveUsers(dateFilter, limit = 10) {
  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: {
      id: true,
      fullName: true,
      username: true,
      role: { select: { name: true } },
      updatedAt: true,
      locations: {
        where: dateFilter,
        select: { timestamp: true },
      },
      _count: {
        select: { locations: { where: dateFilter } },
      },
    },
  });

  const now = Date.now();
  const userActivity = users.map(user => {
    const locationCount = user._count.locations;
    const lastLocation = user.locations[0];
    const hoursSinceLastLocation = lastLocation
      ? (now - new Date(lastLocation.timestamp).getTime()) / (1000 * 60 * 60)
      : Infinity;

    // Activity score: location count * recency factor
    const recencyFactor = hoursSinceLastLocation < 24 ? 1.5 : hoursSinceLastLocation < 168 ? 1 : 0.5;
    const activityScore = locationCount * recencyFactor;

    return {
      userId: user.id,
      fullName: user.fullName,
      username: user.username,
      role: user.role.name,
      locationCount,
      lastActiveAt: user.updatedAt,
      lastLocationAt: lastLocation?.timestamp || null,
      hoursSinceLastLocation: Math.round(hoursSinceLastLocation * 10) / 10,
      activityScore: Math.round(activityScore * 10) / 10,
    };
  });

  return userActivity
    .sort((a, b) => b.activityScore - a.activityScore)
    .slice(0, limit);
}

function calculateDailyActivity(locations) {
  const dailyMap = new Map();

  locations.forEach(loc => {
    const date = new Date(loc.timestamp).toISOString().split('T')[0];
    if (!dailyMap.has(date)) {
      dailyMap.set(date, { date, locationCount: 0, distance: 0, customers: new Set() });
    }
    const day = dailyMap.get(date);
    day.locationCount++;
    if (loc.customerId) day.customers.add(loc.customerId);
  });

  // Calculate distance per day
  const sortedLocations = [...locations].sort((a, b) =>
    new Date(a.timestamp) - new Date(b.timestamp)
  );

  let currentDay = null;
  let dayLocations = [];

  sortedLocations.forEach(loc => {
    const date = new Date(loc.timestamp).toISOString().split('T')[0];
    if (date !== currentDay) {
      if (dayLocations.length > 1) {
        let dist = 0;
        for (let i = 1; i < dayLocations.length; i++) {
          dist += calculateDistance(
            dayLocations[i - 1].latitude, dayLocations[i - 1].longitude,
            dayLocations[i].latitude, dayLocations[i].longitude
          );
        }
        if (dailyMap.has(currentDay)) {
          dailyMap.get(currentDay).distance = Math.round(dist);
        }
      }
      currentDay = date;
      dayLocations = [loc];
    } else {
      dayLocations.push(loc);
    }
  });

  // Handle last day
  if (dayLocations.length > 1 && currentDay) {
    let dist = 0;
    for (let i = 1; i < dayLocations.length; i++) {
      dist += calculateDistance(
        dayLocations[i - 1].latitude, dayLocations[i - 1].longitude,
        dayLocations[i].latitude, dayLocations[i].longitude
      );
    }
    if (dailyMap.has(currentDay)) {
      dailyMap.get(currentDay).distance = Math.round(dist);
    }
  }

  return Array.from(dailyMap.values())
    .map(d => ({
      date: d.date,
      locationCount: d.locationCount,
      distanceMeters: d.distance || 0,
      distanceKm: ((d.distance || 0) / 1000).toFixed(2),
      estimatedSteps: Math.round((d.distance || 0) / 0.75),
      uniqueCustomers: d.customers.size,
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
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