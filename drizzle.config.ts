import { defineConfig } from "drizzle-kit";

/**
 * Drizzle Kit config. Used to generate migrations from the schema:
 *   npx drizzle-kit generate
 * and to apply them locally:
 *   npx drizzle-kit migrate
 * In production the app applies migrations on boot (src/lib/db/migrate.server.ts).
 */
export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/spares",
  },
});
