import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

import { getServerConfig } from "../config.server";

let migrated = false;
let migrationPromise: Promise<boolean> | undefined;
const MAX_MIGRATION_ATTEMPTS = 5;
const BASE_RETRY_DELAY_MS = 500;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Apply pending Drizzle migrations on server boot. Idempotent: Drizzle records
 * applied migrations in a `__drizzle_migrations` table, so repeated calls are
 * safe. The migrations folder lives at the repo root (`./drizzle`) and is
 * copied into the Docker runtime image (see Dockerfile).
 */
export async function runMigrations(): Promise<boolean> {
  if (migrated) return true;
  if (migrationPromise) return migrationPromise;

  const { databaseUrl } = getServerConfig();
  if (!databaseUrl) {
    console.warn("[db] DATABASE_URL not set; skipping CMS migrations.");
    return false;
  }

  migrationPromise = (async () => {
    const folder = process.env.DRIZZLE_MIGRATIONS_FOLDER ?? "./drizzle";
    for (let attempt = 1; attempt <= MAX_MIGRATION_ATTEMPTS; attempt += 1) {
      const client = postgres(databaseUrl, { max: 1 });
      try {
        await migrate(drizzle(client), { migrationsFolder: folder });
        migrated = true;
        console.info("[db] CMS migrations applied.");
        return true;
      } catch (error) {
        if (attempt === MAX_MIGRATION_ATTEMPTS) {
          console.error(
            `[db] CMS migration failed after ${MAX_MIGRATION_ATTEMPTS} attempts:`,
            error,
          );
          return false;
        }
        const retryDelay = BASE_RETRY_DELAY_MS * 2 ** (attempt - 1);
        console.warn(
          `[db] CMS migration attempt ${attempt} failed; retrying in ${retryDelay}ms.`,
        );
        await delay(retryDelay);
      } finally {
        await client.end({ timeout: 5 });
      }
    }
    return false;
  })().finally(() => {
    if (!migrated) migrationPromise = undefined;
  });

  return migrationPromise;
}
