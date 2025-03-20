import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../shared/schema';

// Create PostgreSQL pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Create drizzle database instance
export const db = drizzle(pool, { schema });

// Export pool for use in other places
export { pool };