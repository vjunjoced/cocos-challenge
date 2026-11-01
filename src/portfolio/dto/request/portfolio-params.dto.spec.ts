import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PortfolioParamsDto } from './portfolio-params.dto.js';

const check = (plain: object) =>
  validate(plainToInstance(PortfolioParamsDto, plain));

describe('PortfolioParamsDto', () => {
  it('acepta un id numérico positivo y lo convierte a número', async () => {
    const dto = plainToInstance(PortfolioParamsDto, { userId: '1' });

    expect(dto.userId).toBe(1);
    await expect(check({ userId: '1' })).resolves.toHaveLength(0);
  });

  it.each(['abc', '0', '-3', '1.5', ''])(
    'rechaza userId %j',
    async (userId) => {
      await expect(check({ userId })).resolves.not.toHaveLength(0);
    },
  );
});
