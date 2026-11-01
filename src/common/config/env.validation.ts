const OPTIONAL_POSITIVE_INTEGERS = [
  'PORT',
  'DATABASE_POOL_MAX',
  'DATABASE_POOL_MIN',
  'DATABASE_POOL_IDLE_TIMEOUT_MS',
  'DATABASE_POOL_CONNECT_TIMEOUT_MS',
  'RATE_LIMIT_TTL_MS',
  'RATE_LIMIT_MAX_REQUESTS',
];

const isUnset = (value: unknown) => value === undefined || value === '';

export function validateEnv(config: Record<string, unknown>) {
  const uri = config.DATABASE_URI;
  const isPostgresUri =
    typeof uri === 'string' && /^postgres(ql)?:\/\/.+/.test(uri);

  if (!isPostgresUri) {
    throw new Error(
      'DATABASE_URI es obligatoria y debe ser una URI de PostgreSQL (postgresql://...)',
    );
  }

  for (const name of OPTIONAL_POSITIVE_INTEGERS) {
    const value = config[name];
    if (
      !isUnset(value) &&
      !(typeof value === 'string' && /^[1-9]\d*$/.test(value))
    ) {
      throw new Error(`${name} debe ser un entero positivo`);
    }
  }

  const max = Number(config.DATABASE_POOL_MAX);
  const min = Number(config.DATABASE_POOL_MIN);
  if (
    !isUnset(config.DATABASE_POOL_MAX) &&
    !isUnset(config.DATABASE_POOL_MIN) &&
    min > max
  ) {
    throw new Error(
      'DATABASE_POOL_MIN no puede ser mayor que DATABASE_POOL_MAX',
    );
  }

  if (!isUnset(config.PORT) && Number(config.PORT) > 65535) {
    throw new Error('PORT debe estar entre 1 y 65535');
  }

  return config;
}
