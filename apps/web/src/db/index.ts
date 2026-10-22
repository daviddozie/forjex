import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

/**
 * Validates if a Neon PostgreSQL database URL is configured in the environment.
 */
export function isDbConfigured(): boolean {
  const url = process.env.DATABASE_URL;
  return Boolean(
    url &&
      (url.startsWith("postgres://") ||
        url.startsWith("postgresql://")) &&
      !url.includes("placeholder")
  );
}

/**
 * Initializes and caches the Neon HTTP Drizzle ORM client.
 * Returns null if DATABASE_URL is not configured, allowing the application
 * to run in demo/simulation mode without build or runtime crashes.
 */
function createDbClient() {
  if (!isDbConfigured()) {
    return null;
  }

  try {
    const sql = neon(process.env.DATABASE_URL!);
    return drizzle({ client: sql, schema });
  } catch (error) {
    console.warn("Failed to initialize Neon PostgreSQL client:", error);
    return null;
  }
}

export const db = createDbClient();

/**
 * Safe accessor for the database client.
 * Returns { db, isConfigured }
 */
export function getDb() {
  if (!isDbConfigured()) {
    return { db: null, isConfigured: false };
  }
  return { db: createDbClient(), isConfigured: true };
}

export * from "./schema";
