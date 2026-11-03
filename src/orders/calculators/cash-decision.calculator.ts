import type { Decimal } from 'decimal.js';
import {
  ORDER_SIDE,
  ORDER_STATUS,
} from '../../core/constants/order.constants.js';
import type { OrderStatus } from '../../core/models/order.model.js';

/**
 * Un ingreso de efectivo siempre se ejecuta; un egreso solo si hay saldo
 * suficiente.
 */
export function decideCashMovement(
  side: typeof ORDER_SIDE.CASH_IN | typeof ORDER_SIDE.CASH_OUT,
  amount: number,
  cash: Decimal,
): OrderStatus {
  if (side === ORDER_SIDE.CASH_IN) {
    return ORDER_STATUS.FILLED;
  }

  return cash.gte(amount) ? ORDER_STATUS.FILLED : ORDER_STATUS.REJECTED;
}
