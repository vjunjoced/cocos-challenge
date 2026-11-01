import type { Repository } from 'typeorm';
import type { InstrumentEntity } from '../entities/instrument.entity.js';
import { InstrumentsTypeOrmRepository } from './instruments.typeorm.repository.js';

describe('InstrumentsTypeOrmRepository', () => {
  const instrument = {
    id: 1,
    ticker: 'GGAL',
    name: 'Grupo Financiero Galicia',
    type: 'ACCIONES',
  };

  it('busca por ticker o nombre escapando los comodines, ordenado y limitado', async () => {
    const builder = {
      where: vi.fn().mockReturnThis(),
      orWhere: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      getMany: vi.fn().mockResolvedValue([instrument]),
    };
    const repository = new InstrumentsTypeOrmRepository({
      createQueryBuilder: () => builder,
    } as unknown as Repository<InstrumentEntity>);

    await expect(repository.search('50%')).resolves.toEqual([instrument]);
    expect(builder.where).toHaveBeenCalledWith(
      'instrument.ticker ILIKE :pattern',
      {
        pattern: '%50\\%%',
      },
    );
    expect(builder.orWhere).toHaveBeenCalledWith(
      'instrument.name ILIKE :pattern',
      {
        pattern: '%50\\%%',
      },
    );
    expect(builder.orderBy).toHaveBeenCalledWith('instrument.ticker', 'ASC');
    expect(builder.limit).toHaveBeenCalledWith(50);
  });

  it('no consulta la base al buscar por una lista de ids vacía', async () => {
    const findBy = vi.fn();
    const repository = new InstrumentsTypeOrmRepository({
      findBy,
    } as unknown as Repository<InstrumentEntity>);

    await expect(repository.findByIds([])).resolves.toEqual([]);
    expect(findBy).not.toHaveBeenCalled();
  });

  it('busca varios instrumentos por id', async () => {
    const findBy = vi.fn().mockResolvedValue([instrument]);
    const repository = new InstrumentsTypeOrmRepository({
      findBy,
    } as unknown as Repository<InstrumentEntity>);

    await expect(repository.findByIds([1])).resolves.toEqual([instrument]);
    expect(findBy).toHaveBeenCalledOnce();
  });
});
