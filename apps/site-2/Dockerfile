# Site-2 image. Build from the REPO ROOT so npm workspaces
# (apps/site-2 + packages/*) resolve:
#   docker build -f apps/site-2/Dockerfile \
#     --build-arg NEXT_PUBLIC_SITE_URL=https://site-2.example .
ARG NODE_VERSION=24.18.0-slim

FROM node:${NODE_VERSION} AS dependencies
WORKDIR /app
COPY package.json package-lock.json prisma.config.ts ./
COPY prisma/schema.prisma ./prisma/schema.prisma
COPY apps/site-2/package.json ./apps/site-2/package.json
COPY packages/site-config/package.json ./packages/site-config/package.json
COPY packages/invitation-core/package.json ./packages/invitation-core/package.json
COPY packages/invitation-data/package.json ./packages/invitation-data/package.json
RUN --mount=type=cache,target=/root/.npm \
  npm ci --ignore-scripts --no-audit --no-fund && \
  npm rebuild better-sqlite3

FROM node:${NODE_VERSION} AS builder
ARG NEXT_PUBLIC_SITE_URL=https://site-2.example
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/apps/site-2/package.json ./apps/site-2/package.json
COPY packages ./packages
COPY apps/site-2 ./apps/site-2
# Tailwind only scans the app tree reliably in every environment; explicit
# @source entries cover local dev, while this mirror guarantees production
# builds see every utility used by shared packages. Scanned for candidates
# only — never imported, routed, or typechecked (outside src/).
RUN rm -rf ./apps/site-2/tailwind-sources && mkdir -p ./apps/site-2/tailwind-sources && cp -r ./packages/invitation-core/src ./apps/site-2/tailwind-sources/invitation-core && cp -r ./packages/invitation-data/src ./apps/site-2/tailwind-sources/invitation-data
# Full cloned catalog assets (themes, gallery, previews, fonts, music),
# synced from master public/chungdoi into ./master-public before build.
COPY master-public/chungdoi ./apps/site-2/public/chungdoi
ENV NODE_ENV=production
ENV DATABASE_URL="file:/app/data/prod.db"
ENV SESSION_SECRET="build-time-placeholder"
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}
WORKDIR /app/apps/site-2
RUN DATABASE_URL="file:./dev-site2.db" npx prisma generate
RUN npx next build

FROM node:${NODE_VERSION} AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
# Standalone output preserves the monorepo layout: the server entrypoint is
# apps/site-2/server.js and it resolves .next/static and public/ relative to
# the app directory, so keep that structure intact.
COPY --from=builder --chown=node:node /app/apps/site-2/.next/standalone ./
COPY --from=builder --chown=node:node /app/apps/site-2/.next/static ./apps/site-2/.next/static
COPY --from=builder --chown=node:node /app/apps/site-2/public ./apps/site-2/public
RUN mkdir -p /app/data && chown node:node /app/data
USER node
EXPOSE 3000
CMD ["node", "apps/site-2/server.js"]
