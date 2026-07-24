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

COPY --from=build /app/.output ./.output
# Drizzle migrations are read from disk at boot by runMigrations().
COPY --from=build /app/drizzle ./drizzle
# Persistent local storage (part-inquiry photo uploads).
RUN mkdir -p /app/data/uploads

EXPOSE 80
CMD ["node", ".output/server/index.mjs"]
