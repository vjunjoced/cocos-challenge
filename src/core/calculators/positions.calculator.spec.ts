import { Decimal } from 'decimal.js';
import type { AccountMovement } from '../models/account-movement.model.js';
import type { Position } from '../models/position.model.js';
import {
  applyCashMovement,
  applyTrade,
  type TradeResult,
} from './positions.calculator.js';

const CASH_ID = 66;

const cashPosition = (quantity: number | string): Position => ({
  instrumentId: CASH_ID,
  quantity: new Decimal(quantity),
  cost: new Decimal(0),
});

const holding = (
  quantity: number,
  cost: number | string,
  instrumentId = 1,
): Position => ({
  instrumentId,
  quantity: new Decimal(quantity),
  cost: new Decimal(cost),
});

const trade = (
  side: 'BUY' | 'SELL',
  size: number,
  price: number,
  instrumentId = 1,
): AccountMovement => ({ instrumentId, side, size, price });

describe('applyCashMovement', () => {
  it('suma un ingreso y resta un egreso', () => {
    expect(
      applyCashMovement('CASH_IN', 500, cashPosition(100)).quantity.toNumber(),
    ).toBe(600);
    expect(
      applyCashMovement('CASH_OUT', 40, cashPosition(100)).quantity.toNumber(),
    ).toBe(60);
  });

  it('no modifica la posición original', () => {
    const original = cashPosition(100);

    applyCashMovement('CASH_IN', 500, original);

    expect(original.quantity.toNumber()).toBe(100);
  });
});

describe('applyTrade', () => {
  it('una primera compra crea la tenencia y resta el efectivo', () => {
    const result = applyTrade(trade('BUY', 10, 100), cashPosition(5_000), null);

    expect(result.cash.quantity.toNumber()).toBe(4_000);
    expect(result.holding?.quantity.toNumber()).toBe(10);
    expect(result.holding?.cost.toNumber()).toBe(1_000);
  });

  it('una compra posterior acumula cantidad y costo', () => {
    const result = applyTrade(
      trade('BUY', 5, 80),
      cashPosition(5_000),
      holding(10, 1_000),
    );

    expect(result.holding?.quantity.toNumber()).toBe(15);
    expect(result.holding?.cost.toNumber()).toBe(1_400);
  });

  it('una venta parcial baja la cantidad y el costo proporcional', () => {
    const result = applyTrade(
      trade('SELL', 6, 120),
      cashPosition(0),
      holding(15, 1_400),
    );

    expect(result.cash.quantity.toNumber()).toBe(720);
    expect(result.holding?.quantity.toNumber()).toBe(9);
    expect(result.holding?.cost.toNumber()).toBe(840);
  });

  it('una venta total elimina la tenencia (holding null)', () => {
    const result = applyTrade(
      trade('SELL', 10, 60),
      cashPosition(0),
      holding(10, 500),
    );

    expect(result.holding).toBeNull();
    expect(result.cash.quantity.toNumber()).toBe(600);
  });

  it('una venta sin tenencia no cambia nada', () => {
    const cash = cashPosition(100);

    expect(applyTrade(trade('SELL', 1, 10), cash, null)).toEqual({
      cash,
      holding: null,
    });
  });

  it('conserva los centavos del efectivo', () => {
    const result = applyTrade(
      trade('BUY', 3, 925.85),
      cashPosition(10_000),
      null,
    );

    expect(result.cash.quantity.toString()).toBe('7222.45');
  });
});

describe('secuencia completa de movimientos', () => {
  const history: AccountMovement[] = [
    { instrumentId: CASH_ID, side: 'CASH_IN', size: 10_000, price: 1 },
    trade('BUY', 10, 100),
    trade('BUY', 5, 80),
    trade('SELL', 6, 120),
    trade('BUY', 15, 90),
    trade('BUY', 3, 925.85, 47),
    { instrumentId: CASH_ID, side: 'CASH_OUT', size: 500, price: 1 },
    trade('SELL', 3, 930.1, 47),
  ];

  const replay = () => {
    let cash = cashPosition(0);
    const holdings = new Map<number, Position>();

    for (const movement of history) {
      if (movement.side === 'CASH_IN' || movement.side === 'CASH_OUT') {
        cash = applyCashMovement(movement.side, movement.size, cash);
        continue;
      }

      const result: TradeResult = applyTrade(
        movement,
        cash,
        holdings.get(movement.instrumentId) ?? null,
      );

      cash = result.cash;
      if (result.holding) {
        holdings.set(movement.instrumentId, result.holding);
      } else {
        holdings.delete(movement.instrumentId);
      }
    }

    return { cash, holdings };
  };

  it('deja el efectivo esperado, con centavos', () => {
    expect(replay().cash.quantity.toString()).toBe('7482.75');
  });

  it('deja solo la tenencia que sigue en cartera, con su costo promedio móvil', () => {
    const { holdings } = replay();

    expect([...holdings.keys()]).toEqual([1]);
    expect(holdings.get(1)?.quantity.toNumber()).toBe(24);
    expect(holdings.get(1)?.cost.toNumber()).toBe(2_190);
  });
});
