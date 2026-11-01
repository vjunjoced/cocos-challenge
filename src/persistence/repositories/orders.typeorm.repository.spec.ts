import type { DataSource, Repository } from 'typeorm';
import { NotFoundError } from '../../common/errors/not-found.error.js';
import type { OrderEntity } from '../entities/order.entity.js';
import { OrdersTypeOrmRepository } from './orders.typeorm.repository.js';

describe('OrdersTypeOrmRepository', () => {
  const datetime = new Date('2023-07-12T12:31:20');

  it('trae las órdenes FILLED del usuario en orden cronológico', async () => {
    const find = vi.fn().mockResolvedValue([]);
    const repository = new OrdersTypeOrmRepository(
      { find } as unknown as Repository<OrderEntity>,
      {} as DataSource,
    );

    await repository.findFilledByUser(1);

    expect(find).toHaveBeenCalledWith({
      where: { userId: 1, status: 'FILLED' },
      order: { datetime: 'ASC', id: 'ASC' },
    });
  });

  it('convierte el precio numeric (string) a número', async () => {
    const find = vi.fn().mockResolvedValue([
      {
        id: 2,
        instrumentId: 47,
        userId: 1,
        size: 50,
        price: '930.50',
        type: 'MARKET',
        side: 'BUY',
        status: 'FILLED',
        datetime,
      },
    ]);
    const repository = new OrdersTypeOrmRepository(
      { find } as unknown as Repository<OrderEntity>,
      {} as DataSource,
    );

    await expect(repository.findFilledByUser(1)).resolves.toEqual([
      {
        id: 2,
        instrumentId: 47,
        userId: 1,
        size: 50,
        price: 930.5,
        type: 'MARKET',
        side: 'BUY',
        status: 'FILLED',
        datetime,
      },
    ]);
  });
});

describe('OrdersTypeOrmRepository.withUserLock', () => {
  const datetime = new Date('2023-07-12T12:31:20');
  const entity = {
    id: 9,
    instrumentId: 47,
    userId: 1,
    size: 10,
    price: '100.00',
    type: 'MARKET',
    side: 'BUY',
    status: 'FILLED',
    datetime,
  };

  const build = (user: object | null, history: object[] = []) => {
    const manager = {
      findOne: vi.fn().mockResolvedValue(user),
      find: vi.fn().mockResolvedValue(history),
      create: vi.fn((_entity: unknown, values: object) => values),
      save: vi.fn((values: object) => Promise.resolve({ id: 9, ...values })),
    };
    const dataSource = {
      transaction: vi.fn((work: (m: typeof manager) => Promise<unknown>) =>
        work(manager),
      ),
    };
    const repository = new OrdersTypeOrmRepository(
      {} as unknown as Repository<OrderEntity>,
      dataSource as unknown as DataSource,
    );

    return { repository, manager, dataSource };
  };

  const newOrder = {
    instrumentId: 47,
    userId: 1,
    size: 10,
    price: 100,
    type: 'MARKET',
    side: 'BUY',
    status: 'FILLED',
  } as const;

  it('bloquea al usuario con FOR UPDATE dentro de una transacción', async () => {
    const { repository, manager, dataSource } = build({ id: 1 });

    await repository.withUserLock(1, () => Promise.resolve());

    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    expect(manager.findOne).toHaveBeenCalledWith(expect.anything(), {
      where: { id: 1 },
      lock: { mode: 'pessimistic_write' },
    });
  });

  it('entrega el historial FILLED como modelos', async () => {
    const { repository, manager } = build({ id: 1 }, [entity]);

    const history = await repository.withUserLock(1, (scope) =>
      scope.findFilledHistory(),
    );

    expect(manager.find).toHaveBeenCalledWith(expect.anything(), {
      where: { userId: 1, status: 'FILLED' },
      order: { datetime: 'ASC', id: 'ASC' },
    });
    expect(history).toEqual([
      expect.objectContaining({ id: 9, price: 100, size: 10 }),
    ]);
  });

  it('guarda la orden con el precio en string de 2 decimales y devuelve el modelo', async () => {
    const { repository, manager } = build({ id: 1 });

    const result = await repository.withUserLock(1, (scope) =>
      scope.save({ ...newOrder, price: 930.5 }),
    );

    expect(manager.save).toHaveBeenCalledWith(
      expect.objectContaining({ price: '930.50', status: 'FILLED' }),
    );
    expect(result).toEqual(
      expect.objectContaining({ id: 9, price: 930.5, userId: 1 }),
    );
  });

  it('lanza NotFoundError y no ejecuta el trabajo si el usuario no existe', async () => {
    const { repository } = build(null);
    const work = vi.fn();

    await expect(repository.withUserLock(1, work)).rejects.toThrow(
      NotFoundError,
    );
    expect(work).not.toHaveBeenCalled();
  });

  it('propaga el error del trabajo sin guardar nada', async () => {
    const { repository, manager } = build({ id: 1 });

    await expect(
      repository.withUserLock(1, () => Promise.reject(new Error('boom'))),
    ).rejects.toThrow('boom');
    expect(manager.save).not.toHaveBeenCalled();
  });
});
