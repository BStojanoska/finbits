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

# Stage 3: Production image
FROM node:18-alpine AS production
WORKDIR /app
COPY --from=builder /app/.output ./.output
COPY --from=base /app/node_modules ./node_modules
COPY package.json .

# Expose the port Nuxt will run on
EXPOSE 3000

# Set the host to 0.0.0.0 to accept connections from outside the container
ENV HOST=0.0.0.0

# Command to run the Nuxt server
CMD [ "node", ".output/server/index.mjs" ]