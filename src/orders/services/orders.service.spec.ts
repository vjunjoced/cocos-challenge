import { Decimal } from 'decimal.js';
import { NotFoundError } from '../../common/errors/not-found.error.js';
import { ValidationFailedError } from '../../common/errors/validation-failed.error.js';
import type { Instrument } from '../../core/models/instrument.model.js';
import type { LatestPrice } from '../../core/models/latest-price.model.js';
import type { NewOrder } from '../../core/models/new-order.model.js';
import type { Position } from '../../core/models/position.model.js';
import type { IUserOrdersScope } from '../../core/repositories/user-orders-scope.js';
import type { OrderRequest } from '../models/order-request.model.js';
import { OrdersService } from './orders.service.js';

const datetime = new Date('2023-07-12T12:31:20');

const position = (
  instrumentId: number,
  quantity: number | string,
  cost: number | string = 0,
): Position => ({
  instrumentId,
  quantity: new Decimal(quantity),
  cost: new Decimal(cost),
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
      positions?: Position[];
      instruments?: Instrument[];
      prices?: LatestPrice[];
    } = {},
  ) => {
    const positions = new Map<number, Position>(
      (overrides.positions ?? []).map((p) => [p.instrumentId, p]),
    );
    const savedOrders: NewOrder[] = [];
    const deleted: number[] = [];
    const scope: IUserOrdersScope = {
      findPosition: (instrumentId) =>
        Promise.resolve(positions.get(instrumentId) ?? null),
      savePosition: (p) => {
        positions.set(p.instrumentId, p);
        return Promise.resolve();
      },
      deletePosition: (instrumentId) => {
        positions.delete(instrumentId);
        deleted.push(instrumentId);
        return Promise.resolve();
      },
      saveOrder: (order) => {
        savedOrders.push(order);
        return Promise.resolve({ ...order, id: 99, datetime });
      },
    };
    const users = {
      exists: vi.fn().mockResolvedValue(overrides.userExists ?? true),
      createWithPositions: vi.fn(),
    };
    const orders = {
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

    return {
      service,
      users,
      orders,
      marketData,
      savedOrders,
      deleted,
      positions,
    };
  };

  describe('placeOrder', () => {
    it('ejecuta una MARKET con saldo al último close y actualiza efectivo y tenencia', async () => {
      const { service, savedOrders, positions, orders } = build({
        positions: [position(66, 1_000)],
      });

      const result = await service.placeOrder(marketBuy);

      expect(orders.withUserLock).toHaveBeenCalledWith(1, expect.any(Function));
      expect(savedOrders).toEqual([
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
      expect(positions.get(66)?.quantity.toNumber()).toBe(500);
      expect(positions.get(47)?.quantity.toNumber()).toBe(5);
      expect(positions.get(47)?.cost.toNumber()).toBe(500);
    });

    it('guarda como REJECTED, sin tocar las posiciones, una compra sin saldo', async () => {
      const { service, savedOrders, positions } = build({
        positions: [position(66, 100)],
      });

      await service.placeOrder(marketBuy);

      expect(savedOrders).toEqual([
        expect.objectContaining({ status: 'REJECTED', price: 100, size: 5 }),
      ]);
      expect(positions.get(66)?.quantity.toNumber()).toBe(100);
      expect(positions.has(47)).toBe(false);
    });

    it('deja una LIMIT en NEW al precio enviado, sin tocar posiciones ni consultar el mercado', async () => {
      const { service, savedOrders, positions, marketData } = build({
        positions: [position(66, 1_000)],
      });

      await service.placeOrder({ ...marketBuy, type: 'LIMIT', price: 90 });

      expect(savedOrders).toEqual([
        expect.objectContaining({ status: 'NEW', price: 90, type: 'LIMIT' }),
      ]);
      expect(positions.get(66)?.quantity.toNumber()).toBe(1_000);
      expect(marketData.findLatestPrices).not.toHaveBeenCalled();
    });

    it('calcula las acciones a partir del monto', async () => {
      const { service, savedOrders } = build({
        positions: [position(66, 1_000)],
      });

      await service.placeOrder({
        userId: 1,
        instrumentId: 47,
        side: 'BUY',
        type: 'MARKET',
        amount: 350,
      });

      expect(savedOrders).toEqual([
        expect.objectContaining({ size: 3, status: 'FILLED' }),
      ]);
    });

    it('vende y reduce la tenencia con el costo proporcional', async () => {
      const { service, positions, deleted } = build({
        positions: [position(66, 0), position(47, 10, 800)],
      });

      await service.placeOrder({ ...marketBuy, side: 'SELL', size: 4 });

      expect(positions.get(66)?.quantity.toNumber()).toBe(400);
      expect(positions.get(47)?.quantity.toNumber()).toBe(6);
      expect(positions.get(47)?.cost.toNumber()).toBe(480);
      expect(deleted).toEqual([]);
    });

    it('elimina la fila del activo en una venta total, y nunca la del efectivo', async () => {
      const { service, positions, deleted } = build({
        positions: [position(66, 0), position(47, 5, 400)],
      });

      await service.placeOrder({ ...marketBuy, side: 'SELL' });

      expect(deleted).toEqual([47]);
      expect(positions.has(47)).toBe(false);
      expect(positions.get(66)?.quantity.toNumber()).toBe(500);
    });

    it('rechaza una venta de acciones que no se tienen', async () => {
      const { service, savedOrders } = build({
        positions: [position(66, 1_000)],
      });

      await service.placeOrder({ ...marketBuy, side: 'SELL' });

      expect(savedOrders).toEqual([
        expect.objectContaining({ status: 'REJECTED' }),
      ]);
    });

    it('trata como saldo 0 un usuario sin fila de efectivo', async () => {
      const { service, savedOrders } = build();

      await service.placeOrder(marketBuy);

      expect(savedOrders).toEqual([
        expect.objectContaining({ status: 'REJECTED' }),
      ]);
    });

    it('lanza USER_NOT_FOUND y no entra a la transacción si el usuario no existe', async () => {
      const { service, savedOrders, orders } = build({ userExists: false });

      await expect(service.placeOrder(marketBuy)).rejects.toThrow(
        NotFoundError,
      );
      expect(orders.withUserLock).not.toHaveBeenCalled();
      expect(savedOrders).toEqual([]);
    });

    it('lanza INSTRUMENT_NOT_FOUND si el instrumento no existe', async () => {
      const { service, savedOrders } = build({ instruments: [] });

      await expect(service.placeOrder(marketBuy)).rejects.toMatchObject({
        code: 'INSTRUMENT_NOT_FOUND',
      });
      expect(savedOrders).toEqual([]);
    });

    it('rechaza operar el instrumento de efectivo con 400', async () => {
      const { service } = build({ instruments: [CASH] });

      await expect(
        service.placeOrder({ ...marketBuy, instrumentId: 66 }),
      ).rejects.toThrow(ValidationFailedError);
    });

    it('lanza PRICE_NOT_FOUND en una MARKET sin precio de mercado', async () => {
      const { service, savedOrders } = build({ prices: [] });

      await expect(service.placeOrder(marketBuy)).rejects.toMatchObject({
        code: 'PRICE_NOT_FOUND',
      });
      expect(savedOrders).toEqual([]);
    });
  });

  describe('placeCashMovement', () => {
    it('guarda un ingreso FILLED y suma al efectivo', async () => {
      const { service, savedOrders, positions } = build({
        positions: [position(66, 100)],
      });

      await service.placeCashMovement({
        userId: 1,
        side: 'CASH_IN',
        amount: 5_000,
      });

      expect(savedOrders).toEqual([
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
      expect(positions.get(66)?.quantity.toNumber()).toBe(5_100);
    });

    it('crea el efectivo en el primer ingreso si no había fila', async () => {
      const { service, positions } = build();

      await service.placeCashMovement({
        userId: 1,
        side: 'CASH_IN',
        amount: 300,
      });

      expect(positions.get(66)?.quantity.toNumber()).toBe(300);
    });

    it('descuenta un egreso con saldo suficiente', async () => {
      const { service, positions } = build({
        positions: [position(66, 1_000)],
      });

      await service.placeCashMovement({
        userId: 1,
        side: 'CASH_OUT',
        amount: 400,
      });

      expect(positions.get(66)?.quantity.toNumber()).toBe(600);
    });

    it('guarda REJECTED, sin cambiar el saldo, un retiro mayor al saldo', async () => {
      const { service, savedOrders, positions } = build({
        positions: [position(66, 100)],
      });

      await service.placeCashMovement({
        userId: 1,
        side: 'CASH_OUT',
        amount: 101,
      });

      expect(savedOrders).toEqual([
        expect.objectContaining({ status: 'REJECTED' }),
      ]);
      expect(positions.get(66)?.quantity.toNumber()).toBe(100);
    });

    it('lanza USER_NOT_FOUND si el usuario no existe', async () => {
      const { service } = build({ userExists: false });

      await expect(
        service.placeCashMovement({ userId: 1, side: 'CASH_IN', amount: 1 }),
      ).rejects.toThrow(NotFoundError);
    });
  });
});
