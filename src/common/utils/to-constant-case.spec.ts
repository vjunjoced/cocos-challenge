import { toConstantCase } from './to-constant-case.js';

describe('toConstantCase', () => {
  it('convierte camelCase a SNAKE_CASE en mayúsculas', () => {
    expect(toConstantCase('isNotEmpty')).toBe('IS_NOT_EMPTY');
    expect(toConstantCase('maxLength')).toBe('MAX_LENGTH');
  });

  it('mantiene una sola palabra', () => {
    expect(toConstantCase('min')).toBe('MIN');
  });
});
