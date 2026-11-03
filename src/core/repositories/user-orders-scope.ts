import type { NewOrder } from '../models/new-order.model.js';
import type { Order } from '../models/order.model.js';
import type { Position } from '../models/position.model.js';

/**
 * Operaciones disponibles mientras el saldo del usuario está bloqueado dentro
 * de una transacción. Solo datos: las decisiones de negocio viven fuera.
 */
export interface IUserOrdersScope {
  findPosition(instrumentId: number): Promise<Position | null>;
  savePosition(position: Position): Promise<void>;
  deletePosition(instrumentId: number): Promise<void>;
  saveOrder(order: NewOrder): Promise<Order>;
}
