FROM node:18-bullseye AS client-build
WORKDIR /app/client
# Install client dependencies separately for better caching
COPY client/package*.json ./
RUN npm ci
# Copy the rest of the client source and build
COPY client .
RUN npm run build

# -----------------------------
# Build server and bundle client
# -----------------------------
FROM node:18-bullseye AS server-build
WORKDIR /app

# Install server dependencies first to leverage layer caching
COPY server/package*.json ./server/
RUN cd server && npm ci --production

# Copy full repository (needed for runtime files, uploads folder, etc.)
COPY . .

# Move the built front-end into the server's public directory
COPY --from=client-build /app/client/dist ./server/public

# Environment & runtime
ENV NODE_ENV=production
WORKDIR /app/server
EXPOSE 4000

CMD ["node", "src/index.js"]

# Ensure the public folder exists and contains the built assets
RUN mkdir -p server/public 