# specify the node base image with your desired version node:<version>
FROM node:8-slim

# install tools
RUN apt-get update --no-install-recommends \
  && apt-get install -y --no-install-recommends vim \
  && apt-get install -y --no-install-recommends rsync \
  && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm install --only=production

# Bundle app source
COPY . .

RUN mkdir -p /root/.lnd

EXPOSE 3006
CMD [ "npm", "start" ]