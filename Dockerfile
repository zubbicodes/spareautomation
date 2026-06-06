FROM node:22-alpine AS build
WORKDIR /app

# Install dependencies and build the client bundle
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Generate a static SPA entrypoint from the client build output.
# TanStack Start emits multiple index chunks; hydrateRoot marks the browser entry.
RUN set -e \
  && jsFile=$(basename "$(grep -rl "hydrateRoot" dist/client/assets/*.js | head -n 1)") \
  && cssFile=$(basename "$(ls dist/client/assets/styles-*.css | head -n 1)") \
  && test -n "$jsFile" \
  && test -n "$cssFile" \
  && mkdir -p dist/client \
  && cat > dist/client/index.html <<EOF
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Spares Automation</title>
    <meta name="description" content="B2B procurement for asphalt, concrete, packing and automation spares." />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&family=IBM+Plex+Mono:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700&display=swap" />
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
