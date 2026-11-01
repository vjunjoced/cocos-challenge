import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { toValidationDetails } from '../../../common/mappers/validation-details.mapper.js';
import { CreateCashMovementDto } from './create-cash-movement.dto.js';

const valid = { userId: 1, side: 'CASH_IN', amount: 1000 };

const details = async (overrides: object) =>
  toValidationDetails(
    await validate(
      plainToInstance(CreateCashMovementDto, { ...valid, ...overrides }),
    ),
  );

describe('CreateCashMovementDto', () => {
  it.each(['CASH_IN', 'CASH_OUT'])('acepta side %s', async (side) => {
    await expect(details({ side })).resolves.toEqual([]);
  });

  it.each(['BUY', 'SELL', 'X'])('rechaza side %s', async (side) => {
    await expect(details({ side })).resolves.toEqual([
      { field: 'side', code: 'IS_IN' },
    ]);
  });

  it.each([0, -5, 10.5, '100'])('rechaza amount %j', async (amount) => {
    const result = await details({ amount });

    expect(result.length).toBeGreaterThan(0);
    expect(result.every((detail) => detail.field === 'amount')).toBe(true);
  });

  it('rechaza un amount mayor al máximo de la columna', async () => {
    await expect(details({ amount: 2_147_483_648 })).resolves.toEqual([
      { field: 'amount', code: 'MAX' },
    ]);
  });

  it('rechaza un userId inválido', async () => {
    await expect(details({ userId: 0 })).resolves.toEqual([
      { field: 'userId', code: 'MIN' },
    ]);
  });
});
