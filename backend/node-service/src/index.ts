import express, { type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pkg from 'pg';
const { Pool } = pkg;

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3001;

interface DataItem {
  id: number;
  name: string;
  type: string;
  description: string | null;
  created_at: Date;
}

// Database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Test database connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'node-service',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/node/hello', (_req, res) => {
  res.json({
    message: 'Hello from Node.js service!',
    version: '1.0.0'
  });
});

app.get('/api/node/data', async (_req, res) => {
  try {
    const result = await pool.query<DataItem>(
      "SELECT id, name, type, description, created_at FROM items WHERE type = 'node' ORDER BY id"
    );
    res.json({
      data: result.rows
    });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Failed to fetch data from database' });
  }
});

// Error handling
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Node.js service running on port ${PORT}`);
});
