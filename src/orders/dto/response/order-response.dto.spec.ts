import { OrderResponseDto } from './order-response.dto.js';

describe('OrderResponseDto', () => {
  it('expone los campos del contrato de la orden', () => {
    const datetime = new Date('2023-07-12T12:31:20');
    const order = {
      id: 9,
      userId: 1,
      instrumentId: 47,
      side: 'BUY',
      type: 'LIMIT',
      size: 10,
      price: 930.5,
      status: 'NEW',
      datetime,
    } as const;

    expect(OrderResponseDto.from(order)).toEqual(order);
  });
});
