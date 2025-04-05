import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg'; // Use default import for pg
const { Pool } = pg; // Destructure Pool from the default import
import * as schema from './schema';

// Construct the connection string from individual environment variables
const connectionString = `postgresql://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT}/${process.env.POSTGRES_DB}`;

// Pool manages connections automatically, avoiding top-level await issues
const pool = new Pool({
  connectionString: connectionString,
});

// Pass the pool to Drizzle
export const db = drizzle(pool, { schema });
