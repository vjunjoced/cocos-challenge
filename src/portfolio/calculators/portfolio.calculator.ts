import { Decimal } from 'decimal.js';
import { indexBy } from '../../common/utils/index-by.js';
import { toMoney } from '../../common/utils/to-money.js';
import { calculateAvailableCash } from '../../core/calculators/cash.calculator.js';
import { calculateHoldings } from '../../core/calculators/holdings.calculator.js';
import type { AccountMovement } from '../../core/models/account-movement.model.js';
import type { Instrument } from '../../core/models/instrument.model.js';
import type { LatestPrice } from '../../core/models/latest-price.model.js';
import { toPosition } from '../mappers/position.mapper.js';
import type { Portfolio } from '../models/portfolio.model.js';

/**
 * Las posiciones usan costo promedio móvil, por lo que `movements` debe venir
 * ordenado cronológicamente.
 */
export function calculatePortfolio(
  movements: AccountMovement[],
  prices: LatestPrice[],
  instruments: Instrument[],
): Portfolio {
  const priceByInstrument = indexBy(prices, (price) => price.instrumentId);
  const instrumentById = indexBy(instruments, (instrument) => instrument.id);
  const cash = calculateAvailableCash(movements);
  const holdings = calculateHoldings(movements);

  const positions = [...holdings.values()]
    .map((holding) => toPosition(holding, priceByInstrument, instrumentById))
    .sort((a, b) => a.ticker.localeCompare(b.ticker));

  const positionsValue = positions.reduce(
    (total, position) => total.add(position.marketValue),
    new Decimal(0),
  );

  return {
    totalValue: toMoney(cash.add(positionsValue)),
    availableCash: toMoney(cash),
    positions,
  };
}
