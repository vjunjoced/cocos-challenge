import { Decimal } from 'decimal.js';
import { ORDER_SIDE } from '../constants/order.constants.js';
import type { AccountMovement } from '../models/account-movement.model.js';

/**
 * Pesos disponibles a partir del historial. `movements` debe contener solo
 * órdenes FILLED.
 */
export function calculateAvailableCash(movements: AccountMovement[]): Decimal {
  let cash = new Decimal(0);

  for (const movement of movements) {
    switch (movement.side) {
      case ORDER_SIDE.CASH_IN:
        cash = cash.add(movement.size);
        break;
      case ORDER_SIDE.CASH_OUT:
        cash = cash.sub(movement.size);
        break;
      case ORDER_SIDE.BUY:
        cash = cash.sub(new Decimal(movement.price).mul(movement.size));
        break;
      case ORDER_SIDE.SELL:
        cash = cash.add(new Decimal(movement.price).mul(movement.size));
        break;
    }
  }

  return cash;
}
