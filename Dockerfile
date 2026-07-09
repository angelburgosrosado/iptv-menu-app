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

# Change Nginx default port to 8080 to comply with Cloud Run defaults
RUN sed -i 's/listen  *80;/listen 8080;/g' /etc/nginx/conf.d/default.conf

# Expose port 8080
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
