import type { LatestPrice } from '../models/latest-price.model.js';

export const MARKET_DATA_REPOSITORY = Symbol('MARKET_DATA_REPOSITORY');

export interface IMarketDataRepository {
  findLatestPrices(instrumentIds: number[]): Promise<LatestPrice[]>;
}
