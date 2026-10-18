# Base node engine image
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Install dependencies including root files and internal packages
COPY package*.json ./
COPY tsconfig.json ./

# Copy packages, apps, and data to satisfy all npm workspace dependencies
COPY packages/ ./packages/
COPY apps/ ./apps/
COPY data/ ./data/

# Install root dependencies and build packages
RUN npm ci
RUN npm run build:packages && npm --workspace=iptv-api run build

# Production Runner Stage
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

ENV NODE_ENV=production
ENV PORT=3001

COPY package*.json ./
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/packages ./packages
COPY --from=builder /usr/src/app/apps/api ./apps/api
COPY --from=builder /usr/src/app/data ./data

EXPOSE 3001

CMD ["node", "apps/api/dist/server.js"]
