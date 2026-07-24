#!/bin/sh
set -eu

# Named volumes can retain ownership from an older image. Repair it before
# dropping privileges so uploads continue to work across Coolify redeployments.
chown -R node:node /app/data

exec su-exec node:node "$@"
