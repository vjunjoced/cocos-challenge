import { Decimal } from 'decimal.js';
import { ORDER_SIDE } from '../constants/order.constants.js';
import type { AccountMovement } from '../models/account-movement.model.js';
import type { Position } from '../models/position.model.js';

export interface TradeResult {
  cash: Position;
  holding: Position | null;
}

export function applyCashMovement(
  side: typeof ORDER_SIDE.CASH_IN | typeof ORDER_SIDE.CASH_OUT,
  amount: number,
  cash: Position,
): Position {
  const signed = side === ORDER_SIDE.CASH_IN ? amount : -amount;

  return { ...cash, quantity: cash.quantity.add(signed) };
}

/**
 * Efecto de una compra o venta ejecutada sobre el efectivo y la tenencia del
 * activo. `holding: null` significa que la fila del activo debe eliminarse
 * (venta total). Usa costo promedio móvil: el promedio no cambia al vender.
 */
export function applyTrade(
  movement: AccountMovement,
  cash: Position,
  holding: Position | null,
): TradeResult {
  const amount = new Decimal(movement.price).mul(movement.size);

  if (movement.side === ORDER_SIDE.BUY) {
    return {
      cash: { ...cash, quantity: cash.quantity.sub(amount) },
      holding: {
        instrumentId: movement.instrumentId,
        quantity: (holding?.quantity ?? new Decimal(0)).add(movement.size),
        cost: (holding?.cost ?? new Decimal(0)).add(amount),
      },
    };
  }

  if (!holding) {
    return { cash, holding: null };
  }

  const remaining = holding.quantity.sub(movement.size);
  const soldCost = holding.cost.mul(movement.size).div(holding.quantity);

  return {
    cash: { ...cash, quantity: cash.quantity.add(amount) },
    holding: remaining.lte(0)
      ? null
      : { ...holding, quantity: remaining, cost: holding.cost.sub(soldCost) },
  };
}
