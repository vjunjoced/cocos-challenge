import type { DataSource } from 'typeorm';
import { Decimal } from 'decimal.js';
import { NotFoundError } from '../../common/errors/not-found.error.js';
import { OrdersTypeOrmRepository } from './orders.typeorm.repository.js';

describe('OrdersTypeOrmRepository.withUserLock', () => {
  const build = (user: object | null = { id: 1 }) => {
    const insertBuilder = {
      insert: vi.fn().mockReturnThis(),
      into: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      orIgnore: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValue(undefined),
    };
    const manager = {
      findOne: vi.fn((entity: { name: string }) =>
        Promise.resolve(entity.name === 'UserEntity' ? user : { userId: 1 }),
      ),
      createQueryBuilder: vi.fn(() => insertBuilder),
      upsert: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
      create: vi.fn((_entity: unknown, values: object) => values),
      save: vi.fn((values: object) => Promise.resolve({ id: 9, ...values })),
    };
    const dataSource = {
      transaction: vi.fn((work: (m: typeof manager) => Promise<unknown>) =>
        work(manager),
      ),
    };

    return {
      repository: new OrdersTypeOrmRepository(
        dataSource as unknown as DataSource,
      ),
      manager,
      insertBuilder,
      dataSource,
    };
  };

  it('abre una transacción, asegura la fila de efectivo y la bloquea con FOR UPDATE', async () => {
    const { repository, manager, insertBuilder, dataSource } = build();

    await repository.withUserLock(1, () => Promise.resolve());

    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    expect(insertBuilder.values).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 1, instrumentId: 66, quantity: '0' }),
    );
    expect(insertBuilder.orIgnore).toHaveBeenCalled();
    expect(manager.findOne).toHaveBeenLastCalledWith(expect.anything(), {
      where: { userId: 1, instrumentId: 66 },
      lock: { mode: 'pessimistic_write' },
    });
  });

  it('lanza NotFoundError y no ejecuta el trabajo si el usuario no existe', async () => {
    const { repository } = build(null);
    const work = vi.fn();

    await expect(repository.withUserLock(1, work)).rejects.toThrow(
      NotFoundError,
    );
    expect(work).not.toHaveBeenCalled();
  });

  it('findPosition devuelve la posición como modelo, o null si no existe', async () => {
    const { repository, manager } = build();
    manager.findOne.mockImplementation((entity: { name: string }) =>
      Promise.resolve(
        entity.name === 'UserEntity'
          ? { id: 1 }
          : {
              userId: 1,
              instrumentId: 47,
              quantity: '5.00',
              cost: '500.000000',
            },
      ),
    );

    const found = await repository.withUserLock(1, (scope) =>
      scope.findPosition(47),
    );

    expect(found?.quantity.toNumber()).toBe(5);
    expect(found?.cost.toNumber()).toBe(500);
  });

  it('savePosition hace upsert por (userId, instrumentId) con escalas de columna', async () => {
    const { repository, manager } = build();

    await repository.withUserLock(1, (scope) =>
      scope.savePosition({
        instrumentId: 47,
        quantity: new Decimal(3),
        cost: new Decimal('925.85'),
      }),
    );

    expect(manager.upsert).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        userId: 1,
        instrumentId: 47,
        quantity: '3.00',
        cost: '925.850000',
      }),
      ['userId', 'instrumentId'],
    );
  });

  it('deletePosition elimina la fila del usuario y el instrumento', async () => {
    const { repository, manager } = build();

    await repository.withUserLock(1, (scope) => scope.deletePosition(47));

    expect(manager.delete).toHaveBeenCalledWith(expect.anything(), {
      userId: 1,
      instrumentId: 47,
    });
  });

  it('saveOrder guarda la orden con el precio en string de 2 decimales y devuelve el modelo', async () => {
    const { repository, manager } = build();

    const result = await repository.withUserLock(1, (scope) =>
      scope.saveOrder({
        instrumentId: 47,
        userId: 1,
        size: 10,
        price: 930.5,
        type: 'MARKET',
        side: 'BUY',
        status: 'FILLED',
      }),
    );

    expect(manager.save).toHaveBeenCalledWith(
      expect.objectContaining({ price: '930.50', status: 'FILLED' }),
    );
    expect(result).toEqual(
      expect.objectContaining({ id: 9, price: 930.5, userId: 1 }),
    );
  });

  it('propaga el error del trabajo sin guardar nada', async () => {
    const { repository, manager } = build();

    await expect(
      repository.withUserLock(1, () => Promise.reject(new Error('boom'))),
    ).rejects.toThrow('boom');
    expect(manager.save).not.toHaveBeenCalled();
  });
});
