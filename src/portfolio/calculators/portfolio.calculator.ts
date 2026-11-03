import { Decimal } from 'decimal.js';
import { indexBy } from '../../common/utils/index-by.js';
import { toMoney } from '../../common/utils/to-money.js';
import { CASH_INSTRUMENT_ID } from '../../core/constants/instrument.constants.js';
import type { Instrument } from '../../core/models/instrument.model.js';
import type { LatestPrice } from '../../core/models/latest-price.model.js';
import type { Position } from '../../core/models/position.model.js';
import { toPosition } from '../mappers/position.mapper.js';
import type { Portfolio } from '../models/portfolio.model.js';

/**
 * Arma el portfolio a partir de las posiciones guardadas del usuario: la fila
 * del efectivo son los pesos disponibles y el resto son las tenencias.
 */
export function calculatePortfolio(
  positions: Position[],
  prices: LatestPrice[],
  instruments: Instrument[],
): Portfolio {
  const priceByInstrument = indexBy(prices, (price) => price.instrumentId);
  const instrumentById = indexBy(instruments, (instrument) => instrument.id);
  const cash =
    positions.find((position) => position.instrumentId === CASH_INSTRUMENT_ID)
      ?.quantity ?? new Decimal(0);

  const holdings = positions
    .filter((position) => position.instrumentId !== CASH_INSTRUMENT_ID)
    .map((position) =>
      toPosition(
        {
          instrumentId: position.instrumentId,
          quantity: position.quantity.toNumber(),
          cost: position.cost,
        },
        priceByInstrument,
        instrumentById,
      ),
    )
    .sort((a, b) => a.ticker.localeCompare(b.ticker));

  const positionsValue = holdings.reduce(
    (total, position) => total.add(position.marketValue),
    new Decimal(0),
  );

  return {
    totalValue: toMoney(cash.add(positionsValue)),
    availableCash: toMoney(cash),
    positions: holdings,
  };
}
