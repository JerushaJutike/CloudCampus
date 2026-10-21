FROM node:24-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --omit=dev --ignore-scripts
COPY backend/ ./backend/
COPY frontend/ ./frontend/
RUN mkdir -p /app/certs && curl --fail --silent --show-error https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem -o /app/certs/global-bundle.pem
ENV NODE_ENV=production PORT=5000 NODE_EXTRA_CA_CERTS=/app/certs/global-bundle.pem
USER node
EXPOSE 5000
CMD ["node", "backend/src/app.js"]
