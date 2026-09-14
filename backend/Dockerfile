# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# deps — installed once, reused by both the build and runtime stages below.
# ---------------------------------------------------------------------------
FROM node:20-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---------------------------------------------------------------------------
# build — compiles TypeScript and generates the Prisma client.
# ---------------------------------------------------------------------------
FROM node:20-bookworm-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# ---------------------------------------------------------------------------
# runtime
#
# Deliberately NOT pruning to a devDependency-free node_modules here: the
# `prisma` CLI (needed at container startup to sync the schema) lives in
# devDependencies, while `@prisma/client` lives in dependencies. Re-installing
# production-only deps and then bolting `prisma` back on separately is a
# common source of "works locally, breaks in the container" version drift.
# Carrying the full node_modules from `build` costs some image size but
# avoids that entire class of bug — a deliberate trade-off, not an oversight.
# ---------------------------------------------------------------------------
FROM node:20-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nestjs

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package.json ./package.json

USER nestjs
EXPOSE 4000

HEALTHCHECK --interval=10s --timeout=5s --start-period=15s --retries=5 \
  CMD node -e "fetch('http://localhost:4000/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

# This repo has no committed prisma/migrations — `db push` syncs the schema
# directly, which is the right tool for that (see README). If real migrations
# get added later, switch this to `npx prisma migrate deploy`. `--accept-data-loss`
# is required for `db push` to run non-interactively at all inside a container
# (no TTY to confirm a prompt on) — acceptable here since this is a demo/dev
# setup, not a database anyone has irreplaceable production data in.
CMD ["sh", "-c", "npx prisma db push --skip-generate --accept-data-loss && node dist/main"]
