import type { LatestPrice } from '../../core/models/latest-price.model.js';
import type { LatestPriceRow } from '../entities/latest-price.row.js';

export function toLatestPrice(row: LatestPriceRow): LatestPrice {
  return {
    instrumentId: Number(row.instrumentId),
    close: Number(row.close),
    previousClose: Number(row.previousClose),
  };
}
