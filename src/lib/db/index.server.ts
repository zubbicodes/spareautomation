import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { getServerConfig } from "../config.server";
import * as schema from "./schema";

type Db = ReturnType<typeof drizzle<typeof schema>>;

let client: postgres.Sql | undefined;
let db: Db | undefined;

/**
 * Lazily create a shared Drizzle client. Reads DATABASE_URL at call time
 * (per the config.server.ts convention) so it works across Nitro requests.
 *
 * `prepare: false` keeps the client compatible with pooled connections.
 * A short connection timeout and a small pool keep public fallback reads fast
 * when PostgreSQL is restarting instead of queueing every storefront request.
 */
export function getDb(): Db {
  if (!db) {
    const { databaseUrl } = getServerConfig();
    if (!databaseUrl) {
      throw new Error("DATABASE_URL is not configured.");
    }
    client = postgres(databaseUrl, { max: 5, prepare: false, connect_timeout: 1 });
    db = drizzle(client, { schema });
  }
  return db;
}
