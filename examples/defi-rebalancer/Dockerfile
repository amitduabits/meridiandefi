FROM node:20-alpine AS builder
WORKDIR /app

# Copy workspace manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY examples/defi-rebalancer/package.json examples/defi-rebalancer/
COPY packages/sdk/package.json packages/sdk/

# Install pnpm and dependencies
RUN npm install -g pnpm@9.12.0 && pnpm install --frozen-lockfile

# Copy source
COPY examples/defi-rebalancer examples/defi-rebalancer
COPY packages/sdk packages/sdk

# Build SDK first (agent depends on it)
RUN pnpm --filter @meridian/sdk build

# Build agent
RUN pnpm --filter @meridian/example-defi-rebalancer build

# ---------------------------------------------------------------------------
# Production image
# ---------------------------------------------------------------------------
FROM node:20-alpine
WORKDIR /app

COPY --from=builder /app/examples/defi-rebalancer/dist ./dist
COPY --from=builder /app/examples/defi-rebalancer/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/sdk/dist /app/packages/sdk/dist
COPY --from=builder /app/packages/sdk/package.json /app/packages/sdk/package.json

ENV NODE_ENV=production
ENV PORT=3002
EXPOSE 3002

CMD ["node", "dist/index.js"]
