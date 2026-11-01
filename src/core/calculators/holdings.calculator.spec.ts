import type { AccountMovement } from '../models/account-movement.model.js';
import { calculateHoldings } from './holdings.calculator.js';

const trade = (
  side: 'BUY' | 'SELL',
  instrumentId: number,
  size: number,
  price: number,
): AccountMovement => ({ instrumentId, side, size, price });

describe('calculateHoldings', () => {
  it('devuelve vacío sin movimientos', () => {
    expect(calculateHoldings([]).size).toBe(0);
  });

  it('acumula cantidad y costo de varias compras', () => {
    const holdings = calculateHoldings([
      trade('BUY', 1, 10, 100),
      trade('BUY', 1, 5, 80),
    ]);

    expect(holdings.get(1)?.quantity).toBe(15);
    expect(holdings.get(1)?.cost.toNumber()).toBe(1_400);
  });

  it('mantiene el costo promedio al vender y lo recalcula al volver a comprar', () => {
    const afterSale = calculateHoldings([
      trade('BUY', 1, 10, 100),
      trade('BUY', 1, 5, 80),
      trade('SELL', 1, 6, 120),
    ]);
    const afterRebuy = calculateHoldings([
      trade('BUY', 1, 10, 100),
      trade('BUY', 1, 5, 80),
      trade('SELL', 1, 6, 120),
      trade('BUY', 1, 15, 90),
    ]);

    expect(afterSale.get(1)?.quantity).toBe(9);
    expect(afterSale.get(1)?.cost.toNumber()).toBe(840);
    expect(afterRebuy.get(1)?.quantity).toBe(24);
    expect(afterRebuy.get(1)?.cost.toNumber()).toBe(2_190);
  });

  it('quita la posición cuando se vende todo', () => {
    const holdings = calculateHoldings([
      trade('BUY', 1, 10, 50),
      trade('SELL', 1, 10, 60),
    ]);

    expect(holdings.has(1)).toBe(false);
  });

  it('ignora una venta de un instrumento que no se tiene', () => {
    expect(calculateHoldings([trade('SELL', 1, 5, 100)]).size).toBe(0);
  });

  it('ignora los movimientos de efectivo', () => {
    const holdings = calculateHoldings([
      { instrumentId: 66, side: 'CASH_IN', size: 1_000, price: 1 },
    ]);

    expect(holdings.size).toBe(0);
  });

  it('separa la tenencia de cada instrumento', () => {
    const holdings = calculateHoldings([
      trade('BUY', 1, 2, 10),
      trade('BUY', 2, 3, 20),
    ]);

    expect(holdings.get(1)?.quantity).toBe(2);
    expect(holdings.get(2)?.quantity).toBe(3);
  });
});
