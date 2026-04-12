FROM node:22-alpine AS base
RUN npm install -g pnpm

# Install dependencies — copy only the manifests first for layer caching
FROM base AS deps
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/types/package.json ./packages/types/
COPY apps/web/package.json ./apps/web/
RUN pnpm install --frozen-lockfile

# Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY pnpm-workspace.yaml package.json ./
COPY packages/ ./packages/
COPY apps/web/ ./apps/web/
RUN pnpm --filter @backup-manager/web build

# Runtime
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/ ./packages/
COPY --from=builder /app/apps/web/ ./apps/web/
COPY --from=builder /app/pnpm-workspace.yaml /app/package.json ./
EXPOSE 3000
CMD ["pnpm", "--filter", "@backup-manager/web", "start"]
