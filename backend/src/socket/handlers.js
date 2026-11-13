import jwt from "jsonwebtoken";
import { prisma } from "../index.js";

const userSockets = new Map(); // userId -> Set of socketIds
const socketUsers = new Map(); // socketId -> userId
const socketRoles = new Map(); // socketId -> role

export const setupSocketHandlers = (socket, io) => {
	console.log(`Socket connected: ${socket.id}`);

	// Authentication event - client sends token after connection
	socket.on("authenticate", async (token) => {
		try {
			if (!token) {
				socket.emit("auth:error", { message: "No token provided" });
				socket.disconnect();
				return;
			}
			// Verify JWT
			const decoded = jwt.verify(token, process.env.JWT_SECRET);
			// Get user from database
			let user;
			try {
				user = await prisma.user.findUnique({
					where: { id: decoded.userId },
				});
			} catch (error) {
				console.log(error);
			}

			if (!user || !user.isActive) {
				socket.emit("auth:error", {
					message: "User not found or inactive",
				});
				socket.disconnect();
				return;
			}

			// Store user info on socket
			socket.userId = user.id;
			socket.userRole = user.role;
			socket.userName = user.fullName;

			// Track socket mappings
			socketUsers.set(socket.id, user.id);
			socketRoles.set(socket.id, user.role);

			if (!userSockets.has(user.id)) {
				userSockets.set(user.id, new Set());
			}
			userSockets.get(user.id).add(socket.id);

			// Join role-based rooms for broadcasting
			socket.join(`role:${user.role}`);
			socket.join(`user:${user.id}`);

			// Acknowledge authentication
			socket.emit("auth:success", {
				userId: user.id,
				role: user.role,
				message: "Authenticated successfully",
			});

			console.log(
				`User authenticated: ${user.fullName} (${user.role}) - Socket: ${socket.id}`,
			);

			// Send current online users to admins/viewers
			const onlineUsers = await getOnlineUsers();
			socket.emit("users:online", onlineUsers);
		} catch (error) {
			console.error("Socket auth error:", error);
			socket.emit("auth:error", { message: "Authentication failed" });
			socket.disconnect();
		}
	});

	// Handle location updates from mobile app
	// Mobile emits: location:mobile-backend
	// Backend re-emits to frontend: location:backend-frontend
	socket.on("location:mobile-backend", async (data) => {
		try {
			console.log(
				`Received location:mobile-backend from user ${socket.userId}:`,
				{
					latitude: data.latitude,
					longitude: data.longitude,
					accuracy: data.accuracy,
				},
			);

			if (!socket.userId) {
				socket.emit("location:error", { message: "Not authenticated" });
				return;
			}

			const {
				latitude,
				longitude,
				altitude,
				accuracy,
				speed,
				heading,
				customerId,
				metadata,
			} = data;

			// Validate coordinates
			if (typeof latitude !== "number" || typeof longitude !== "number") {
				socket.emit("location:error", {
					message: "Invalid coordinates",
				});
				return;
			}

			if (
				latitude < -90 ||
				latitude > 90 ||
				longitude < -180 ||
				longitude > 180
			) {
				socket.emit("location:error", {
					message: "Coordinates out of range",
				});
				return;
			}

			// NO DATABASE SAVE - Real-time only
			const locationData = {
				userId: socket.userId,
				userName: socket.userName,
				latitude,
				longitude,
				altitude,
				accuracy,
				speed,
				heading,
				timestamp: new Date().toISOString(),
				customerId,
			};

			// Re-emit to frontend with dedicated event name
			console.log(
				`Broadcasting location:backend-frontend for user ${socket.userId}`,
			);
			io.emit("location:backend-frontend", locationData);

			// Acknowledge receipt to mobile
			socket.emit("location:ack", {
				timestamp: locationData.timestamp,
			});
		} catch (error) {
			console.error("Location update error:", error);
			socket.emit("location:error", {
				message: "Failed to process location",
			});
		}
	});

	// Handle batch location updates (for offline sync)
	socket.on("location:batch", async (locations) => {
		try {
			if (!socket.userId) {
				socket.emit("location:error", { message: "Not authenticated" });
				return;
			}

			if (!Array.isArray(locations) || locations.length === 0) {
				socket.emit("location:error", {
					message: "Invalid batch data",
				});
				return;
			}

			// Validate and broadcast latest location (NO DB SAVE)
			const latest = locations[locations.length - 1];
			const {
				latitude,
				longitude,
				altitude,
				accuracy,
				speed,
				heading,
				customerId,
				metadata,
				timestamp,
			} = latest;

			const locationData = {
				userId: socket.userId,
				userName: socket.userName,
				latitude,
				longitude,
				altitude,
				accuracy,
				speed,
				heading,
				timestamp: timestamp
					? new Date(timestamp).toISOString()
					: new Date().toISOString(),
				customerId,
			};

			// Re-emit to frontend
			io.emit("location:backend-frontend", locationData);

			socket.emit("location:batch:ack", {
				count: locations.length,
			});
		} catch (error) {
			console.error("Batch location error:", error);
			socket.emit("location:error", {
				message: "Failed to process batch locations",
			});
		}
	});

	// Join a room (e.g., "tracking" for all location updates)
	socket.on("join:room", (roomName) => {
		if (!socket.userId) return;
		socket.join(roomName);
		console.log(`User ${socket.userId} joined room: ${roomName}`);
	});

	// Subscribe to specific user's location (for frontend map)
	socket.on("subscribe:user", (targetUserId) => {
		if (!socket.userId) return;

		// Only allow admins/viewers to subscribe to other users
		if (
			["admin", "viewer"].includes(socket.userRole) ||
			socket.userId === targetUserId
		) {
			socket.join(`user:${targetUserId}`);
			socket.emit("subscribed:user", { userId: targetUserId });
		}
	});

	// Unsubscribe from user's location
	socket.on("unsubscribe:user", (targetUserId) => {
		socket.leave(`user:${targetUserId}`);
	});

	// Get online users (admin/viewer only)
	socket.on("get:online-users", async () => {
		if (!["admin", "viewer"].includes(socket.userRole)) {
			socket.emit("error", { message: "Not authorized" });
			return;
		}

		const onlineUsers = await getOnlineUsers();
		socket.emit("users:online", onlineUsers);
	});

	// Heartbeat to keep connection alive
	socket.on("ping", () => {
		socket.emit("pong", { timestamp: Date.now() });
	});

	// Handle disconnection
	socket.on("disconnect", (reason) => {
		console.log(`Socket disconnected: ${socket.id}, Reason: ${reason}`);

		const userId = socketUsers.get(socket.id);
		const role = socketRoles.get(socket.id);

		if (userId) {
			const sockets = userSockets.get(userId);
			if (sockets) {
				sockets.delete(socket.id);
				if (sockets.size === 0) {
					userSockets.delete(userId);
				}
			}
		}

		socketUsers.delete(socket.id);
		socketRoles.delete(socket.id);
	});
};

// Helper to get online users with their latest location (IN-MEMORY ONLY)
async function getOnlineUsers() {
	const onlineUserIds = Array.from(userSockets.keys());
	console.log(onlineUserIds);
	if (onlineUserIds.length === 0) return [];

	const users = await prisma.user.findMany({
		where: { id: { in: onlineUserIds }, isActive: true },
		select: {
			id: true,
			fullName: true,
			username: true,
			role: true,
		},
	});

	// NO location history query - Real-time only
	// Location data will be received via real-time events
	return users.map((user) => ({
		...user,
		location: null, // Will be received via real-time events
		isOnline: true,
	}));
}

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