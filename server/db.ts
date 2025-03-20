const { drizzle } = require('drizzle-orm/node-postgres');
const { Pool } = require('pg');
const schema = require('../shared/schema');

// Create PostgreSQL pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Create drizzle database instance
const db = drizzle(pool, { schema });

// Export for use in other places
module.exports = { db, pool };