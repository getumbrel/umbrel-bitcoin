# Multi-stage Dockerfile for Umbrel Bitcoin Node app
#
# * dev: `docker compose up` builds the **dev** stage only
# hot-reloading backend container (the UI dev server lives in its own
# apps/ui/Dockerfile; both share a hoisted node_modules volume in the compose file).
#
# * production: `docker build ...` produces a single self-contained image with backend + UI + bitcoind
# single final image that contains
#  – compiled backend
#  – bundled React UI (Vite output → dist/public)
#  – compiled shared libs (libs/settings, libs/shared-types)
#  – bitcoind + bitcoin-cli binaries

###########################################
# Bitcoind
###########################################
# https://github.com/getumbrel/docker-bitcoind
FROM ghcr.io/getumbrel/docker-bitcoind:v30.0 AS bitcoind_30_0
FROM ghcr.io/getumbrel/docker-bitcoind:v29.2 AS bitcoind_29_2

##########################################################
# Dependencies layer — install every workspace deps
# Functions as a shared cache for dev & app-builder stages
##########################################################
FROM node:20-slim AS deps
WORKDIR /repo

# Copy only dependency manifests to keep this layer cache-friendly
COPY package*.json ./
COPY apps/backend/package*.json apps/backend/
COPY apps/ui/package*.json apps/ui/

RUN npm ci --workspaces --include-workspace-root --install-strategy=hoisted

# Add npm binaries to PATH so subsequent stages can invoke tsc / vite / etc.
ENV PATH="/repo/node_modules/.bin:$PATH"

####################################################
# DEV-ONLY build stage: Backend hot-reload image
# - Not referenced by later COPY --from=… steps,
#   so it’s skipped during a plain `docker build`.
# - `docker compose up` targets it via `target: dev`
#   in the docker-compose.yml file.
####################################################
FROM deps AS dev
WORKDIR /repo/apps/backend

VOLUME /data

# bitcoind binaries
RUN mkdir -p /opt/bitcoind/v30.0 /opt/bitcoind/v29.2
COPY --from=bitcoind_30_0 /bin/bitcoind    /opt/bitcoind/v30.0/bitcoind
COPY --from=bitcoind_30_0 /bin/bitcoin-cli /opt/bitcoind/v30.0/bitcoin-cli
COPY --from=bitcoind_29_2 /bin/bitcoind    /opt/bitcoind/v29.2/bitcoind
COPY --from=bitcoind_29_2 /bin/bitcoin-cli /opt/bitcoind/v29.2/bitcoin-cli

# Give 1000:1000 write permisions to /opt/bitcoind (just directory) so we can flip the symbolic link while the container runs as 1000:1000
RUN chown 1000:1000 /opt/bitcoind

# Symbolic link for default bitcoind binary
# By default we point to the latest version of Bitcoin Core
RUN ln -sfn /opt/bitcoind/v30.0 /opt/bitcoind/current
RUN ln -sfn /opt/bitcoind/current/bitcoind    /usr/local/bin/bitcoind
RUN ln -sfn /opt/bitcoind/current/bitcoin-cli /usr/local/bin/bitcoin-cli

# Symlink for datadir so bitcoin-cli auto-finds the RPC cookie
# Allows exec'ing bitcoin-cli inside the container without specifying credentials
RUN ln -sfn /data/bitcoin /root/.bitcoin
RUN mkdir -p /home/node \
 && ln -sfn /data/bitcoin /home/node/.bitcoin \
 && chown -h 1000:1000 /home/node/.bitcoin

CMD ["npm","run","dev"]

#################################################
# app-builder stage
#################################################
FROM deps AS app-builder
WORKDIR /repo
COPY . .

# build shared libraries (libs/*/dist)
# build backend (ts → js) (apps/backend/dist)
# bundle UI (vite build) (apps/ui/dist)
RUN tsc -b libs/shared-types libs/settings apps/backend \
 && npm run --workspace apps/ui build

########################################
# runtime stage — final production image
########################################
FROM node:20-slim AS runtime
WORKDIR /app

# Install production dependencies only
# Note: import-map lives in package.json, so is also needed so Node can resolve "#settings/#types"
  COPY package*.json ./
  COPY apps/backend/package*.json apps/backend/
  RUN npm ci --omit=dev --install-strategy=hoisted --ignore-scripts

# Backend JS bundle
COPY --from=app-builder /repo/apps/backend/dist ./dist

# Pre-bundled React UI → backend serves this from /public/*
COPY --from=app-builder /repo/apps/ui/dist ./dist/public

# Compiled shared libs (referenced at runtime via import-map)
COPY --from=app-builder /repo/libs/settings/dist ./libs/settings/dist
COPY --from=app-builder /repo/libs/shared-types/dist ./libs/shared-types/dist

# bitcoind binaries
RUN mkdir -p /opt/bitcoind/v30.0 /opt/bitcoind/v29.2
COPY --from=bitcoind_30_0 /bin/bitcoind    /opt/bitcoind/v30.0/bitcoind
COPY --from=bitcoind_30_0 /bin/bitcoin-cli /opt/bitcoind/v30.0/bitcoin-cli
COPY --from=bitcoind_29_2 /bin/bitcoind    /opt/bitcoind/v29.2/bitcoind
COPY --from=bitcoind_29_2 /bin/bitcoin-cli /opt/bitcoind/v29.2/bitcoin-cli

# Symbolic link for default bitcoind binary
# By default we point to the latest version of Bitcoin Core
RUN ln -sfn /opt/bitcoind/v30.0 /opt/bitcoind/current
RUN ln -sfn /opt/bitcoind/current/bitcoind    /usr/local/bin/bitcoind
RUN ln -sfn /opt/bitcoind/current/bitcoin-cli /usr/local/bin/bitcoin-cli

# Symlink for datadir so bitcoin-cli auto-finds the RPC cookie
# Allows exec'ing bitcoin-cli inside the container without specifying credentials
RUN ln -sfn /data/bitcoin /root/.bitcoin
RUN mkdir -p /home/node \
 && ln -sfn /data/bitcoin /home/node/.bitcoin \
 && chown -h 1000:1000 /home/node/.bitcoin

ENV NODE_ENV=production

# Data dirs inside /data
ENV BITCOIN_DIR=/data/bitcoin
ENV APP_STATE_DIR=/data/app

# 3000 = HTTP API, 8332 = RPC, 8333 = P2P
EXPOSE 3000 8332 8333
# app and bitcoind data
VOLUME /data

CMD ["node", "dist/server.js"]