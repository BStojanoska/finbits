# Dockerfile

# Stage 1: Install dependencies
FROM node:18-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm install

# Stage 2: Build the application
FROM base AS builder
COPY . .
RUN npm run build

FROM node:18-alpine AS production
WORKDIR /app

# Install postgresql-client to get the 'pg_isready' utility
RUN apk add --no-cache postgresql-client

COPY --from=builder /app/.output ./.output
COPY --from=base /app/node_modules ./node_modules
COPY package.json .
COPY drizzle.config.ts .
COPY server ./server

# Copy and make the entrypoint script executable
COPY entrypoint.sh .
RUN chmod +x ./entrypoint.sh

# Expose the port Nuxt will run on
EXPOSE 3000

# Set the host to 0.0.0.0 to accept connections from outside the container
ENV HOST=0.0.0.0

# Set the entrypoint to our new script
ENTRYPOINT ["./entrypoint.sh"]

# The default command to run the Nuxt server
# This will be passed to the entrypoint script as "$@"
CMD [ "node", ".output/server/index.mjs" ]