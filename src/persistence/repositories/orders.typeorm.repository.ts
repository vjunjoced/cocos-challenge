import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ERROR_CODE } from '../../common/constants/error-codes.constants.js';
import { NotFoundError } from '../../common/errors/not-found.error.js';
import { ORDER_STATUS } from '../../core/constants/order.constants.js';
import { OrderEntity } from '../entities/order.entity.js';
import { UserEntity } from '../entities/user.entity.js';
import { toOrder, toOrderEntity } from '../mappers/order.mapper.js';
import type { Order } from '../../core/models/order.model.js';
import type { IOrdersRepository } from '../../core/repositories/orders.repository.js';
import type { IUserOrdersScope } from '../../core/repositories/user-orders-scope.js';

@Injectable()
export class OrdersTypeOrmRepository implements IOrdersRepository {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly repository: Repository<OrderEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async findFilledByUser(userId: number): Promise<Order[]> {
    const entities = await this.repository.find({
      where: { userId, status: ORDER_STATUS.FILLED },
      order: { datetime: 'ASC', id: 'ASC' },
    });

    return entities.map(toOrder);
  }

  withUserLock<T>(
    userId: number,
    work: (scope: IUserOrdersScope) => Promise<T>,
  ): Promise<T> {
    return this.dataSource.transaction(async (manager) => {
      const user = await manager.findOne(UserEntity, {
        where: { id: userId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!user) {
        throw new NotFoundError(ERROR_CODE.USER_NOT_FOUND);
      }

      return work({
        findFilledHistory: async () => {
          const entities = await manager.find(OrderEntity, {
            where: { userId, status: ORDER_STATUS.FILLED },
            order: { datetime: 'ASC', id: 'ASC' },
          });

          return entities.map(toOrder);
        },
        save: async (order) => {
          const entity = manager.create(
            OrderEntity,
            toOrderEntity(order, new Date()),
          );

          return toOrder(await manager.save(entity));
        },
      });
    });
  }
}
