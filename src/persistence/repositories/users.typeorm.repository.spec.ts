import { Decimal } from 'decimal.js';
import type { DataSource, Repository } from 'typeorm';
import type { UserEntity } from '../entities/user.entity.js';
import { UsersTypeOrmRepository } from './users.typeorm.repository.js';

describe('UsersTypeOrmRepository', () => {
  it('exists consulta por id', async () => {
    const existsBy = vi.fn().mockResolvedValue(true);
    const repository = new UsersTypeOrmRepository(
      { existsBy } as unknown as Repository<UserEntity>,
      {} as DataSource,
    );

    await expect(repository.exists(7)).resolves.toBe(true);
    expect(existsBy).toHaveBeenCalledWith({ id: 7 });
  });

  it('crea el usuario y sus posiciones iniciales en una transacción', async () => {
    const manager = {
      create: vi.fn((_entity: unknown, values: object) => values),
      save: vi.fn((values: object) => Promise.resolve({ id: 12, ...values })),
      insert: vi.fn().mockResolvedValue(undefined),
    };
    const dataSource = {
      transaction: vi.fn((work: (m: typeof manager) => Promise<unknown>) =>
        work(manager),
      ),
    };
    const repository = new UsersTypeOrmRepository(
      {} as Repository<UserEntity>,
      dataSource as unknown as DataSource,
    );

    const user = await repository.createWithPositions(
      { email: 'a@b.com', accountNumber: '1001' },
      [{ instrumentId: 66, quantity: new Decimal(0), cost: new Decimal(0) }],
    );

    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    expect(user).toEqual({ id: 12, email: 'a@b.com', accountNumber: '1001' });
    expect(manager.insert).toHaveBeenCalledWith(expect.anything(), [
      expect.objectContaining({
        userId: 12,
        instrumentId: 66,
        quantity: '0.00',
        cost: '0.000000',
      }),
    ]);
  });
});
