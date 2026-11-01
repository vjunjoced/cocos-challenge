import type { Instrument } from '../../core/models/instrument.model.js';
import type { AccountMovement } from '../../core/models/account-movement.model.js';
import { calculatePortfolio as calculate } from './portfolio.calculator.js';

const CASH_ID = 66;

const instrument = (id: number): Instrument => ({
  id,
  ticker: `T${id}`,
  name: `Instrument ${id}`,
  type: 'ACCIONES',
});

const INSTRUMENTS = [1, 2, 9, 31, 47, 54].map(instrument);

const calculatePortfolio = (
  orders: AccountMovement[],
  prices: Parameters<typeof calculate>[1],
) => calculate(orders, prices, INSTRUMENTS);

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

describe('calculatePortfolio', () => {
  it('devuelve todo en cero cuando no hay movimientos', () => {
    expect(calculatePortfolio([], [])).toEqual({
      totalValue: 0,
      availableCash: 0,
      positions: [],
    });
  });

  it('suma los ingresos y resta los egresos de efectivo', () => {
    const result = calculatePortfolio(
      [cash('CASH_IN', 1_000_000), cash('CASH_OUT', 100_000)],
      [],
    );

    expect(result).toEqual({
      totalValue: 900_000,
      availableCash: 900_000,
      positions: [],
    });
  });

  it('calcula pesos y posiciones del usuario 1 del enunciado', () => {
    const orders = [
      cash('CASH_IN', 1_000_000),
      trade('BUY', 47, 50, 930),
      trade('SELL', 47, 10, 940),
      cash('CASH_OUT', 100_000),
      trade('BUY', 31, 20, 1540),
      trade('BUY', 54, 500, 250),
    ];
    const prices = [
      { instrumentId: 47, close: 950, previousClose: 950 },
      { instrumentId: 31, close: 1540, previousClose: 1540 },
      { instrumentId: 54, close: 270, previousClose: 270 },
    ];

    const result = calculatePortfolio(orders, prices);

    expect(result.availableCash).toBe(707_100);
    expect(result.totalValue).toBe(910_900);
    expect(result.positions).toEqual([
      expect.objectContaining({
        instrumentId: 31,
        quantity: 20,
        marketValue: 30_800,
        totalReturnPercentage: 0,
      }),
      expect.objectContaining({
        instrumentId: 47,
        quantity: 40,
        marketValue: 38_000,
        totalReturnPercentage: 2.15,
      }),
      expect.objectContaining({
        instrumentId: 54,
        quantity: 500,
        marketValue: 135_000,
        totalReturnPercentage: 8,
      }),
    ]);
  });

  it('calcula el rendimiento con el costo promedio de varias compras', () => {
    const result = calculatePortfolio(
      [trade('BUY', 1, 10, 100), trade('BUY', 1, 5, 80)],
      [{ instrumentId: 1, close: 120, previousClose: 120 }],
    );

    expect(result.positions).toEqual([
      expect.objectContaining({
        quantity: 15,
        marketValue: 1800,
        totalReturnPercentage: 28.57,
      }),
    ]);
  });

  it('mantiene el costo promedio al vender y lo recalcula al volver a comprar', () => {
    const orders = [
      cash('CASH_IN', 10_000),
      trade('BUY', 1, 10, 100),
      trade('BUY', 1, 5, 80),
      trade('SELL', 1, 6, 120),
      trade('BUY', 1, 15, 90),
    ];

    const afterSale = calculatePortfolio(orders.slice(0, 4), [
      { instrumentId: 1, close: 120, previousClose: 120 },
    ]);
    const afterRebuy = calculatePortfolio(orders, [
      { instrumentId: 1, close: 120, previousClose: 120 },
    ]);

    expect(afterSale.positions).toEqual([
      expect.objectContaining({
        quantity: 9,
        marketValue: 1080,
        totalReturnPercentage: 28.57,
      }),
    ]);
    expect(afterRebuy.positions).toEqual([
      expect.objectContaining({
        quantity: 24,
        marketValue: 2880,
        totalReturnPercentage: 31.51,
      }),
    ]);
    expect(afterRebuy.availableCash).toBe(7970);
  });

  it('no pierde precisión con decimales de punto flotante', () => {
    const result = calculatePortfolio(
      [
        cash('CASH_IN', 100),
        trade('BUY', 1, 3, 0.1),
        trade('BUY', 1, 7, 0.2),
        trade('SELL', 1, 10, 0.1),
      ],
      [],
    );

    expect(result.availableCash).toBe(99.3);
    expect(result.totalValue).toBe(99.3);
    expect(result.positions).toEqual([]);
  });

  it('calcula el cambio diario con close y previousClose', () => {
    const result = calculatePortfolio(
      [trade('BUY', 47, 40, 930)],
      [{ instrumentId: 47, close: 950, previousClose: 940 }],
    );

    expect(result.positions).toEqual([
      expect.objectContaining({ dailyReturnPercentage: 1.06 }),
    ]);
  });

  it('quita la posición cuando se vende todo', () => {
    const result = calculatePortfolio(
      [
        cash('CASH_IN', 1000),
        trade('BUY', 1, 10, 50),
        trade('SELL', 1, 10, 60),
      ],
      [{ instrumentId: 1, close: 60, previousClose: 60 }],
    );

    expect(result).toEqual({
      totalValue: 1100,
      availableCash: 1100,
      positions: [],
    });
  });

  it('valúa a costo una posición sin precio de mercado', () => {
    const result = calculatePortfolio([trade('BUY', 1, 10, 100)], []);

    expect(result.positions).toEqual([
      expect.objectContaining({
        marketValue: 1000,
        totalReturnPercentage: 0,
      }),
    ]);
  });

  it('ignora una venta de un instrumento que no se tiene', () => {
    const result = calculatePortfolio([trade('SELL', 1, 5, 100)], []);

    expect(result.positions).toEqual([]);
  });

  it('usa el id como ticker si el instrumento no se encuentra', () => {
    const result = calculate([trade('BUY', 777, 1, 10)], [], []);

    expect(result.positions).toEqual([
      expect.objectContaining({ ticker: '777', name: '' }),
    ]);
  });

  it('ordena las posiciones por ticker', () => {
    const result = calculatePortfolio(
      [trade('BUY', 9, 1, 10), trade('BUY', 2, 1, 10)],
      [],
    );

    expect(result.positions.map((position) => position.ticker)).toEqual([
      'T2',
      'T9',
    ]);
  });
});
