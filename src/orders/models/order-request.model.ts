import type { OrderSide, OrderType } from '../../core/models/order.model.js';

export interface OrderRequest {
  userId: number;
  instrumentId: number;
  side: OrderSide;
  type: OrderType;
  size?: number;
  amount?: number;
  price?: number;
}
