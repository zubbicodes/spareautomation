FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=80

COPY --from=build --chown=node:node /app/.output ./.output
# Drizzle migrations are read from disk at boot by runMigrations().
COPY --from=build --chown=node:node /app/drizzle ./drizzle
# Persistent local storage (part-inquiry photo uploads).
RUN apk add --no-cache su-exec \
    && mkdir -p /app/data/uploads \
    && chown -R node:node /app/data
COPY --chmod=755 docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"]

EXPOSE 80
CMD ["node", ".output/server/index.mjs"]
