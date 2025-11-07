# Stage 1: Build cclogviewer binary
FROM golang:1.23-alpine AS cclogviewer-builder

RUN apk add --no-cache git ca-certificates

RUN CGO_ENABLED=0 GOOS=linux go install -ldflags="-w -s" github.com/brads3290/cclogviewer/cmd/cclogviewer@latest

# Stage 2: Build Node.js application
FROM node:20-alpine AS node-builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY src/ ./src/

# Build TypeScript
RUN npm run build

# Stage 3: Production runtime
FROM node:20-alpine

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy package files and install production dependencies only
COPY --chown=nodejs:nodejs package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy built application
COPY --from=node-builder --chown=nodejs:nodejs /app/dist ./dist

# Copy public files
COPY --chown=nodejs:nodejs public/ ./public/

# Copy cclogviewer binary
COPY --from=cclogviewer-builder /go/bin/cclogviewer /app/bin/cclogviewer
RUN chmod +x /app/bin/cclogviewer && \
    chown nodejs:nodejs /app/bin/cclogviewer

# Create storage directory
RUN mkdir -p /app/storage && \
    chown -R nodejs:nodejs /app/storage

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 8721

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8721/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "dist/index.js"]
