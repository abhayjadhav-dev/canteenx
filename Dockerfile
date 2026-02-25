FROM node:20-alpine AS base
WORKDIR /app

COPY package.json package-lock.json* ./
COPY backend ./backend
COPY web ./web

# Install dependencies
RUN npm install && \
    npm run install:backend && \
    npm run install:web

# Build frontend
RUN npm run build:web

FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production

COPY --from=base /app/backend ./backend
COPY --from=base /app/web/dist ./web/dist
COPY package.json package-lock.json* ./

WORKDIR /app

EXPOSE 4000

CMD ["npm", "start"]

