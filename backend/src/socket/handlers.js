import jwt from 'jsonwebtoken';
import { prisma } from '../index.js';

const userSockets = new Map(); // userId -> Set of socketIds
const socketUsers = new Map(); // socketId -> userId
const socketRoles = new Map(); // socketId -> role

export const setupSocketHandlers = (socket, io) => {
  console.log(`Socket connected: ${socket.id}`);

  // Authentication event - client sends token after connection
  socket.on('authenticate', async (token) => {
    try {
      if (!token) {
        socket.emit('auth:error', { message: 'No token provided' });
        socket.disconnect();
        return;
      }

      // Verify JWT
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from database
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: { role: true },
      });

      if (!user || !user.isActive) {
        socket.emit('auth:error', { message: 'User not found or inactive' });
        socket.disconnect();
        return;
      }

      // Store user info on socket
      socket.userId = user.id;
      socket.userRole = user.role.name;
      socket.userName = user.fullName;

      // Track socket mappings
      socketUsers.set(socket.id, user.id);
      socketRoles.set(socket.id, user.role.name);

      if (!userSockets.has(user.id)) {
        userSockets.set(user.id, new Set());
      }
      userSockets.get(user.id).add(socket.id);

      // Join role-based rooms for broadcasting
      socket.join(`role:${user.role.name}`);
      socket.join(`user:${user.id}`);

      // Acknowledge authentication
      socket.emit('auth:success', {
        userId: user.id,
        role: user.role.name,
        message: 'Authenticated successfully',
      });

      console.log(`User authenticated: ${user.fullName} (${user.role.name}) - Socket: ${socket.id}`);

      // Send current online users to admins/managers
      if (['admin', 'manager'].includes(user.role.name)) {
        const onlineUsers = await getOnlineUsers();
        socket.emit('users:online', onlineUsers);
      }
    } catch (error) {
      console.error('Socket auth error:', error);
      socket.emit('auth:error', { message: 'Authentication failed' });
      socket.disconnect();
    }
  });

  // Handle location updates from mobile app (alternative to REST API)
  socket.on('location:update', async (data) => {
    try {
      if (!socket.userId) {
        socket.emit('location:error', { message: 'Not authenticated' });
        return;
      }

      const { latitude, longitude, altitude, accuracy, speed, heading, customerId, metadata } = data;

      // Validate coordinates
      if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        socket.emit('location:error', { message: 'Invalid coordinates' });
        return;
      }

      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        socket.emit('location:error', { message: 'Coordinates out of range' });
        return;
      }

      // Save to database
      const location = await prisma.location.create({
        data: {
          userId: socket.userId,
          latitude,
          longitude,
          altitude,
          accuracy,
          speed,
          heading,
          customerId,
          metadata,
        },
      });

      // Broadcast to relevant rooms
      const locationData = {
        userId: socket.userId,
        userName: socket.userName,
        latitude,
        longitude,
        altitude,
        accuracy,
        speed,
        heading,
        timestamp: location.timestamp,
        customerId,
      };

      // Broadcast to user's own room (for multi-device sync)
      io.to(`user:${socket.userId}`).emit('location:update', locationData);

      // Broadcast to admin/manager rooms
      io.to('role:admin').emit('location:update', locationData);
      io.to('role:manager').emit('location:update', locationData);

      // Acknowledge receipt
      socket.emit('location:ack', { id: location.id, timestamp: location.timestamp });
    } catch (error) {
      console.error('Location update error:', error);
      socket.emit('location:error', { message: 'Failed to save location' });
    }
  });

  // Handle batch location updates (for offline sync)
  socket.on('location:batch', async (locations) => {
    try {
      if (!socket.userId) {
        socket.emit('location:error', { message: 'Not authenticated' });
        return;
      }

      if (!Array.isArray(locations) || locations.length === 0) {
        socket.emit('location:error', { message: 'Invalid batch data' });
        return;
      }

      // Validate and save all locations
      const createdLocations = await Promise.all(
        locations.map(loc => {
          const { latitude, longitude, altitude, accuracy, speed, heading, customerId, metadata, timestamp } = loc;
          return prisma.location.create({
            data: {
              userId: socket.userId,
              latitude,
              longitude,
              altitude,
              accuracy,
              speed,
              heading,
              customerId,
              metadata,
              timestamp: timestamp ? new Date(timestamp) : new Date(),
            },
          });
        })
      );

      // Broadcast latest location
      const latest = createdLocations[createdLocations.length - 1];
      const locationData = {
        userId: socket.userId,
        userName: socket.userName,
        latitude: latest.latitude,
        longitude: latest.longitude,
        altitude: latest.altitude,
        accuracy: latest.accuracy,
        speed: latest.speed,
        heading: latest.heading,
        timestamp: latest.timestamp,
        customerId: latest.customerId,
      };

      io.to(`user:${socket.userId}`).emit('location:update', locationData);
      io.to('role:admin').emit('location:update', locationData);
      io.to('role:manager').emit('location:update', locationData);

      socket.emit('location:batch:ack', {
        count: createdLocations.length,
        ids: createdLocations.map(l => l.id),
      });
    } catch (error) {
      console.error('Batch location error:', error);
      socket.emit('location:error', { message: 'Failed to save batch locations' });
    }
  });

  // Subscribe to specific user's location (for frontend map)
  socket.on('subscribe:user', (targetUserId) => {
    if (!socket.userId) return;

    // Only allow admins/managers to subscribe to other users
    if (['admin', 'manager'].includes(socket.userRole) || socket.userId === targetUserId) {
      socket.join(`user:${targetUserId}`);
      socket.emit('subscribed:user', { userId: targetUserId });
    }
  });

  // Unsubscribe from user's location
  socket.on('unsubscribe:user', (targetUserId) => {
    socket.leave(`user:${targetUserId}`);
  });

  // Get online users (admin/manager only)
  socket.on('get:online-users', async () => {
    if (!['admin', 'manager'].includes(socket.userRole)) {
      socket.emit('error', { message: 'Not authorized' });
      return;
    }

    const onlineUsers = await getOnlineUsers();
    socket.emit('users:online', onlineUsers);
  });

  // Heartbeat to keep connection alive
  socket.on('ping', () => {
    socket.emit('pong', { timestamp: Date.now() });
  });

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    console.log(`Socket disconnected: ${socket.id}, Reason: ${reason}`);

    const userId = socketUsers.get(socket.id);
    const role = socketRoles.get(socket.id);

    if (userId) {
      const sockets = userSockets.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          userSockets.delete(userId);
          // Notify admins/managers user went offline
          io.to('role:admin').emit('user:offline', { userId });
          io.to('role:manager').emit('user:offline', { userId });
        }
      }
    }

    socketUsers.delete(socket.id);
    socketRoles.delete(socket.id);
  });
};

// Helper to get online users with their latest location
async function getOnlineUsers() {
  const onlineUserIds = Array.from(userSockets.keys());

  if (onlineUserIds.length === 0) return [];

  const users = await prisma.user.findMany({
    where: { id: { in: onlineUserIds }, isActive: true },
    include: { role: true },
    select: {
      id: true,
      fullName: true,
      username: true,
      role: { select: { name: true } },
    },
  });

  // Get latest location for each online user
  const latestLocations = await prisma.$queryRaw`
    SELECT DISTINCT ON (l."userId")
      l."userId", l.latitude, l.longitude, l.timestamp, l.accuracy
    FROM "locations" l
    WHERE l."userId" IN (${Prisma.join(onlineUserIds)})
    ORDER BY l."userId", l.timestamp DESC
  `;

  const locationMap = new Map();
  latestLocations.forEach(loc => {
    locationMap.set(loc.userId, {
      latitude: loc.latitude,
      longitude: loc.longitude,
      timestamp: loc.timestamp,
      accuracy: loc.accuracy,
    });
  });

  return users.map(user => ({
    ...user,
    location: locationMap.get(user.id) || null,
    isOnline: true,
  }));
}

// Need to import Prisma for the join helper
import { Prisma } from '@prisma/client';

// Export helper functions for use in routes
export const broadcastToUser = (io, userId, event, data) => {
  io.to(`user:${userId}`).emit(event, data);
};

export const broadcastToRole = (io, role, event, data) => {
  io.to(`role:${role}`).emit(event, data);
};

export const broadcastToAll = (io, event, data) => {
  io.emit(event, data);
};

export const getOnlineUserIds = () => {
  return Array.from(userSockets.keys());
};

export const isUserOnline = (userId) => {
  return userSockets.has(userId);
};