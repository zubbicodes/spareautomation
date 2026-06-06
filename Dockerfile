FROM oven/bun:1.1 AS build
WORKDIR /app

# Install dependencies and build the client bundle
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

# Generate a static SPA entrypoint from the client build output
RUN set -e \
  && jsFile=$(basename "$(ls dist/client/assets/index-*.js | head -n 1)") \
  && cssFile=$(basename "$(ls dist/client/assets/styles-*.css | head -n 1)") \
  && mkdir -p dist/client \
  && cat > dist/client/index.html <<EOF
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Spares Automation</title>
    <link rel="stylesheet" href="/assets/${cssFile}" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/assets/${jsFile}"></script>
  </body>
</html>
EOF

FROM nginx:stable-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/client /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
