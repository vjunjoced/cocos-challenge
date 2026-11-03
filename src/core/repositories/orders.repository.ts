import type { IUserOrdersScope } from './user-orders-scope.js';

export const ORDERS_REPOSITORY = Symbol('ORDERS_REPOSITORY');

export interface IOrdersRepository {
  /**
   * Ejecuta `work` dentro de una transacción que bloquea el saldo del usuario
   * (su fila de efectivo en `positions`): dos operaciones simultáneas del mismo
   * usuario se serializan, así no pueden gastar el mismo saldo. Garantiza que
   * esa fila exista (la crea si falta). Recibe una función (en lugar de exponer
   * begin/commit) para que el repositorio sea dueño de la transacción: hace
   * commit si `work` termina, rollback si falla y siempre libera la conexión y
   * el bloqueo.
   */
  withUserLock<T>(
    userId: number,
    work: (scope: IUserOrdersScope) => Promise<T>,
  ): Promise<T>;
}
