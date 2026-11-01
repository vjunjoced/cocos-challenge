import type { OrderStatus } from '../../core/models/order.model.js';

export interface OrderDecision {
  size: number;
  price: number;
  status: OrderStatus;
}
