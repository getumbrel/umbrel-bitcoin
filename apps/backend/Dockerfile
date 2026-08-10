# Multi-stage Dockerfile for Umbrel Bitcoin Node app
#
# * dev: `docker compose up` builds the **dev** stage only
# hot-reloading backend container (the UI dev server lives in its own
# apps/ui/Dockerfile; both share a hoisted node_modules volume in the compose file).
#
# * production: `docker build ...` produces a single self-contained image containing:
#  – compiled backend
#  – bundled React UI (Vite output → dist/public)
#  – compiled shared libs (libs/settings, libs/shared-types)
#  – Bitcoin Core binaries

###########################################
# Bitcoin Core
###########################################
# https://github.com/getumbrel/docker-bitcoind
FROM ghcr.io/getumbrel/docker-bitcoind:v31.0 AS bitcoind_31_0
FROM ghcr.io/getumbrel/docker-bitcoind:v30.2 AS bitcoind_30_2
FROM ghcr.io/getumbrel/docker-bitcoind:v30.0 AS bitcoind_30_0
FROM ghcr.io/getumbrel/docker-bitcoind:v29.2 AS bitcoind_29_2

##########################################################
# Dependencies layer — install every workspace deps
# Functions as a shared cache for dev & app-builder stages
##########################################################
FROM node:24.19.0-slim@sha256:3638d9a6fe4030bd716be989438248074489337ba3275657f93595428be4fc03 AS deps
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

# Bitcoin Core binaries:
# - bitcoind: normal monolithic daemon
# - bitcoin-cli: RPC client used by the backend and manual container execs
# - bitcoin + bitcoin-node: multiprocess IPC mode, available in v31.0/v30.2 here
RUN mkdir -p /opt/bitcoind/v31.0 /opt/bitcoind/v30.2 /opt/bitcoind/v30.0 /opt/bitcoind/v29.2
COPY --from=bitcoind_31_0 /bin/bitcoind     /opt/bitcoind/v31.0/bitcoind
COPY --from=bitcoind_31_0 /bin/bitcoin-cli  /opt/bitcoind/v31.0/bitcoin-cli
COPY --from=bitcoind_31_0 /bin/bitcoin      /opt/bitcoind/v31.0/bitcoin
COPY --from=bitcoind_31_0 /usr/bin/bitcoin-node /opt/bitcoind/v31.0/bitcoin-node
COPY --from=bitcoind_30_2 /bin/bitcoind     /opt/bitcoind/v30.2/bitcoind
COPY --from=bitcoind_30_2 /bin/bitcoin-cli  /opt/bitcoind/v30.2/bitcoin-cli
COPY --from=bitcoind_30_2 /bin/bitcoin      /opt/bitcoind/v30.2/bitcoin
COPY --from=bitcoind_30_2 /usr/bin/bitcoin-node /opt/bitcoind/v30.2/bitcoin-node
COPY --from=bitcoind_30_0 /bin/bitcoind     /opt/bitcoind/v30.0/bitcoind
COPY --from=bitcoind_30_0 /bin/bitcoin-cli  /opt/bitcoind/v30.0/bitcoin-cli
COPY --from=bitcoind_29_2 /bin/bitcoind     /opt/bitcoind/v29.2/bitcoind
COPY --from=bitcoind_29_2 /bin/bitcoin-cli  /opt/bitcoind/v29.2/bitcoin-cli

# Give 1000:1000 write permissions to /opt/bitcoind itself so we can flip
# the current-version symlink while the container runs as 1000:1000.
RUN chown 1000:1000 /opt/bitcoind

# Symbolic links for default Bitcoin Core binaries
# By default we point to the latest version of Bitcoin Core
RUN ln -sfn /opt/bitcoind/v31.0 /opt/bitcoind/current
RUN ln -sfn /opt/bitcoind/current/bitcoind     /usr/local/bin/bitcoind
RUN ln -sfn /opt/bitcoind/current/bitcoin-cli  /usr/local/bin/bitcoin-cli
RUN ln -sfn /opt/bitcoind/current/bitcoin      /usr/local/bin/bitcoin
RUN ln -sfn /opt/bitcoind/current/bitcoin-node /usr/local/bin/bitcoin-node

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
FROM node:24.19.0-slim@sha256:3638d9a6fe4030bd716be989438248074489337ba3275657f93595428be4fc03 AS runtime
WORKDIR /app

# Install production dependencies only
# Note: import-map lives in package.json, so is also needed so Node can resolve "#settings/#types"
COPY package*.json ./
COPY apps/backend/package*.json apps/backend/
RUN npm ci --workspace apps/backend --include-workspace-root --omit=dev --omit=optional --install-strategy=hoisted --ignore-scripts

# Backend JS bundle
COPY --from=app-builder /repo/apps/backend/dist ./dist

# Pre-bundled React UI → backend serves this from /public/*
COPY --from=app-builder /repo/apps/ui/dist ./dist/public

# Compiled shared libs (referenced at runtime via import-map)
COPY --from=app-builder /repo/libs/settings/dist ./libs/settings/dist
COPY --from=app-builder /repo/libs/shared-types/dist ./libs/shared-types/dist

# Bitcoin Core binaries:
# - bitcoind: normal monolithic daemon
# - bitcoin-cli: RPC client used by the backend and manual container execs
# - bitcoin + bitcoin-node: multiprocess IPC mode, available in v31.0/v30.2 here
RUN mkdir -p /opt/bitcoind/v31.0 /opt/bitcoind/v30.2 /opt/bitcoind/v30.0 /opt/bitcoind/v29.2
COPY --from=bitcoind_31_0 /bin/bitcoind     /opt/bitcoind/v31.0/bitcoind
COPY --from=bitcoind_31_0 /bin/bitcoin-cli  /opt/bitcoind/v31.0/bitcoin-cli
COPY --from=bitcoind_31_0 /bin/bitcoin      /opt/bitcoind/v31.0/bitcoin
COPY --from=bitcoind_31_0 /usr/bin/bitcoin-node /opt/bitcoind/v31.0/bitcoin-node
COPY --from=bitcoind_30_2 /bin/bitcoind     /opt/bitcoind/v30.2/bitcoind
COPY --from=bitcoind_30_2 /bin/bitcoin-cli  /opt/bitcoind/v30.2/bitcoin-cli
COPY --from=bitcoind_30_2 /bin/bitcoin      /opt/bitcoind/v30.2/bitcoin
COPY --from=bitcoind_30_2 /usr/bin/bitcoin-node /opt/bitcoind/v30.2/bitcoin-node
COPY --from=bitcoind_30_0 /bin/bitcoind     /opt/bitcoind/v30.0/bitcoind
COPY --from=bitcoind_30_0 /bin/bitcoin-cli  /opt/bitcoind/v30.0/bitcoin-cli
COPY --from=bitcoind_29_2 /bin/bitcoind     /opt/bitcoind/v29.2/bitcoind
COPY --from=bitcoind_29_2 /bin/bitcoin-cli  /opt/bitcoind/v29.2/bitcoin-cli

# Give 1000:1000 write permissions to /opt/bitcoind itself so we can flip
# the current-version symlink while the container runs as 1000:1000.
RUN chown 1000:1000 /opt/bitcoind

# Symbolic links for default Bitcoin Core binaries
# By default we point to the latest version of Bitcoin Core
RUN ln -sfn /opt/bitcoind/v31.0 /opt/bitcoind/current
RUN ln -sfn /opt/bitcoind/current/bitcoind     /usr/local/bin/bitcoind
RUN ln -sfn /opt/bitcoind/current/bitcoin-cli  /usr/local/bin/bitcoin-cli
RUN ln -sfn /opt/bitcoind/current/bitcoin      /usr/local/bin/bitcoin
RUN ln -sfn /opt/bitcoind/current/bitcoin-node /usr/local/bin/bitcoin-node

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
