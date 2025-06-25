# Minimal image for development only
FROM node:20-slim AS dev
WORKDIR /repo/apps/ui

# Nothing is copied; the compose bind-mount supplies code and tsconfig.
# Exposes on 0.0.0.0:5173
CMD ["npm", "run", "dev", "--", "--host"]