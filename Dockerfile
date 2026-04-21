# ── Stage 1: Build Vue frontend ──────────────────────────────────
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# ── Stage 2: Production image ─────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app

# Backend deps
COPY backend/package*.json ./backend/
RUN cd backend && npm install --omit=dev

# Backend source
COPY backend/ ./backend/

# Built frontend
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Data volume mount point
RUN mkdir -p /data

ENV PORT=3000
ENV DATA_DIR=/data
ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "backend/server.js"]
