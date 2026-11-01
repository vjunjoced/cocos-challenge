import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { toValidationDetails } from '../../../common/mappers/validation-details.mapper.js';
import { CreateOrderDto } from './create-order.dto.js';

const valid = {
  userId: 1,
  instrumentId: 47,
  side: 'BUY',
  type: 'MARKET',
  size: 10,
};

const details = async (overrides: object) =>
  toValidationDetails(
    await validate(plainToInstance(CreateOrderDto, { ...valid, ...overrides })),
  );

describe('CreateOrderDto', () => {
  it('acepta una orden MARKET por cantidad de acciones', async () => {
    await expect(details({})).resolves.toEqual([]);
  });

  it('acepta una orden MARKET por monto en pesos', async () => {
    await expect(details({ size: undefined, amount: 1500.5 })).resolves.toEqual(
      [],
    );
  });

  it('acepta una orden LIMIT con precio', async () => {
    await expect(details({ type: 'LIMIT', price: 930.25 })).resolves.toEqual(
      [],
    );
  });

  it('exige el precio en una orden LIMIT', async () => {
    const result = await details({ type: 'LIMIT' });

    expect(result).toContainEqual({ field: 'price', code: 'IS_NUMBER' });
    expect(result.every((detail) => detail.field === 'price')).toBe(true);
  });

  it('rechaza el precio en una orden MARKET', async () => {
    await expect(details({ price: 930 })).resolves.toEqual([
      { field: 'price', code: 'IS_ABSENT_WHEN' },
    ]);
  });

  it('exige size o amount', async () => {
    const result = await details({ size: undefined });

    expect(result).toContainEqual({ field: 'size', code: 'IS_INT' });
  });

  it('rechaza enviar size y amount a la vez', async () => {
    await expect(details({ amount: 1000 })).resolves.toEqual([
      { field: 'amount', code: 'IS_ABSENT_WHEN' },
    ]);
  });

  it.each(['CASH_IN', 'CASH_OUT', 'HOLD'])('rechaza side %s', async (side) => {
    await expect(details({ side })).resolves.toEqual([
      { field: 'side', code: 'IS_IN' },
    ]);
  });

  it('rechaza un type desconocido', async () => {
    await expect(details({ type: 'STOP' })).resolves.toEqual([
      { field: 'type', code: 'IS_IN' },
    ]);
  });

  it.each([0, -1, 1.5, '3'])('rechaza size %j', async (size) => {
    const result = await details({ size });

    expect(result.every((detail) => detail.field === 'size')).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it('rechaza un monto con más de 2 decimales', async () => {
    await expect(details({ size: undefined, amount: 10.123 })).resolves.toEqual(
      [{ field: 'amount', code: 'IS_NUMBER' }],
    );
  });

  it.each([0, -5])('rechaza userId e instrumentId %j', async (value) => {
    const result = await details({ userId: value, instrumentId: value });

    expect(result).toEqual([
      { field: 'userId', code: 'MIN' },
      { field: 'instrumentId', code: 'MIN' },
    ]);
  });
});
