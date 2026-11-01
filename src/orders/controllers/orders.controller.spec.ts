import type { Order } from '../../core/models/order.model.js';
import type { OrdersService } from '../services/orders.service.js';
import { OrdersController } from './orders.controller.js';

const order: Order = {
  id: 9,
  userId: 1,
  instrumentId: 47,
  side: 'BUY',
  type: 'MARKET',
  size: 10,
  price: 100,
  status: 'FILLED',
  datetime: new Date('2023-07-12T12:31:20'),
};

describe('OrdersController', () => {
  const build = () => {
    const service = {
      placeOrder: vi.fn().mockResolvedValue(order),
      placeCashMovement: vi.fn().mockResolvedValue(order),
    };

    return {
      service,
      controller: new OrdersController(service as unknown as OrdersService),
    };
  };

  it('delega el envío de una orden y responde con el contrato', async () => {
    const { controller, service } = build();
    const dto = {
      userId: 1,
      instrumentId: 47,
      side: 'BUY',
      type: 'MARKET',
      size: 10,
    } as const;

    await expect(controller.create(dto)).resolves.toEqual(order);
    expect(service.placeOrder).toHaveBeenCalledWith(dto);
  });

  it('delega el movimiento de efectivo', async () => {
    const { controller, service } = build();
    const dto = { userId: 1, side: 'CASH_IN', amount: 1000 } as const;

    await expect(controller.createCash(dto)).resolves.toEqual(order);
    expect(service.placeCashMovement).toHaveBeenCalledWith(dto);
  });
});
