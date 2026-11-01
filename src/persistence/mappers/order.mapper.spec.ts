import type { OrderEntity } from '../entities/order.entity.js';
import { toOrder, toOrderEntity } from './order.mapper.js';

describe('toOrder', () => {
  it('convierte la entidad al modelo y el precio numeric (string) a número', () => {
    const datetime = new Date('2023-07-12T12:31:20');
    const entity: OrderEntity = {
      id: 2,
      instrumentId: 47,
      userId: 1,
      size: 50,
      price: '930.50',
      type: 'MARKET',
      side: 'BUY',
      status: 'FILLED',
      datetime,
    };

    expect(toOrder(entity)).toEqual({
      id: 2,
      instrumentId: 47,
      userId: 1,
      size: 50,
      price: 930.5,
      type: 'MARKET',
      side: 'BUY',
      status: 'FILLED',
      datetime,
    });
  });
});

describe('toOrderEntity', () => {
  it('convierte el precio a string con 2 decimales y agrega la fecha', () => {
    const datetime = new Date('2023-07-12T12:31:20');

    expect(
      toOrderEntity(
        {
          instrumentId: 47,
          userId: 1,
          size: 10,
          price: 930.5,
          type: 'LIMIT',
          side: 'BUY',
          status: 'NEW',
        },
        datetime,
      ),
    ).toEqual({
      instrumentId: 47,
      userId: 1,
      size: 10,
      price: '930.50',
      type: 'LIMIT',
      side: 'BUY',
      status: 'NEW',
      datetime,
    });
  });
});
