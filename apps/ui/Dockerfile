# Minimal image for development only
FROM node:24.19.0-slim@sha256:3638d9a6fe4030bd716be989438248074489337ba3275657f93595428be4fc03 AS dev
WORKDIR /repo/apps/ui

# Nothing is copied; the compose bind-mount supplies code and tsconfig.
# Exposes on 0.0.0.0:5173
CMD ["npm", "run", "dev", "--", "--host"]