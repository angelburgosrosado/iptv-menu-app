# Base node engine image
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copy root configurations
COPY package*.json ./
COPY tsconfig.json ./
COPY vite.config.ts ./
COPY index.html ./

# Copy packages, apps and source directories
COPY packages/ ./packages/
COPY apps/ ./apps/
COPY public/ ./public/
COPY src/ ./src/

# Install dependencies and build
RUN npm ci
RUN npm run build:packages && npm run build:web

# Production Runner Stage
FROM nginx:alpine AS runner

# Copy the built Vite assets to Nginx
COPY --from=builder /usr/src/app/dist /usr/share/nginx/html

# Change Nginx default port to 8080 to comply with Cloud Run defaults
RUN sed -i 's/listen  *80;/listen 8080;/g' /etc/nginx/conf.d/default.conf

# Copy entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Expose port 8080
EXPOSE 8080

ENTRYPOINT ["/entrypoint.sh"]
