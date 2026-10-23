# Minimal image for development only
FROM node:24.22.1-slim@sha256:55fb5f5a527ea2c5c4a95f963e48ef90aa38c7b346054fdc8ee9957a2b55d205 AS dev
WORKDIR /repo/apps/ui

# Nothing is copied; the compose bind-mount supplies code and tsconfig.
# Exposes on 0.0.0.0:5173
CMD ["npm", "run", "dev", "--", "--host"]
