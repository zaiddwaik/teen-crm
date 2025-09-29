# Use official Node.js LTS image as base
FROM node:18-alpine AS base

# Set working directory
WORKDIR /app

# Install system dependencies for Prisma and native modules
RUN apk add --no-cache \
    openssl \
    libc6-compat \
    && rm -rf /var/cache/apk/*

# Install dependencies stage
FROM base AS deps

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production --ignore-scripts

# Generate Prisma client
RUN npx prisma generate

# Build stage
FROM base AS builder

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./
COPY prisma ./prisma/

# Install all dependencies (including dev dependencies)
RUN npm ci --ignore-scripts

# Copy source code
COPY src ./src

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Production stage
FROM base AS production

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Copy package.json for npm start
COPY package*.json ./

# Copy Prisma files
COPY prisma ./prisma/

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Create uploads directory and set permissions
RUN mkdir -p uploads && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Generate Prisma client for production
RUN npx prisma generate

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "http.get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" \
  || exit 1

# Start the application
CMD ["npm", "start"]