import pkg from 'pg';
import { createApp } from './app.js';
import { createGoClient } from './clients/goClient.js';
import { config } from './config.js';
const { Pool } = pkg;

// Database connection pool
const pool = new Pool({
  connectionString: config.databaseUrl,
  connectionTimeoutMillis: 3000,
});

pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

// The pool discards broken idle clients and reconnects on the next query,
// so a database restart shouldn't take the whole service down.
pool.on('error', (err) => {
  console.error('Unexpected error on idle database client', err);
});

const go = createGoClient({
  baseUrl: config.goServiceUrl,
  timeoutMs: config.goServiceTimeoutMs,
});

createApp({ pool, go }).listen(config.port, () => {
  console.log(`Node.js service running on port ${config.port}`);
  console.log(`Using Go analytics service at ${config.goServiceUrl}`);
});
