# Multi-stage Dockerfile for IPTV.menu Background Worker
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root workspace and lockfiles
COPY package.json package-lock.json ./
COPY packages ./packages
COPY apps/worker ./apps/worker

# Install dependencies and build
RUN npm install
RUN npm --workspace=@iptv-menu/worker run build

# Production runner image
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/worker/package.json ./apps/worker/
COPY --from=builder /app/apps/worker/dist ./apps/worker/dist
COPY --from=builder /app/node_modules ./node_modules

CMD ["node", "apps/worker/dist/index.js"]
