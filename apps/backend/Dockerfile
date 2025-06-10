# Dockerfile for both development and production

# Bring in bitcoind
FROM ghcr.io/getumbrel/docker-bitcoind:v29.0 AS bitcoind

# Dependencies layer (shared cache for backend and ui in dev)
FROM node:20-slim AS deps
WORKDIR /repo

# workspace manifests
COPY package*.json ./
COPY apps/backend/package*.json apps/backend/
COPY apps/ui/package*.json apps/ui/
COPY libs/*/package*.json libs/

RUN npm ci --workspaces --include-workspace-root
ENV PATH=/repo/node_modules/.bin:$PATH

# bitcoind binaries from docker-bitcoind image
COPY --from=bitcoind /bin/bitcoind /usr/local/bin/
COPY --from=bitcoind /bin/bitcoin-cli /usr/local/bin/

# backend dev stage (for hot-reload)
# frontend dev image is separate (apps/ui/Dockerfile)
FROM deps AS dev
WORKDIR /repo/apps/backend
VOLUME /data
CMD ["npm","run","dev"]

# PRODUCTION STAGES
# untested below... these will be for final production image

# UI build stage
FROM deps AS ui-builder
WORKDIR /repo
COPY . .
# outputs apps/ui/dist
RUN npm --workspace apps/ui run build

# Backend build stage
FROM deps AS backend-builder
WORKDIR /repo
COPY . .
 # ts-node → dist/
RUN npm --workspace apps/backend run build

# Final production image
FROM node:20-slim AS runtime
WORKDIR /app

# production node_modules (optional: npm prune --production)
COPY --from=deps /repo/node_modules ./node_modules --link

# compiled backend & UI bundle
COPY --from=backend-builder /repo/apps/backend/dist ./dist
COPY --from=ui-builder /repo/apps/ui/dist ./dist/public

# bitcoind binaries
COPY --from=bitcoind /bin/bitcoind    /usr/local/bin/
COPY --from=bitcoind /bin/bitcoin-cli /usr/local/bin/

ENV NODE_ENV=production

VOLUME /data
CMD ["node","dist/server.js"]