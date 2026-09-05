import { neon } from '@neondatabase/serverless';
import { drizzle, NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from './schema';
import { Logger } from '@iptv-menu/logging';

const logger = new Logger('neon-db');

let dbInstance: NeonHttpDatabase<typeof schema> | null = null;

export function getDb(): NeonHttpDatabase<typeof schema> {
  if (dbInstance) return dbInstance;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    logger.warn('DATABASE_URL environment variable is missing. Neon queries will fail without it.');
  }

  const sql = neon(connectionString || 'postgresql://placeholder:placeholder@ep-sample.us-east-2.aws.neon.tech/neondb');
  dbInstance = drizzle(sql, { schema });
  return dbInstance;
}

export { schema };
