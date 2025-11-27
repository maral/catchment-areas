# ---------- STAGE 1: build ----------
FROM node:20 AS builder
WORKDIR /app

ARG NEXT_PUBLIC_MAPY_CZ_API_KEY
ARG NEXT_PUBLIC_BASE_URL
ARG TEXTTOMAP_DB_TYPE
ARG TEXTTOMAP_MYSQL_CONNECTION_DATA
ARG AUTH_SECRET
ARG AUTH_URL
ARG AUTH_MICROSOFT_ENTRA_ID_ID
ARG AUTH_MICROSOFT_ENTRA_ID_SECRET
ARG OPENAI_API_KEY

ENV NEXT_PUBLIC_MAPY_CZ_API_KEY=$NEXT_PUBLIC_MAPY_CZ_API_KEY
ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL
ENV TEXTTOMAP_DB_TYPE=$TEXTTOMAP_DB_TYPE
ENV TEXTTOMAP_MYSQL_CONNECTION_DATA=$TEXTTOMAP_MYSQL_CONNECTION_DATA
ENV AUTH_SECRET=$AUTH_SECRET
ENV AUTH_URL=$AUTH_URL
ENV AUTH_MICROSOFT_ENTRA_ID_ID=$AUTH_MICROSOFT_ENTRA_ID_ID
ENV AUTH_MICROSOFT_ENTRA_ID_SECRET=$AUTH_MICROSOFT_ENTRA_ID_SECRET
ENV OPENAI_API_KEY=$OPENAI_API_KEY

COPY package.json package-lock.json* ./

RUN npm ci

COPY . .

RUN npm run build

# ---------- STAGE 2: runtime ----------
FROM node:20-slim AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

USER nextjs

EXPOSE 3003

CMD ["npm", "run", "start"]