FROM node:20-alpine AS builder
WORKDIR /app

# Copy workspace manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./
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

# Create a self-contained production deployment bundle.
# pnpm deploy resolves workspace: deps (copies @meridian/sdk dist) and
# flattens node_modules so the production image needs no pnpm at all.
RUN pnpm --filter @meridian/example-defi-rebalancer deploy --prod /app/deploy \
    && cp -r /app/examples/defi-rebalancer/dist /app/deploy/dist

# ---------------------------------------------------------------------------
# Production image
# ---------------------------------------------------------------------------
FROM node:20-alpine
WORKDIR /app

COPY --from=builder /app/deploy .

ENV NODE_ENV=production
ENV PORT=3002
EXPOSE 3002

CMD ["node", "dist/index.js"]
