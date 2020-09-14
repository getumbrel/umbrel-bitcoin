# Build Stage
FROM node:12-buster-slim AS umbrel-middleware-builder

# Install tools
# RUN apt-get update \
#     && apt-get install -y build-essential \
#     && apt-get install -y python3

# Create app directory
WORKDIR /app

# Copy 'yarn.lock' and 'package.json'
COPY yarn.lock package.json ./

# Install dependencies
RUN yarn install --production

# Copy project files and folders to the current working directory (i.e. '/app')
COPY . .

# Final image
FROM node:12-buster-slim AS umbrel-middleware

# Copy built code from build stage to '/app' directory
COPY --from=umbrel-middleware-builder /app /app

# Change directory to '/app' 
WORKDIR /app

EXPOSE 3006
CMD [ "yarn", "start" ]
