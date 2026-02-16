FROM node:20-alpine AS base

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
# Create empty DB with correct schema (prisma CLI available here)
RUN mkdir -p data && DATABASE_URL="file:../data/sorubank.db" npx prisma db push

# Runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
RUN apk add --no-cache vips-dev

COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
# Copy the empty schema-initialized DB as a template
COPY --from=builder /app/data/sorubank.db ./data/sorubank.db.init

RUN mkdir -p /app/data/uploads && chown -R nextjs:nodejs /app/data

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_URL="file:./data/sorubank.db"
ENV UPLOAD_DIR="./data/uploads"

# If no DB exists in volume, copy the template; then start server
CMD ["sh", "-c", "[ -f ./data/sorubank.db ] || cp ./data/sorubank.db.init ./data/sorubank.db; node server.js"]
