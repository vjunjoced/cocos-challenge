import { calculateAvailableCash } from '../../core/calculators/cash.calculator.js';
import {
  ORDER_SIDE,
  ORDER_STATUS,
} from '../../core/constants/order.constants.js';
import type { AccountMovement } from '../../core/models/account-movement.model.js';
import type { OrderStatus } from '../../core/models/order.model.js';

/**
 * Un ingreso de efectivo siempre se ejecuta; un egreso solo si hay saldo
 * suficiente. `movements` son las órdenes FILLED del usuario.
 */
export function decideCashMovement(
  side: typeof ORDER_SIDE.CASH_IN | typeof ORDER_SIDE.CASH_OUT,
  amount: number,
  movements: AccountMovement[],
): OrderStatus {
  if (side === ORDER_SIDE.CASH_IN) {
    return ORDER_STATUS.FILLED;
  }

  return calculateAvailableCash(movements).gte(amount)
    ? ORDER_STATUS.FILLED
    : ORDER_STATUS.REJECTED;
}
