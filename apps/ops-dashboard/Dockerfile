# ── Stage 1: Build ────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (layer caching)
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source and build
COPY . .

# Build-time env vars (Railway injects these)
ARG VITE_API_BASE_URL=/api/v1
ARG VITE_TOPOLOGY_API_URL=/api/v1
ARG VITE_WS_URL=

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_TOPOLOGY_API_URL=$VITE_TOPOLOGY_API_URL
ENV VITE_WS_URL=$VITE_WS_URL

RUN npm run build

# ── Stage 2: Serve ────────────────────────────────────────────
FROM nginx:1.27-alpine

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
