import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import * as schema from './shared/schema';

async function main() {
  console.log('Setting up database...');
  
  try {
    // Create PostgreSQL pool
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });

    // Create drizzle database instance
    const db = drizzle(pool, { schema });

    // Push all schema changes to the database
    console.log('Pushing schema to database...');
    // In a real migration we would use migrate(), but for now we'll manually create tables

    // Create the permission enum type
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'permission') THEN
          CREATE TYPE permission AS ENUM ('read', 'write', 'admin');
        END IF;
      END$$;
    `);

    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        device_id TEXT,
        blockchain_address TEXT,
        stripe_customer_id TEXT,
        stripe_subscription_id TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create immutability_records table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS immutability_records (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        code_hash TEXT NOT NULL UNIQUE,
        blockchain_tx_id TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        last_verified TIMESTAMP
      );
    `);

    // Create security_logs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS security_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        event TEXT NOT NULL,
        details JSONB DEFAULT '{}',
        ip_address TEXT,
        device_id TEXT,
        severity TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create access_control table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS access_control (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        resource_id TEXT NOT NULL,
        permission permission NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create file_integrity table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS file_integrity (
        id SERIAL PRIMARY KEY,
        file_path TEXT NOT NULL UNIQUE,
        file_hash TEXT NOT NULL,
        last_modified TIMESTAMP DEFAULT NOW(),
        size INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'valid',
        blockchain_tx_id TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log('Database setup completed successfully');

    // Create a test user if one doesn't exist
    const [existingUser] = await db.select().from(schema.users).where(schema.users.username === 'admin');
    
    if (!existingUser) {
      console.log('Creating test user...');
      await db.insert(schema.users).values({
        username: 'admin',
        email: 'admin@example.com',
        blockchainAddress: '0x0000000000000000000000000000000000000000'
      });
      console.log('Test user created');
    }

    await pool.end();
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  }
}

main();