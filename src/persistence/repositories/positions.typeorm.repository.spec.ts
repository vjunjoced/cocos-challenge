import type { Repository } from 'typeorm';
import type { PositionEntity } from '../entities/position.entity.js';
import { PositionsTypeOrmRepository } from './positions.typeorm.repository.js';

describe('PositionsTypeOrmRepository', () => {
  it('trae las posiciones del usuario como modelos', async () => {
    const find = vi.fn().mockResolvedValue([
      {
        userId: 1,
        instrumentId: 66,
        quantity: '707100.00',
        cost: '0.000000',
        updatedAt: new Date(),
      },
    ]);
    const repository = new PositionsTypeOrmRepository({
      find,
    } as unknown as Repository<PositionEntity>);

    const positions = await repository.findByUser(1);

    expect(find).toHaveBeenCalledWith({ where: { userId: 1 } });
    expect(positions).toHaveLength(1);
    expect(positions[0]?.quantity.toNumber()).toBe(707_100);
  });

  it('devuelve vacío si el usuario no tiene posiciones', async () => {
    const repository = new PositionsTypeOrmRepository({
      find: vi.fn().mockResolvedValue([]),
    } as unknown as Repository<PositionEntity>);

    await expect(repository.findByUser(9)).resolves.toEqual([]);
  });
});
