# Dockerfile for Orbit Tracking Backend
# Multi-stage build for production optimization

# Base stage - install dependencies
FROM node:20-alpine AS base
WORKDIR /app
ENV NODE_ENV=production

# Install dependencies only when needed
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Development stage
FROM base AS dev
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# Build stage
FROM base AS builder
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run prisma:generate

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Copy built application
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src ./src

# Generate Prisma client
RUN npx prisma generate

# Change ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 3000

ENV PORT=3000

CMD ["node", "src/index.js"]