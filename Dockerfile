# Stage 1: Build the application
FROM node:22-alpine AS builder
WORKDIR /app

# Copy package files for the api
COPY api/package*.json ./api/

# Install dependencies in api
WORKDIR /app/api
RUN npm ci

# Copy the rest of the backend and shared folders
WORKDIR /app
COPY shared ./shared
COPY api ./api

# Build the api
WORKDIR /app/api
RUN npm run build

# Stage 2: Serve the application in production
FROM node:22-alpine
WORKDIR /app
COPY api/package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/api/dist ./dist
EXPOSE 3001
WORKDIR /app/dist/api/src
CMD ["node", "index.js"]
