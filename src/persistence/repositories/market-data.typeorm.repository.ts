import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { toLatestPrice } from '../mappers/latest-price.mapper.js';
import { MarketDataEntity } from '../entities/market-data.entity.js';
import type { LatestPriceRow } from '../entities/latest-price.row.js';
import type { LatestPrice } from '../../core/models/latest-price.model.js';
import type { IMarketDataRepository } from '../../core/repositories/market-data.repository.js';

@Injectable()
export class MarketDataTypeOrmRepository implements IMarketDataRepository {
  constructor(
    @InjectRepository(MarketDataEntity)
    private readonly repository: Repository<MarketDataEntity>,
  ) {}

  async findLatestPrices(instrumentIds: number[]): Promise<LatestPrice[]> {
    if (instrumentIds.length === 0) {
      return [];
    }

    const rows = await this.repository
      .createQueryBuilder('marketData')
      .select('marketData.instrumentId', 'instrumentId')
      .addSelect('marketData.close', 'close')
      .addSelect('marketData.previousClose', 'previousClose')
      .distinctOn(['marketData.instrumentId'])
      .where('marketData.instrumentId IN (:...instrumentIds)', {
        instrumentIds,
      })
      .orderBy('marketData.instrumentId', 'ASC')
      .addOrderBy('marketData.date', 'DESC')
      .getRawMany<LatestPriceRow>();

    return rows.map(toLatestPrice);
  }
}
