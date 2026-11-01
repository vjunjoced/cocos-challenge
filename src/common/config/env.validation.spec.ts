import { validateEnv } from './env.validation.js';

describe('validateEnv', () => {
  it('acepta una URI de PostgreSQL válida', () => {
    const config = { DATABASE_URI: 'postgresql://user:pass@localhost:5432/db' };

    expect(validateEnv(config)).toEqual(config);
  });

  it('acepta el esquema corto postgres://', () => {
    expect(() =>
      validateEnv({ DATABASE_URI: 'postgres://user:pass@localhost:5432/db' }),
    ).not.toThrow();
  });

  it('falla si DATABASE_URI no está definida', () => {
    expect(() => validateEnv({})).toThrow('DATABASE_URI');
  });

  it('falla si DATABASE_URI no es una URI de PostgreSQL', () => {
    expect(() =>
      validateEnv({ DATABASE_URI: 'mysql://user:pass@localhost:3306/db' }),
    ).toThrow('DATABASE_URI');
  });

  it('acepta las variables opcionales del pool cuando son enteros positivos', () => {
    expect(() =>
      validateEnv({
        DATABASE_URI: 'postgresql://user:pass@localhost:5432/db',
        DATABASE_POOL_MAX: '20',
        DATABASE_POOL_MIN: '5',
      }),
    ).not.toThrow();
  });

  it('falla si una variable del pool no es un entero positivo', () => {
    expect(() =>
      validateEnv({
        DATABASE_URI: 'postgresql://user:pass@localhost:5432/db',
        DATABASE_POOL_MAX: 'abc',
      }),
    ).toThrow('DATABASE_POOL_MAX');
  });

  it('falla si el mínimo del pool es mayor que el máximo', () => {
    expect(() =>
      validateEnv({
        DATABASE_URI: 'postgresql://user:pass@localhost:5432/db',
        DATABASE_POOL_MAX: '5',
        DATABASE_POOL_MIN: '10',
      }),
    ).toThrow('DATABASE_POOL_MIN');
  });

  it('falla si una variable del rate limit no es un entero positivo', () => {
    expect(() =>
      validateEnv({
        DATABASE_URI: 'postgresql://user:pass@localhost:5432/db',
        RATE_LIMIT_MAX_REQUESTS: '0',
      }),
    ).toThrow('RATE_LIMIT_MAX_REQUESTS');
  });

  it('falla si PORT no es un entero positivo', () => {
    expect(() =>
      validateEnv({
        DATABASE_URI: 'postgresql://user:pass@localhost:5432/db',
        PORT: 'abc',
      }),
    ).toThrow('PORT');
  });

  it('falla si PORT supera 65535', () => {
    expect(() =>
      validateEnv({
        DATABASE_URI: 'postgresql://user:pass@localhost:5432/db',
        PORT: '70000',
      }),
    ).toThrow('PORT');
  });
});
