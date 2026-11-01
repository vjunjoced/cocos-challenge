import type { ORDER_SIDE } from '../../core/constants/order.constants.js';

export interface CashMovementRequest {
  userId: number;
  side: typeof ORDER_SIDE.CASH_IN | typeof ORDER_SIDE.CASH_OUT;
  amount: number;
}
