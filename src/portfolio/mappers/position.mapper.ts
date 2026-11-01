import { Decimal } from 'decimal.js';
import { toMoney } from '../../common/utils/to-money.js';
import type { Instrument } from '../../core/models/instrument.model.js';
import type { LatestPrice } from '../../core/models/latest-price.model.js';
import type { Holding } from '../../core/models/holding.model.js';
import type { PortfolioPosition } from '../models/portfolio.model.js';

export function toPosition(
  holding: Holding,
  priceByInstrument: Map<number, LatestPrice>,
  instrumentById: Map<number, Instrument>,
): PortfolioPosition {
  const instrument = instrumentById.get(holding.instrumentId);
  const price = priceByInstrument.get(holding.instrumentId);

  const marketValue =
    price === undefined
      ? holding.cost
      : new Decimal(price.close).mul(holding.quantity);
  const totalReturn = holding.cost.gt(0)
    ? marketValue.sub(holding.cost).div(holding.cost).mul(100)
    : new Decimal(0);
  const dailyReturn =
    price === undefined || new Decimal(price.previousClose).isZero()
      ? new Decimal(0)
      : new Decimal(price.close)
          .sub(price.previousClose)
          .div(price.previousClose)
          .mul(100);

  return {
    instrumentId: holding.instrumentId,
    ticker: instrument?.ticker ?? String(holding.instrumentId),
    name: instrument?.name ?? '',
    quantity: holding.quantity,
    marketValue: toMoney(marketValue),
    totalReturnPercentage: toMoney(totalReturn),
    dailyReturnPercentage: toMoney(dailyReturn),
  };
}
