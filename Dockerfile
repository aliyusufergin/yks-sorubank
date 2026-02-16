FROM node:25-alpine AS base

# Dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma/
RUN npm ci

# Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build
# Create empty DB with correct schema in temp location
RUN mkdir -p /tmp/dbinit && DATABASE_URL="file:/tmp/dbinit/sorubank.db" npx prisma db push

# Runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache vips-dev

COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
# Template DB stored outside /app/data (volume mount would hide it)
COPY --from=builder /tmp/dbinit/sorubank.db /app/sorubank.db.init

RUN mkdir -p /app/data/uploads

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
# Prisma file: prefix is NOT standard URI. Just strip "file:" and use the rest as path.
# Relative to prisma/schema.prisma → ../data/sorubank.db → /app/data/sorubank.db
ENV DATABASE_URL="file:../data/sorubank.db"
ENV UPLOAD_DIR="./data/uploads"

# Debug: show what's happening, copy template if needed, then start
CMD ["sh", "-c", "cp -n /app/sorubank.db.init /app/data/sorubank.db 2>/dev/null || true; node server.js"]
