# syntax=docker/dockerfile:1
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# ── deps ──────────────────────────────────────────────────────────────────────
FROM base AS deps
COPY package.json yarn.lock ./
COPY apps/web/package.json apps/web/
COPY packages/auth/package.json packages/auth/
COPY packages/cache/package.json packages/cache/
COPY packages/db/package.json packages/db/
COPY packages/storage/package.json packages/storage/
COPY packages/store/package.json packages/store/
COPY packages/ui/package.json packages/ui/
COPY packages/eslint-config/package.json packages/eslint-config/
COPY packages/typescript-config/package.json packages/typescript-config/
RUN yarn install --frozen-lockfile

# ── builder ───────────────────────────────────────────────────────────────────
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY . .

# Generate Prisma client
RUN yarn db:generate

ENV NEXT_TELEMETRY_DISABLED=1
# NEXT_PUBLIC_* values are compiled into the browser bundle, and .dockerignore
# keeps .env out of the build context, so the Razorpay public key ID must be
# passed as a build argument. It is not a secret.
ARG NEXT_PUBLIC_RAZORPAY_KEY_ID
ENV NEXT_PUBLIC_RAZORPAY_KEY_ID=$NEXT_PUBLIC_RAZORPAY_KEY_ID
RUN yarn workspace @repo/web build

# ── runner ────────────────────────────────────────────────────────────────────
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# In a monorepo, `output: "standalone"` nests the server under apps/web/, so
# static assets and public/ must be copied next to it, not to the image root.
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

USER nextjs
EXPOSE 3000

# Bind to all interfaces. Next.js falls back to a different host if HOSTNAME is
# unset, and Docker sets HOSTNAME to the container ID by default, so both are pinned.
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Used by `docker run` and local testing. Lightsail and App Runner run their own
# checks against /api/health. The route makes no external calls, so a database
# outage doesn't mark the container unhealthy.
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:3000/api/health || exit 1

CMD ["node", "apps/web/server.js"]
