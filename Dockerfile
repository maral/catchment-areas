# ---------- STAGE 1: build ----------
FROM node:22 AS builder
WORKDIR /app

# Native deps pro `canvas` (pdf-img-convert)
RUN apt-get update && apt-get install -y --no-install-recommends \
      pkg-config \
      libcairo2-dev \
      libpango1.0-dev \
      libjpeg-dev \
      libgif-dev \
      librsvg2-dev \
    && rm -rf /var/lib/apt/lists/*

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
FROM node:22-slim AS runner
WORKDIR /app

# Runtime libs pro `canvas`
RUN apt-get update && apt-get install -y --no-install-recommends \
      libcairo2 \
      libpango-1.0-0 \
      libpangocairo-1.0-0 \
      libjpeg62-turbo \
      libgif7 \
      librsvg2-2 \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app .

RUN mkdir -p data

EXPOSE 3003

CMD ["sh", "-c", "npm run start 2>&1 | tee -a /app/data/app.log"]
