import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  user: process.env.POSTGRES_USER || "finbits",
  host: process.env.POSTGRES_HOST || "localhost",
  database: process.env.POSTGRES_DB || "finbits_db",
  password: process.env.POSTGRES_PASSWORD || "finbits_password",
  port: parseInt(process.env.POSTGRES_PORT || "5433"),
  connectionTimeoutMillis: 5000
});

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err);
});

export const query = async (text: string, params?: any[]) => {
  try {
    const res = await pool.query(text, params);
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    console.error('Failed query:', { text, params });
    throw error;
  }
};

export const getClient = () => {
  return pool.connect();
};
