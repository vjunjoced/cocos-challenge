export interface PoolConfig {
  max: number;
  min: number;
  idleTimeoutMs: number;
  connectTimeoutMs: number;
}

export interface DatabaseConfig {
  uri: string;
  pool: PoolConfig;
}

export interface RateLimitConfig {
  ttlMs: number;
  maxRequests: number;
}

export interface AppConfig {
  port: number;
  database: DatabaseConfig;
  rateLimit: RateLimitConfig;
}

const toNumber = (value: string | undefined, fallback: number) =>
  value === undefined || value === '' ? fallback : Number(value);

export default (): AppConfig => ({
  port: toNumber(process.env.PORT, 3000),
  database: {
    uri: process.env.DATABASE_URI ?? '',
    pool: {
      max: toNumber(process.env.DATABASE_POOL_MAX, 10),
      min: toNumber(process.env.DATABASE_POOL_MIN, 2),
      idleTimeoutMs: toNumber(
        process.env.DATABASE_POOL_IDLE_TIMEOUT_MS,
        30_000,
      ),
      connectTimeoutMs: toNumber(
        process.env.DATABASE_POOL_CONNECT_TIMEOUT_MS,
        5_000,
      ),
    },
  },
  rateLimit: {
    ttlMs: toNumber(process.env.RATE_LIMIT_TTL_MS, 60_000),
    maxRequests: toNumber(process.env.RATE_LIMIT_MAX_REQUESTS, 100),
  },
});
