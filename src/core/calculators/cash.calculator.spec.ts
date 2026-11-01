import type { AccountMovement } from '../models/account-movement.model.js';
import { calculateAvailableCash } from './cash.calculator.js';

const CASH_ID = 66;

const cash = (side: 'CASH_IN' | 'CASH_OUT', size: number): AccountMovement => ({
  instrumentId: CASH_ID,
  side,
  size,
  price: 1,
});

const trade = (
  side: 'BUY' | 'SELL',
  instrumentId: number,
  size: number,
  price: number,
): AccountMovement => ({ instrumentId, side, size, price });

describe('calculateAvailableCash', () => {
  it('devuelve 0 sin movimientos', () => {
    expect(calculateAvailableCash([]).toNumber()).toBe(0);
  });

  it('suma los ingresos y resta los egresos de efectivo', () => {
    const result = calculateAvailableCash([
      cash('CASH_IN', 1_000_000),
      cash('CASH_OUT', 100_000),
    ]);

    expect(result.toNumber()).toBe(900_000);
  });

  it('resta las compras y suma las ventas por size × price', () => {
    const result = calculateAvailableCash([
      cash('CASH_IN', 10_000),
      trade('BUY', 1, 10, 100),
      trade('SELL', 1, 4, 120),
    ]);

    expect(result.toNumber()).toBe(9_480);
  });

  it('calcula los pesos disponibles del usuario 1 del enunciado', () => {
    const result = calculateAvailableCash([
      cash('CASH_IN', 1_000_000),
      trade('BUY', 47, 50, 930),
      trade('SELL', 47, 10, 940),
      cash('CASH_OUT', 100_000),
      trade('BUY', 31, 20, 1540),
      trade('BUY', 54, 500, 250),
    ]);

    expect(result.toNumber()).toBe(707_100);
  });

  it('no arrastra error de punto flotante', () => {
    const result = calculateAvailableCash([
      cash('CASH_IN', 1),
      trade('BUY', 1, 3, 0.1),
      trade('BUY', 1, 7, 0.2),
    ]);

    expect(result.toString()).toBe('-0.7');
  });
});
