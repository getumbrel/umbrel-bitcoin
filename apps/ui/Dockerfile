# Minimal image for development only
FROM node:24.22.3-slim@sha256:dc26ae92c9fb15cf6b1d63e20f0944b2efe0f115b20e00be48fb23fceb061c54 AS dev
WORKDIR /repo/apps/ui

# Nothing is copied; the compose bind-mount supplies code and tsconfig.
# Exposes on 0.0.0.0:5173
CMD ["npm", "run", "dev", "--", "--host"]
