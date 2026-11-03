import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ERROR_CODE } from '../../common/constants/error-codes.constants.js';
import { NotFoundError } from '../../common/errors/not-found.error.js';
import { CASH_INSTRUMENT_ID } from '../../core/constants/instrument.constants.js';
import { OrderEntity } from '../entities/order.entity.js';
import { PositionEntity } from '../entities/position.entity.js';
import { UserEntity } from '../entities/user.entity.js';
import { toOrder, toOrderEntity } from '../mappers/order.mapper.js';
import {
  toPositionEntity,
  toPositionModel,
} from '../mappers/position.mapper.js';
import type { IOrdersRepository } from '../../core/repositories/orders.repository.js';
import type { IUserOrdersScope } from '../../core/repositories/user-orders-scope.js';

@Injectable()
export class OrdersTypeOrmRepository implements IOrdersRepository {
  constructor(private readonly dataSource: DataSource) {}

  withUserLock<T>(
    userId: number,
    work: (scope: IUserOrdersScope) => Promise<T>,
  ): Promise<T> {
    return this.dataSource.transaction(async (manager) => {
      const user = await manager.findOne(UserEntity, { where: { id: userId } });

      if (!user) {
        throw new NotFoundError(ERROR_CODE.USER_NOT_FOUND);
      }

      // La fila del efectivo siempre debe existir para poder bloquearla: se
      // crea solo si falta (usuarios anteriores a la tabla de posiciones).
      await manager
        .createQueryBuilder()
        .insert()
        .into(PositionEntity)
        .values({
          userId,
          instrumentId: CASH_INSTRUMENT_ID,
          quantity: '0',
          cost: '0',
          updatedAt: new Date(),
        })
        .orIgnore()
        .execute();
      await manager.findOne(PositionEntity, {
        where: { userId, instrumentId: CASH_INSTRUMENT_ID },
        lock: { mode: 'pessimistic_write' },
      });

      return work({
        findPosition: async (instrumentId) => {
          const entity = await manager.findOne(PositionEntity, {
            where: { userId, instrumentId },
          });

          return entity ? toPositionModel(entity) : null;
        },
        savePosition: async (position) => {
          await manager.upsert(
            PositionEntity,
            toPositionEntity(userId, position, new Date()),
            ['userId', 'instrumentId'],
          );
        },
        deletePosition: async (instrumentId) => {
          await manager.delete(PositionEntity, { userId, instrumentId });
        },
        saveOrder: async (order) => {
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
