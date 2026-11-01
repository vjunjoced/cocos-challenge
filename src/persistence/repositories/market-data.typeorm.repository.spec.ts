import type { Repository } from 'typeorm';
import type { MarketDataEntity } from '../entities/market-data.entity.js';
import { MarketDataTypeOrmRepository } from './market-data.typeorm.repository.js';

function buildQueryBuilder(rows: unknown[]) {
  const builder = {
    select: vi.fn().mockReturnThis(),
    addSelect: vi.fn().mockReturnThis(),
    distinctOn: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    addOrderBy: vi.fn().mockReturnThis(),
    getRawMany: vi.fn().mockResolvedValue(rows),
  };

  return builder;
}

describe('MarketDataTypeOrmRepository', () => {
  it('no consulta la base cuando no hay instrumentos', async () => {
    const createQueryBuilder = vi.fn();
    const repository = new MarketDataTypeOrmRepository({
      createQueryBuilder,
    } as unknown as Repository<MarketDataEntity>);

    await expect(repository.findLatestPrices([])).resolves.toEqual([]);
    expect(createQueryBuilder).not.toHaveBeenCalled();
  });

  it('toma el cierre de la fecha más reciente de cada instrumento', async () => {
    const builder = buildQueryBuilder([
      { instrumentId: '47', close: '950.50', previousClose: '940.00' },
      { instrumentId: 31, close: '1540.00', previousClose: '1500.00' },
    ]);
    const repository = new MarketDataTypeOrmRepository({
      createQueryBuilder: () => builder,
    } as unknown as Repository<MarketDataEntity>);

    await expect(repository.findLatestPrices([47, 31])).resolves.toEqual([
      { instrumentId: 47, close: 950.5, previousClose: 940 },
      { instrumentId: 31, close: 1540, previousClose: 1500 },
    ]);
    expect(builder.distinctOn).toHaveBeenCalledWith([
      'marketData.instrumentId',
    ]);
    expect(builder.where).toHaveBeenCalledWith(
      'marketData.instrumentId IN (:...instrumentIds)',
      { instrumentIds: [47, 31] },
    );
    expect(builder.addOrderBy).toHaveBeenCalledWith('marketData.date', 'DESC');
  });
});
