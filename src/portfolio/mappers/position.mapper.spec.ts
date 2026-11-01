import { Decimal } from 'decimal.js';
import { indexBy } from '../../common/utils/index-by.js';
import type { Instrument } from '../../core/models/instrument.model.js';
import type { LatestPrice } from '../../core/models/latest-price.model.js';
import { toPosition } from './position.mapper.js';

describe('toPosition', () => {
  const holding = { instrumentId: 47, quantity: 15, cost: new Decimal(1400) };
  const instruments = indexBy<Instrument, number>(
    [{ id: 47, ticker: 'PAMP', name: 'Pampa Holding', type: 'ACCIONES' }],
    (instrument) => instrument.id,
  );
  const prices = indexBy<LatestPrice, number>(
    [{ instrumentId: 47, close: 120, previousClose: 100 }],
    (price) => price.instrumentId,
  );

  it('valúa la posición al último cierre y calcula el rendimiento', () => {
    expect(toPosition(holding, prices, instruments)).toEqual({
      instrumentId: 47,
      ticker: 'PAMP',
      name: 'Pampa Holding',
      quantity: 15,
      marketValue: 1800,
      totalReturnPercentage: 28.57,
      dailyReturnPercentage: 20,
    });
  });

  it('valúa al costo, con rendimiento 0, si no hay precio de mercado', () => {
    expect(toPosition(holding, new Map(), instruments)).toEqual(
      expect.objectContaining({
        marketValue: 1400,
        totalReturnPercentage: 0,
        dailyReturnPercentage: 0,
      }),
    );
  });

  it('usa el id como ticker y nombre vacío si no encuentra el instrumento', () => {
    expect(toPosition(holding, prices, new Map())).toEqual(
      expect.objectContaining({ ticker: '47', name: '' }),
    );
  });

  it('devuelve rendimiento 0 cuando el costo es 0', () => {
    expect(
      toPosition({ ...holding, cost: new Decimal(0) }, prices, instruments),
    ).toEqual(expect.objectContaining({ totalReturnPercentage: 0 }));
  });

  it('devuelve cambio diario 0 cuando el cierre anterior es 0', () => {
    const zeroPrevious = indexBy<LatestPrice, number>(
      [{ instrumentId: 47, close: 120, previousClose: 0 }],
      (price) => price.instrumentId,
    );

    expect(toPosition(holding, zeroPrevious, instruments)).toEqual(
      expect.objectContaining({ dailyReturnPercentage: 0 }),
    );
  });

  it('calcula un cambio diario negativo', () => {
    const falling = indexBy<LatestPrice, number>(
      [{ instrumentId: 47, close: 90, previousClose: 100 }],
      (price) => price.instrumentId,
    );

    expect(toPosition(holding, falling, instruments)).toEqual(
      expect.objectContaining({ dailyReturnPercentage: -10 }),
    );
  });
});
