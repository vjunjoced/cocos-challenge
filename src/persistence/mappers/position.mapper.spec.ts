import { Decimal } from 'decimal.js';
import { toPositionEntity, toPositionModel } from './position.mapper.js';

describe('position mapper', () => {
  it('convierte la entidad (numeric como string) a Decimal exacto', () => {
    const position = toPositionModel({
      userId: 1,
      instrumentId: 47,
      quantity: '40.00',
      cost: '37200.123456',
      updatedAt: new Date(),
    });

    expect(position.instrumentId).toBe(47);
    expect(position.quantity.toNumber()).toBe(40);
    expect(position.cost.toString()).toBe('37200.123456');
  });

  it('convierte el modelo a entidad con la escala de las columnas', () => {
    const updatedAt = new Date('2023-07-12T12:00:00');

    expect(
      toPositionEntity(
        1,
        {
          instrumentId: 47,
          quantity: new Decimal('7222.45'),
          cost: new Decimal(840),
        },
        updatedAt,
      ),
    ).toEqual({
      userId: 1,
      instrumentId: 47,
      quantity: '7222.45',
      cost: '840.000000',
      updatedAt,
    });
  });
});
