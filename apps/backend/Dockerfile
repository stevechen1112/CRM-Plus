# Multi-stage build for backend
FROM node:20-bullseye AS base

WORKDIR /app

# Development stage
FROM node:20-bullseye AS development

WORKDIR /app

# Copy root package.json
COPY package*.json ./

# Copy shared package
COPY packages/shared/ ./packages/shared/
RUN cd packages/shared && npm install && npm run build

# Copy backend package.json and install dependencies
COPY apps/backend/package*.json ./apps/backend/
RUN cd apps/backend && npm install

# Copy backend source
COPY apps/backend/ ./apps/backend/

# Generate Prisma client
RUN cd apps/backend && npx prisma generate

WORKDIR /app/apps/backend

EXPOSE 8080

CMD ["npm", "run", "start:local"]

# Production stage
FROM base AS production

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy built shared package
COPY --from=development /app/packages/shared/dist/ ./packages/shared/dist/
COPY --from=development /app/packages/shared/package.json ./packages/shared/

# Copy backend source and build
COPY apps/backend/ ./apps/backend/
RUN cd apps/backend && npm ci && npx prisma generate && npm run build

WORKDIR /app/apps/backend

EXPOSE 8080

CMD ["npm", "run", "start:prod"]