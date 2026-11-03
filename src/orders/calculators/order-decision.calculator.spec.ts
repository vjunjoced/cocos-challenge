import { Decimal } from 'decimal.js';
import type { OrderBalance } from '../models/order-balance.model.js';
import type { OrderRequest } from '../models/order-request.model.js';
import { decideOrder } from './order-decision.calculator.js';

const balance = (cash: number, held = 0): OrderBalance => ({
  cash: new Decimal(cash),
  held,
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
      expect(decideOrder(request({}), CLOSE, balance(1_000))).toEqual({
        size: 10,
        price: 100,
        status: 'FILLED',
      });
    });

    it('acepta una compra por exactamente todo el saldo', () => {
      expect(decideOrder(request({}), CLOSE, balance(1_000)).status).toBe(
        'FILLED',
      );
    });

    it('rechaza una MARKET sin saldo suficiente, con el precio que habría usado', () => {
      expect(decideOrder(request({}), CLOSE, balance(999))).toEqual({
        size: 10,
        price: 100,
        status: 'REJECTED',
      });
    });

    it('deja una LIMIT con saldo en NEW al precio enviado', () => {
      const limit = request({ type: 'LIMIT', price: 90 });

      expect(decideOrder(limit, CLOSE, balance(1_000))).toEqual({
        size: 10,
        price: 90,
        status: 'NEW',
      });
    });

    it('rechaza una LIMIT sin saldo suficiente al precio enviado', () => {
      const limit = request({ type: 'LIMIT', price: 150 });

      expect(decideOrder(limit, CLOSE, balance(1_000))).toEqual({
        size: 10,
        price: 150,
        status: 'REJECTED',
      });
    });

    it('rechaza cuando el saldo es 0', () => {
      expect(decideOrder(request({}), CLOSE, balance(0)).status).toBe(
        'REJECTED',
      );
    });
  });

  describe('monto en pesos', () => {
    it('compra la cantidad máxima de acciones sin fracciones', () => {
      const byAmount = request({ size: undefined, amount: 1_050 });

      expect(decideOrder(byAmount, CLOSE, balance(5_000))).toEqual({
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

      expect(decideOrder(byAmount, CLOSE, balance(5_000))).toEqual({
        size: 3,
        price: 300,
        status: 'NEW',
      });
    });

    it('rechaza un monto que no alcanza para una acción', () => {
      const byAmount = request({ size: undefined, amount: 99.99 });

      expect(decideOrder(byAmount, CLOSE, balance(5_000))).toEqual({
        size: 0,
        price: 100,
        status: 'REJECTED',
      });
    });

    it('rechaza un monto cuando el precio de ejecución es 0', () => {
      const byAmount = request({ size: undefined, amount: 1_000 });

      expect(decideOrder(byAmount, 0, balance(5_000))).toEqual({
        size: 0,
        price: 0,
        status: 'REJECTED',
      });
    });

    it('rechaza si el saldo no cubre las acciones calculadas', () => {
      const byAmount = request({ size: undefined, amount: 1_000 });

      expect(decideOrder(byAmount, CLOSE, balance(500)).status).toBe(
        'REJECTED',
      );
    });
  });

  describe('venta', () => {
    const sell = (overrides: Partial<OrderRequest> = {}) =>
      request({ side: 'SELL', ...overrides });

    it('ejecuta una MARKET cuando tiene las acciones', () => {
      expect(decideOrder(sell(), CLOSE, balance(0, 10))).toEqual({
        size: 10,
        price: 100,
        status: 'FILLED',
      });
    });

    it('rechaza vender más acciones de las que tiene', () => {
      expect(decideOrder(sell({ size: 11 }), CLOSE, balance(0, 10))).toEqual({
        size: 11,
        price: 100,
        status: 'REJECTED',
      });
    });

    it('rechaza vender un instrumento que no tiene', () => {
      expect(decideOrder(sell(), CLOSE, balance(1_000, 0)).status).toBe(
        'REJECTED',
      );
    });

    it('deja una LIMIT con acciones en NEW', () => {
      const limit = sell({ type: 'LIMIT', price: 120 });

      expect(decideOrder(limit, CLOSE, balance(0, 10))).toEqual({
        size: 10,
        price: 120,
        status: 'NEW',
      });
    });
  });
});
