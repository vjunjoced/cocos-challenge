import type { AccountMovement } from '../../core/models/account-movement.model.js';
import type { OrderRequest } from '../models/order-request.model.js';
import { decideOrder } from './order-decision.calculator.js';

const cashIn = (size: number): AccountMovement => ({
  instrumentId: 66,
  side: 'CASH_IN',
  size,
  price: 1,
});

const bought = (size: number, price: number): AccountMovement => ({
  instrumentId: 47,
  side: 'BUY',
  size,
  price,
});

const request = (overrides: Partial<OrderRequest>): OrderRequest => ({
  userId: 1,
  instrumentId: 47,
  side: 'BUY',
  type: 'MARKET',
  size: 10,
  ...overrides,
});

const CLOSE = 100;

describe('decideOrder', () => {
  describe('compra', () => {
    it('ejecuta una MARKET al último close cuando alcanza el saldo', () => {
      expect(decideOrder(request({}), CLOSE, [cashIn(1_000)])).toEqual({
        size: 10,
        price: 100,
        status: 'FILLED',
      });
    });

    it('acepta una compra por exactamente todo el saldo', () => {
      expect(decideOrder(request({}), CLOSE, [cashIn(1_000)]).status).toBe(
        'FILLED',
      );
    });

    it('rechaza una MARKET sin saldo suficiente, con el precio que habría usado', () => {
      expect(decideOrder(request({}), CLOSE, [cashIn(999)])).toEqual({
        size: 10,
        price: 100,
        status: 'REJECTED',
      });
    });

    it('deja una LIMIT con saldo en NEW al precio enviado', () => {
      const limit = request({ type: 'LIMIT', price: 90 });

      expect(decideOrder(limit, CLOSE, [cashIn(1_000)])).toEqual({
        size: 10,
        price: 90,
        status: 'NEW',
      });
    });

    it('rechaza una LIMIT sin saldo suficiente al precio enviado', () => {
      const limit = request({ type: 'LIMIT', price: 150 });

      expect(decideOrder(limit, CLOSE, [cashIn(1_000)])).toEqual({
        size: 10,
        price: 150,
        status: 'REJECTED',
      });
    });

    it('rechaza cuando no hay historial', () => {
      expect(decideOrder(request({}), CLOSE, []).status).toBe('REJECTED');
    });
  });

  describe('monto en pesos', () => {
    it('compra la cantidad máxima de acciones sin fracciones', () => {
      const byAmount = request({ size: undefined, amount: 1_050 });

      expect(decideOrder(byAmount, CLOSE, [cashIn(5_000)])).toEqual({
        size: 10,
        price: 100,
        status: 'FILLED',
      });
    });

    it('usa el precio límite para calcular las acciones', () => {
      const byAmount = request({
        size: undefined,
        amount: 1_000,
        type: 'LIMIT',
        price: 300,
      });

      expect(decideOrder(byAmount, CLOSE, [cashIn(5_000)])).toEqual({
        size: 3,
        price: 300,
        status: 'NEW',
      });
    });

    it('rechaza un monto que no alcanza para una acción', () => {
      const byAmount = request({ size: undefined, amount: 99.99 });

      expect(decideOrder(byAmount, CLOSE, [cashIn(5_000)])).toEqual({
        size: 0,
        price: 100,
        status: 'REJECTED',
      });
    });

    it('rechaza un monto cuando el precio de ejecución es 0', () => {
      const byAmount = request({ size: undefined, amount: 1_000 });

      expect(decideOrder(byAmount, 0, [cashIn(5_000)])).toEqual({
        size: 0,
        price: 0,
        status: 'REJECTED',
      });
    });

    it('rechaza si el saldo no cubre las acciones calculadas', () => {
      const byAmount = request({ size: undefined, amount: 1_000 });

      expect(decideOrder(byAmount, CLOSE, [cashIn(500)]).status).toBe(
        'REJECTED',
      );
    });
  });

  describe('venta', () => {
    const sell = (overrides: Partial<OrderRequest> = {}) =>
      request({ side: 'SELL', ...overrides });

    it('ejecuta una MARKET cuando tiene las acciones', () => {
      expect(decideOrder(sell(), CLOSE, [bought(10, 80)])).toEqual({
        size: 10,
        price: 100,
        status: 'FILLED',
      });
    });

    it('rechaza vender más acciones de las que tiene', () => {
      expect(decideOrder(sell({ size: 11 }), CLOSE, [bought(10, 80)])).toEqual({
        size: 11,
        price: 100,
        status: 'REJECTED',
      });
    });

    it('rechaza vender un instrumento que no tiene', () => {
      expect(decideOrder(sell(), CLOSE, [cashIn(1_000)]).status).toBe(
        'REJECTED',
      );
    });

    it('descuenta lo ya vendido', () => {
      const history: AccountMovement[] = [
        bought(10, 80),
        { instrumentId: 47, side: 'SELL', size: 6, price: 90 },
      ];

      expect(decideOrder(sell({ size: 5 }), CLOSE, history).status).toBe(
        'REJECTED',
      );
      expect(decideOrder(sell({ size: 4 }), CLOSE, history).status).toBe(
        'FILLED',
      );
    });

    it('deja una LIMIT con acciones en NEW', () => {
      const limit = sell({ type: 'LIMIT', price: 120 });

      expect(decideOrder(limit, CLOSE, [bought(10, 80)])).toEqual({
        size: 10,
        price: 120,
        status: 'NEW',
      });
    });
  });
});
