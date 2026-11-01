import { escapeLike } from './escape-like.js';

describe('escapeLike', () => {
  it('no modifica un texto sin caracteres especiales', () => {
    expect(escapeLike('galicia')).toBe('galicia');
  });

  it('escapa los comodines % y _', () => {
    expect(escapeLike('50%_off')).toBe('50\\%\\_off');
  });

  it('escapa la barra invertida', () => {
    expect(escapeLike('a\\b')).toBe('a\\\\b');
  });
});
