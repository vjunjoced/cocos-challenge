import type {
  Order,
  OrderSide,
  OrderStatus,
  OrderType,
} from '../../../core/models/order.model.js';

export class OrderResponseDto {
  id: number;
  userId: number;
  instrumentId: number;
  side: OrderSide;
  type: OrderType;
  size: number;
  price: number;
  status: OrderStatus;
  datetime: Date;

  static from(order: Order): OrderResponseDto {
    return {
      id: order.id,
      userId: order.userId,
      instrumentId: order.instrumentId,
      side: order.side,
      type: order.type,
      size: order.size,
      price: order.price,
      status: order.status,
      datetime: order.datetime,
    };
  }
}
