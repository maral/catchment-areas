# ---------- STAGE 1: build ----------
FROM node:18 AS builder
WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm ci

COPY . .

RUN npm run build

# ---------- STAGE 2: runtime ----------
FROM node:18-slim AS runner
WORKDIR /app


RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

USER nextjs

EXPOSE 3000

COPY --from=builder --chown=nextjs:nodejs /app /app

CMD ["npm", "run", "start"]
