import { Decimal } from 'decimal.js';
import type { OrderEntity } from '../entities/order.entity.js';
import type { NewOrder } from '../../core/models/new-order.model.js';
import type {
  Order,
  OrderSide,
  OrderStatus,
  OrderType,
} from '../../core/models/order.model.js';

export function toOrder(entity: OrderEntity): Order {
  return {
    id: entity.id,
    instrumentId: entity.instrumentId,
    userId: entity.userId,
    size: entity.size,
    price: Number(entity.price),
    type: entity.type as OrderType,
    side: entity.side as OrderSide,
    status: entity.status as OrderStatus,
    datetime: entity.datetime,
  };
}

export function toOrderEntity(
  order: NewOrder,
  datetime: Date,
): Omit<OrderEntity, 'id'> {
  return {
    instrumentId: order.instrumentId,
    userId: order.userId,
    size: order.size,
    price: new Decimal(order.price).toFixed(2),
    type: order.type,
    side: order.side,
    status: order.status,
    datetime,
  };
}
