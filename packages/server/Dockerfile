FROM node:20-alpine AS builder
WORKDIR /app

# Copy workspace manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY packages/server/package.json packages/server/
COPY packages/sdk/package.json packages/sdk/

# Install pnpm and dependencies
RUN npm install -g pnpm@9.12.0 && pnpm install --frozen-lockfile

# Copy source
COPY packages/server packages/server
COPY packages/sdk packages/sdk

# Build SDK first (server depends on it)
RUN pnpm --filter @meridian/sdk build

# Build server
RUN pnpm --filter @meridian/server build

# ---------------------------------------------------------------------------
# Production image
# ---------------------------------------------------------------------------
FROM node:20-alpine
WORKDIR /app

COPY --from=builder /app/packages/server/dist ./dist
COPY --from=builder /app/packages/server/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/sdk/dist /app/packages/sdk/dist
COPY --from=builder /app/packages/sdk/package.json /app/packages/sdk/package.json

ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001

CMD ["node", "dist/index.js"]
