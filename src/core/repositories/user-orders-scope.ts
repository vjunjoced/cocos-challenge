import type { NewOrder } from '../models/new-order.model.js';
import type { Order } from '../models/order.model.js';

/**
 * Operaciones disponibles mientras el usuario está bloqueado dentro de una
 * transacción. Solo datos: las decisiones de negocio viven fuera.
 */
export interface IUserOrdersScope {
  findFilledHistory(): Promise<Order[]>;
  save(order: NewOrder): Promise<Order>;
}
