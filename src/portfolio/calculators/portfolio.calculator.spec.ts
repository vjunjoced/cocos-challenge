import { Decimal } from 'decimal.js';
import type { Instrument } from '../../core/models/instrument.model.js';
import type { Position } from '../../core/models/position.model.js';
import { calculatePortfolio as calculate } from './portfolio.calculator.js';

const instrument = (id: number): Instrument => ({
  id,
  ticker: `T${id}`,
  name: `Instrument ${id}`,
  type: 'ACCIONES',
});

const INSTRUMENTS = [1, 2, 9, 31, 47, 54].map(instrument);

const position = (
  instrumentId: number,
  quantity: number | string,
  cost: number | string = 0,
): Position => ({
  instrumentId,
  quantity: new Decimal(quantity),
  cost: new Decimal(cost),
});

const price = (instrumentId: number, close: number, previousClose = close) => ({
  instrumentId,
  close,
  previousClose,
});

const calculatePortfolio = (
  positions: Position[],
  prices: Parameters<typeof calculate>[1],
) => calculate(positions, prices, INSTRUMENTS);

describe('calculatePortfolio', () => {
  it('devuelve todo en cero cuando no hay posiciones', () => {
    expect(calculatePortfolio([], [])).toEqual({
      totalValue: 0,
      availableCash: 0,
      positions: [],
    });
  });

  it('con solo efectivo, el total son los pesos disponibles', () => {
    expect(calculatePortfolio([position(66, '900000.50')], [])).toEqual({
      totalValue: 900_000.5,
      availableCash: 900_000.5,
      positions: [],
    });
  });

  it('calcula pesos y posiciones del usuario 1 del enunciado', () => {
    const positions = [
      position(66, 707_100),
      position(47, 40, 37_200),
      position(31, 20, 30_800),
      position(54, 500, 125_000),
    ];
    const prices = [price(47, 950), price(31, 1540), price(54, 270)];

    const result = calculatePortfolio(positions, prices);

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

  it('calcula el rendimiento con el costo guardado de varias compras', () => {
    const result = calculatePortfolio(
      [position(1, 15, 1_400)],
      [price(1, 120)],
    );

    expect(result.positions).toEqual([
      expect.objectContaining({
        quantity: 15,
        marketValue: 1800,
        totalReturnPercentage: 28.57,
      }),
    ]);
  });

  it('valúa a costo una posición sin precio de mercado', () => {
    const result = calculatePortfolio([position(1, 10, 1_000)], []);

    expect(result.positions).toEqual([
      expect.objectContaining({
        marketValue: 1000,
        totalReturnPercentage: 0,
        dailyReturnPercentage: 0,
      }),
    ]);
  });

  it('calcula el cambio diario con close y previousClose', () => {
    const result = calculatePortfolio(
      [position(47, 40, 37_200)],
      [price(47, 950, 940)],
    );

    expect(result.positions).toEqual([
      expect.objectContaining({ dailyReturnPercentage: 1.06 }),
    ]);
  });

  it('usa el id como ticker si el instrumento no se encuentra', () => {
    const result = calculate([position(777, 1, 10)], [], []);

    expect(result.positions).toEqual([
      expect.objectContaining({ ticker: '777', name: '' }),
    ]);
  });

  it('ordena las posiciones por ticker', () => {
    const result = calculatePortfolio(
      [position(9, 1, 10), position(2, 1, 10)],
      [],
    );

    expect(result.positions.map((p) => p.ticker)).toEqual(['T2', 'T9']);
  });

  it('no incluye el efectivo en la lista de posiciones', () => {
    const result = calculatePortfolio(
      [position(66, 100), position(1, 1, 10)],
      [],
    );

    expect(result.positions.map((p) => p.instrumentId)).toEqual([1]);
  });
});
