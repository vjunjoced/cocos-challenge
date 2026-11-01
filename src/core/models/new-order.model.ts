import type { Order } from './order.model.js';

export type NewOrder = Omit<Order, 'id' | 'datetime'>;
