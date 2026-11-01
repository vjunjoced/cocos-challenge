import { NotFoundError } from '../../common/errors/not-found.error.js';
import { ValidationFailedError } from '../../common/errors/validation-failed.error.js';
import type { Instrument } from '../../core/models/instrument.model.js';
import type { LatestPrice } from '../../core/models/latest-price.model.js';
import type { NewOrder } from '../../core/models/new-order.model.js';
import type { Order } from '../../core/models/order.model.js';
import type { IUserOrdersScope } from '../../core/repositories/user-orders-scope.js';
import type { OrderRequest } from '../models/order-request.model.js';
import { OrdersService } from './orders.service.js';

const datetime = new Date('2023-07-12T12:31:20');

const filled = (overrides: Partial<Order>): Order => ({
  id: 1,
  userId: 1,
  instrumentId: 66,
  side: 'CASH_IN',
  type: 'MARKET',
  size: 1_000,
  price: 1,
  status: 'FILLED',
  datetime,
  ...overrides,
});

const PAMP: Instrument = {
  id: 47,
  ticker: 'PAMP',
  name: 'Pampa Holding',
  type: 'ACCIONES',
};
const CASH: Instrument = {
  id: 66,
  ticker: 'ARS',
  name: 'Pesos',
  type: 'MONEDA',
};

const marketBuy: OrderRequest = {
  userId: 1,
  instrumentId: 47,
  side: 'BUY',
  type: 'MARKET',
  size: 5,
};

describe('OrdersService', () => {
  const build = (
    overrides: {
      userExists?: boolean;
      history?: Order[];
      instruments?: Instrument[];
      prices?: LatestPrice[];
    } = {},
  ) => {
    const saved: NewOrder[] = [];
    const scope: IUserOrdersScope = {
      findFilledHistory: () => Promise.resolve(overrides.history ?? []),
      save: (order) => {
        saved.push(order);
        return Promise.resolve({ ...order, id: 99, datetime });
      },
    };
    const users = {
      exists: vi.fn().mockResolvedValue(overrides.userExists ?? true),
    };
    const orders = {
      findFilledByUser: vi.fn(),
      withUserLock: vi.fn(
        (_userId: number, work: (s: IUserOrdersScope) => Promise<unknown>) =>
          work(scope),
      ),
    };
    const marketData = {
      findLatestPrices: vi
        .fn()
        .mockResolvedValue(
          overrides.prices ?? [
            { instrumentId: 47, close: 100, previousClose: 98 },
          ],
        ),
    };
    const instruments = {
      search: vi.fn(),
      findByIds: vi.fn().mockResolvedValue(overrides.instruments ?? [PAMP]),
    };
    const service = new OrdersService(
      users,
      orders as never,
      marketData,
      instruments,
    );

    return { service, users, orders, marketData, instruments, saved };
  };

  describe('placeOrder', () => {
    it('ejecuta una MARKET con saldo al último close y la guarda FILLED', async () => {
      const { service, saved, orders } = build({ history: [filled({})] });

      const result = await service.placeOrder(marketBuy);

      expect(orders.withUserLock).toHaveBeenCalledWith(1, expect.any(Function));
      expect(saved).toEqual([
        {
          userId: 1,
          instrumentId: 47,
          side: 'BUY',
          type: 'MARKET',
          size: 5,
          price: 100,
          status: 'FILLED',
        },
      ]);
      expect(result).toEqual(
        expect.objectContaining({ id: 99, status: 'FILLED' }),
      );
    });

    it('guarda como REJECTED, al precio de ejecución, una compra sin saldo', async () => {
      const { service, saved } = build({ history: [filled({ size: 100 })] });

      await service.placeOrder(marketBuy);

      expect(saved).toEqual([
        expect.objectContaining({ status: 'REJECTED', price: 100, size: 5 }),
      ]);
    });

    it('deja una LIMIT en NEW al precio enviado y no consulta el mercado', async () => {
      const { service, saved, marketData } = build({ history: [filled({})] });

      await service.placeOrder({ ...marketBuy, type: 'LIMIT', price: 90 });

      expect(saved).toEqual([
        expect.objectContaining({ status: 'NEW', price: 90, type: 'LIMIT' }),
      ]);
      expect(marketData.findLatestPrices).not.toHaveBeenCalled();
    });

    it('calcula las acciones a partir del monto', async () => {
      const { service, saved } = build({ history: [filled({})] });

      await service.placeOrder({
        userId: 1,
        instrumentId: 47,
        side: 'BUY',
        type: 'MARKET',
        amount: 350,
      });

      expect(saved).toEqual([
        expect.objectContaining({ size: 3, status: 'FILLED' }),
      ]);
    });

    it('rechaza una venta de acciones que no se tienen', async () => {
      const { service, saved } = build({ history: [filled({})] });

      await service.placeOrder({ ...marketBuy, side: 'SELL' });

      expect(saved).toEqual([expect.objectContaining({ status: 'REJECTED' })]);
    });

    it('lanza USER_NOT_FOUND y no guarda si el usuario no existe', async () => {
      const { service, saved, orders } = build({ userExists: false });

      await expect(service.placeOrder(marketBuy)).rejects.toThrow(
        NotFoundError,
      );
      expect(orders.withUserLock).not.toHaveBeenCalled();
      expect(saved).toEqual([]);
    });

    it('lanza INSTRUMENT_NOT_FOUND si el instrumento no existe', async () => {
      const { service, saved } = build({ instruments: [] });

      await expect(service.placeOrder(marketBuy)).rejects.toMatchObject({
        code: 'INSTRUMENT_NOT_FOUND',
      });
      expect(saved).toEqual([]);
    });

    it('rechaza operar el instrumento de efectivo con 400', async () => {
      const { service } = build({ instruments: [CASH] });

      await expect(
        service.placeOrder({ ...marketBuy, instrumentId: 66 }),
      ).rejects.toThrow(ValidationFailedError);
    });

    it('lanza PRICE_NOT_FOUND en una MARKET sin precio de mercado', async () => {
      const { service, saved } = build({ prices: [] });

      await expect(service.placeOrder(marketBuy)).rejects.toMatchObject({
        code: 'PRICE_NOT_FOUND',
      });
      expect(saved).toEqual([]);
    });
  });

  describe('placeCashMovement', () => {
    it('guarda un ingreso como FILLED en el instrumento de efectivo', async () => {
      const { service, saved } = build();

      await service.placeCashMovement({
        userId: 1,
        side: 'CASH_IN',
        amount: 5_000,
      });

      expect(saved).toEqual([
        {
          userId: 1,
          instrumentId: 66,
          side: 'CASH_IN',
          type: 'MARKET',
          size: 5_000,
          price: 1,
          status: 'FILLED',
        },
      ]);
    });

    it('guarda como REJECTED un retiro mayor al saldo', async () => {
      const { service, saved } = build({ history: [filled({ size: 100 })] });

      await service.placeCashMovement({
        userId: 1,
        side: 'CASH_OUT',
        amount: 101,
      });

      expect(saved).toEqual([expect.objectContaining({ status: 'REJECTED' })]);
    });

    it('lanza USER_NOT_FOUND si el usuario no existe', async () => {
      const { service } = build({ userExists: false });

      await expect(
        service.placeCashMovement({ userId: 1, side: 'CASH_IN', amount: 1 }),
      ).rejects.toThrow(NotFoundError);
    });
  });
});
