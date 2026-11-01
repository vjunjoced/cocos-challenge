import type {
  ORDER_SIDE,
  ORDER_STATUS,
  ORDER_TYPE,
} from '../constants/order.constants.js';

export type OrderType = (typeof ORDER_TYPE)[keyof typeof ORDER_TYPE];
export type OrderSide = (typeof ORDER_SIDE)[keyof typeof ORDER_SIDE];
export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

export interface Order {
  id: number;
  instrumentId: number;
  userId: number;
  size: number;
  price: number;
  type: OrderType;
  side: OrderSide;
  status: OrderStatus;
  datetime: Date;
}
