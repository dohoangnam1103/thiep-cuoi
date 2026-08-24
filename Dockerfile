# SRC https://github.com/vercel/next.js/blob/canary/examples/with-docker/Dockerfile

# ============================================
# Stage 1: Dependencies Installation Stage
# ============================================

# IMPORTANT: Node.js Version Maintenance
# This Dockerfile defaults to the latest tested Node.js 24 LTS patch.
# To ensure security and compatibility, update the NODE_VERSION ARG when the project's Node baseline changes.
ARG NODE_VERSION=24.18.0-slim

FROM node:${NODE_VERSION} AS dependencies

# Set working directory
WORKDIR /app

# Copy package-related files first to leverage Docker's caching mechanism
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* .npmrc* ./

# Install project dependencies with frozen lockfile for reproducible builds
RUN --mount=type=cache,target=/root/.npm \
  --mount=type=cache,target=/usr/local/share/.cache/yarn \
  --mount=type=cache,target=/root/.local/share/pnpm/store \
  if [ -f package-lock.json ]; then \
  npm ci --ignore-scripts --no-audit --no-fund; \
  elif [ -f yarn.lock ]; then \
  corepack enable yarn && yarn install --frozen-lockfile --production=false --ignore-scripts; \
  elif [ -f pnpm-lock.yaml ]; then \
  corepack enable pnpm && pnpm install --frozen-lockfile --ignore-scripts; \
  else \
  echo "No lockfile found." && exit 1; \
  fi

# --ignore-scripts above skips better-sqlite3's install script (prebuild-install),
# so its native .node binding is never fetched. Rebuild just that package to pull
# the prebuilt binary for this Node ABI/platform.
RUN npm rebuild better-sqlite3

# ============================================
# Stage 2: Build Next.js application in standalone mode
# ============================================

FROM node:${NODE_VERSION} AS builder

# Prisma detects OpenSSL while generating the client. Keep it in the build
# stage only; the SQLite driver adapter does not need the Prisma engine at runtime.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

# Mỗi deployment cần một ID riêng để Next.js thêm ?dpl=... vào static assets.
# Nếu không, trình duyệt có thể giữ chunk Turbopack cũ vì Cache-Control immutable.
ARG NEXT_DEPLOYMENT_ID=local
ARG NEXT_PUBLIC_SITE_URL=https://thiepmungonline.com

# Set working directory
WORKDIR /app

# Copy project dependencies from dependencies stage
COPY --from=dependencies /app/node_modules ./node_modules

# Copy application source code
COPY . .

# Preserve every public URL while storing byte-identical theme assets only once
# in the image layer. The source worktree remains untouched.
RUN node scripts/dedupe-public-assets.mjs --apply

ENV NODE_ENV=production
ENV DATABASE_URL="file:./dev.db"
ENV SESSION_SECRET="build-time-placeholder"
ENV NEXT_DEPLOYMENT_ID=${NEXT_DEPLOYMENT_ID}
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}
# Cross-platform Node builds under QEMU are best-effort on Apple Silicon. The
# deployment script's BUILD_ON=local mode compiles Next natively on the Mac;
# BUILD_ON=remote compiles natively on the Mini PC.

RUN npm run prisma:generate

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
# ENV NEXT_TELEMETRY_DISABLED=1

# Build Next.js application. Keep Turbopack's compiler cache outside the image
# layer so subsequent production builds reuse it without shipping it at runtime.
RUN --mount=type=cache,id=thiepmungonline-next-build-cache,target=/app/.next/cache,sharing=locked \
  if [ -f package-lock.json ]; then \
  npm run build; \
  elif [ -f yarn.lock ]; then \
  corepack enable yarn && yarn build; \
  elif [ -f pnpm-lock.yaml ]; then \
  corepack enable pnpm && pnpm build; \
  else \
  echo "No lockfile found." && exit 1; \
  fi

# ============================================
# Stage 3: Run Next.js application
# ============================================

FROM node:${NODE_VERSION} AS runner

# Set working directory
WORKDIR /app

# Set production environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the run time.
# ENV NEXT_TELEMETRY_DISABLED=1

# Copy production assets
COPY --from=builder --chown=node:node /app/public ./public

# Set the correct permission for prerender cache.
#
# `.next/cache` is created here on purpose even though the build cache is not
# copied in below: it is the mount point for the persisted image-optimizer
# cache. Docker seeds a fresh volume from the image path it shadows, so having
# the directory exist as node:node is what keeps the volume writable by the
# non-root user. Mount it on an absent path and Docker creates it root-owned,
# the optimizer silently fails to write, and every deploy re-encodes everything.
RUN mkdir -p .next/cache
RUN chown -R node:node .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

# If you want to persist the fetch cache generated during the build so that
# cached responses are available immediately on startup, uncomment this line:
# COPY --from=builder --chown=node:node /app/.next/cache ./.next/cache

# Switch to non-root user for security best practices
USER node

# Expose port 3000 to allow HTTP traffic
EXPOSE 3000

# Start Next.js standalone server
CMD ["node", "server.js"]
