import configuration from './configuration.js';

describe('configuration', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('agrupa la configuración de base de datos en un objeto', () => {
    vi.stubEnv('DATABASE_URI', 'postgresql://user:pass@localhost:5432/db');

    expect(configuration().database).toEqual({
      uri: 'postgresql://user:pass@localhost:5432/db',
      pool: {
        max: 10,
        min: 2,
        idleTimeoutMs: 30_000,
        connectTimeoutMs: 5_000,
      },
    });
  });

  it('toma los valores del pool desde las variables de entorno', () => {
    vi.stubEnv('DATABASE_POOL_MAX', '20');
    vi.stubEnv('DATABASE_POOL_MIN', '5');
    vi.stubEnv('DATABASE_POOL_IDLE_TIMEOUT_MS', '60000');
    vi.stubEnv('DATABASE_POOL_CONNECT_TIMEOUT_MS', '1000');

    expect(configuration().database.pool).toEqual({
      max: 20,
      min: 5,
      idleTimeoutMs: 60_000,
      connectTimeoutMs: 1_000,
    });
  });

  it('usa los valores por defecto del rate limit', () => {
    expect(configuration().rateLimit).toEqual({
      ttlMs: 60_000,
      maxRequests: 100,
    });
  });

  it('toma el rate limit desde las variables de entorno', () => {
    vi.stubEnv('RATE_LIMIT_TTL_MS', '1000');
    vi.stubEnv('RATE_LIMIT_MAX_REQUESTS', '5');

    expect(configuration().rateLimit).toEqual({ ttlMs: 1_000, maxRequests: 5 });
  });

  it('usa el puerto 3000 por defecto', () => {
    expect(configuration().port).toBe(3000);
  });

  it('toma el puerto desde la variable PORT', () => {
    vi.stubEnv('PORT', '4000');

    expect(configuration().port).toBe(4000);
  });
});
