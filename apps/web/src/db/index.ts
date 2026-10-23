import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

export function isDbConfigured(): boolean {
  const url = process.env.DATABASE_URL;
  return Boolean(
    url &&
    (url.startsWith('postgres://') || url.startsWith('postgresql://')) &&
    !url.includes('placeholder'),
  );
}

function createDbClient() {
  if (!isDbConfigured()) {
    return null;
  }

  try {
    const sql = neon(process.env.DATABASE_URL!);
    return drizzle({ client: sql, schema });
  } catch (error) {
    console.warn('Failed to initialize Neon PostgreSQL client:', error);
    return null;
  }
}

export const db = createDbClient();

export function getDb() {
  if (!isDbConfigured()) {
    return { db: null, isConfigured: false };
  }
  return { db: createDbClient(), isConfigured: true };
}

export * from './schema';
