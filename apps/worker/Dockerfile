# Base node engine image
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
COPY tsconfig.json ./

COPY packages/ ./packages/
COPY apps/worker/ ./apps/worker/

RUN npm ci
RUN npm run build -w @iptv-menu/types
RUN npm run build -w @iptv-menu/config
RUN npm run build -w @iptv-menu/logging
RUN npm run build -w @iptv-menu/auth
RUN npm run build -w @iptv-menu/db
RUN npm run build -w @iptv-menu/storage
RUN npm run build -w @iptv-menu/jobs

WORKDIR /usr/src/app/apps/worker
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /usr/src/app

ENV NODE_ENV=production

COPY package*.json ./
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/packages ./packages
COPY --from=builder /usr/src/app/apps/worker/package.json ./apps/worker/
COPY --from=builder /usr/src/app/apps/worker/dist ./apps/worker/dist

CMD ["node", "apps/worker/dist/index.js"]
