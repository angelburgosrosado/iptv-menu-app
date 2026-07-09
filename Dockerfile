# Base node engine image
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copy root configurations
COPY package*.json ./
COPY tsconfig.json ./
COPY vite.config.ts ./
COPY index.html ./

# Copy source directories
COPY public/ ./public/
COPY src/ ./src/

# Install dependencies and build
RUN npm ci
RUN npm run build

# Production Runner Stage
FROM nginx:alpine AS runner

# Copy the built Vite assets to Nginx
COPY --from=builder /usr/src/app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
