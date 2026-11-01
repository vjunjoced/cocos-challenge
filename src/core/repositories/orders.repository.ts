import type { Order } from '../models/order.model.js';
import type { IUserOrdersScope } from './user-orders-scope.js';

export const ORDERS_REPOSITORY = Symbol('ORDERS_REPOSITORY');

export interface IOrdersRepository {
  findFilledByUser(userId: number): Promise<Order[]>;

  /**
   * Ejecuta `work` dentro de una transacción que bloquea al usuario: dos
   * operaciones simultáneas del mismo usuario se serializan, así no pueden
   * gastar el mismo saldo. Recibe una función (en lugar de exponer begin/commit)
   * para que el repositorio sea dueño de la transacción: hace commit si `work`
   * termina, rollback si falla y siempre libera la conexión y el bloqueo.
   */
  withUserLock<T>(
    userId: number,
    work: (scope: IUserOrdersScope) => Promise<T>,
  ): Promise<T>;
}
