import type { OrderSide } from './order.model.js';

export interface AccountMovement {
  instrumentId: number;
  side: OrderSide;
  size: number;
  price: number;
}
