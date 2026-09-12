# Multi-stage Dockerfile for IPTV.menu Background Worker
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root workspace, configs, packages, and apps
COPY package.json package-lock.json tsconfig.json ./
COPY packages ./packages
COPY apps ./apps

# Install dependencies and build
RUN npm ci
RUN npm run build:packages && npm --workspace=iptv-worker run build

# Production runner image
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/worker ./apps/worker
COPY --from=builder /app/node_modules ./node_modules

CMD ["node", "apps/worker/dist/index.js"]
