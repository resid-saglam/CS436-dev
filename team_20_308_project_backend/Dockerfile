FROM node:20-alpine

WORKDIR /app

# Install production dependencies. Using `npm ci --omit=dev` (the modern
# spelling of --only=production) so the lockfile is honoured.
COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

# Run as the unprivileged `node` user that the node:20-alpine image ships
# with (uid 1000). Mitigates Containerization-Attack class #8 in the
# attack-types-and-mitigations table.
RUN mkdir -p /app && chown -R node:node /app
USER node

EXPOSE 5002

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:5002/health || exit 1

CMD ["node","src/app.js"]
