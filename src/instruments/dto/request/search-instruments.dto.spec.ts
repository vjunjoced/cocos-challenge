import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SearchInstrumentsDto } from './search-instruments.dto.js';

const check = (plain: object) =>
  validate(plainToInstance(SearchInstrumentsDto, plain));

describe('SearchInstrumentsDto', () => {
  it('acepta un texto de búsqueda válido', async () => {
    await expect(check({ q: 'galicia' })).resolves.toHaveLength(0);
  });

  it('rechaza q ausente', async () => {
    await expect(check({})).resolves.not.toHaveLength(0);
  });

  it('rechaza q vacío o solo espacios', async () => {
    await expect(check({ q: '   ' })).resolves.not.toHaveLength(0);
  });

  it('rechaza q de más de 50 caracteres', async () => {
    await expect(check({ q: 'a'.repeat(51) })).resolves.not.toHaveLength(0);
  });

  it('recorta los espacios alrededor de q', () => {
    expect(plainToInstance(SearchInstrumentsDto, { q: '  ggal ' }).q).toBe(
      'ggal',
    );
  });
});
