# Multi-stage build for frontend
FROM node:18-alpine AS base

WORKDIR /app

# Development stage
FROM node:18-alpine AS development

WORKDIR /app

# Copy root package.json
COPY package*.json ./

# Copy shared package
COPY packages/shared/ ./packages/shared/
RUN cd packages/shared && npm install && npm run build

# Copy frontend package.json and install dependencies
COPY apps/frontend/package*.json ./apps/frontend/
RUN cd apps/frontend && npm install

# Copy frontend source
COPY apps/frontend/ ./apps/frontend/

WORKDIR /app/apps/frontend

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# Production stage
FROM base AS production

WORKDIR /app

# Copy built shared package
COPY --from=development /app/packages/shared/dist/ ./packages/shared/dist/
COPY --from=development /app/packages/shared/package.json ./packages/shared/

# Copy frontend source and build
COPY apps/frontend/ ./apps/frontend/
RUN cd apps/frontend && npm install && npm run build

WORKDIR /app/apps/frontend

EXPOSE 3000

# Install serve to serve the built app
RUN npm install -g serve

CMD ["serve", "-s", "dist", "-l", "3000"]