import dotenv from 'dotenv';

dotenv.config();

// Accepts a full URL, a bare host, or a Render service name (which Render
// injects via `fromService.property: host`) and returns a full base URL.
export function normalizeServiceUrl(value: string | undefined, fallback: string): string {
  if (!value) return fallback;
  if (value.startsWith('http://') || value.startsWith('https://')) return value.replace(/\/+$/, '');
  if (!value.includes('.')) return `https://${value}.onrender.com`;
  return `https://${value}`;
}

export const config = {
  port: Number(process.env.PORT) || 3001,
  databaseUrl: process.env.DATABASE_URL,
  goServiceUrl: normalizeServiceUrl(process.env.GO_SERVICE_URL, 'http://localhost:3002'),
  goServiceTimeoutMs: Number(process.env.GO_SERVICE_TIMEOUT_MS) || 3000,
};
