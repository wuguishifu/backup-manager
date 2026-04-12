FROM node:22-alpine AS base
RUN npm install -g pnpm

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/types/package.json ./packages/types/
COPY apps/k8s-adapter/package.json ./apps/k8s-adapter/
RUN pnpm install --frozen-lockfile

# Runtime — tsx runs TypeScript directly, no compile step needed
FROM base AS runner
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/k8s-adapter/node_modules ./apps/k8s-adapter/node_modules
COPY packages/ ./packages/
COPY apps/k8s-adapter/ ./apps/k8s-adapter/
EXPOSE 3001
CMD ["node_modules/.bin/tsx", "apps/k8s-adapter/src/index.ts"]
