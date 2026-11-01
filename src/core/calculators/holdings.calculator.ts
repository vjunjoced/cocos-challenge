import { Decimal } from 'decimal.js';
import { ORDER_SIDE } from '../constants/order.constants.js';
import type { AccountMovement } from '../models/account-movement.model.js';
import type { Holding } from '../models/holding.model.js';

function applyBuy(holdings: Map<number, Holding>, movement: AccountMovement) {
  const holding = holdings.get(movement.instrumentId) ?? {
    instrumentId: movement.instrumentId,
    quantity: 0,
    cost: new Decimal(0),
  };

  holding.quantity += movement.size;
  holding.cost = holding.cost.add(
    new Decimal(movement.price).mul(movement.size),
  );
  holdings.set(movement.instrumentId, holding);
}

function applySell(holdings: Map<number, Holding>, movement: AccountMovement) {
  const holding = holdings.get(movement.instrumentId);

  if (!holding) {
    return;
  }

  const soldCost = holding.cost.mul(movement.size).div(holding.quantity);

  holding.quantity -= movement.size;
  holding.cost = holding.cost.sub(soldCost);

  if (holding.quantity <= 0) {
    holdings.delete(movement.instrumentId);
  }
}

/**
 * Tenencia por activo con costo promedio móvil. `movements` debe contener solo
 * órdenes FILLED, ordenadas cronológicamente.
 */
export function calculateHoldings(
  movements: AccountMovement[],
): Map<number, Holding> {
  const holdings = new Map<number, Holding>();

  for (const movement of movements) {
    if (movement.side === ORDER_SIDE.BUY) {
      applyBuy(holdings, movement);
    } else if (movement.side === ORDER_SIDE.SELL) {
      applySell(holdings, movement);
    }
  }

  return holdings;
}
