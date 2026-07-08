# Base node engine image
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Install dependencies including root files and internal packages
COPY package*.json ./
COPY tsconfig.json ./

# Copy packages
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

# Install root dependencies and build packages
RUN npm ci
RUN npm run build -w @iptv-menu/types
RUN npm run build -w @iptv-menu/config
RUN npm run build -w @iptv-menu/logging
RUN npm run build -w @iptv-menu/auth
RUN npm run build -w @iptv-menu/db
RUN npm run build -w @iptv-menu/storage
RUN npm run build -w @iptv-menu/billing
RUN npm run build -w @iptv-menu/jobs

# Build API service
WORKDIR /usr/src/app/apps/api
RUN npm run build

# Production Runner Stage
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

ENV NODE_ENV=production

COPY package*.json ./
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/packages ./packages
COPY --from=builder /usr/src/app/apps/api/package.json ./apps/api/
COPY --from=builder /usr/src/app/apps/api/dist ./apps/api/dist

EXPOSE 3000

CMD ["node", "apps/api/dist/server.js"]
