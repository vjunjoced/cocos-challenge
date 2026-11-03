import { Decimal } from 'decimal.js';
import {
  ORDER_SIDE,
  ORDER_STATUS,
  ORDER_TYPE,
} from '../../core/constants/order.constants.js';
import type { OrderBalance } from '../models/order-balance.model.js';
import type { OrderDecision } from '../models/order-decision.model.js';
import type { OrderRequest } from '../models/order-request.model.js';

function resolveSize(request: OrderRequest, price: Decimal): number {
  if (request.size !== undefined) {
    return request.size;
  }

  if (price.isZero()) {
    return 0;
  }

  return new Decimal(request.amount ?? 0)
    .div(price)
    .toDecimalPlaces(0, Decimal.ROUND_DOWN)
    .toNumber();
}

function canAfford(
  request: OrderRequest,
  size: number,
  price: Decimal,
  balance: OrderBalance,
): boolean {
  if (request.side === ORDER_SIDE.BUY) {
    return balance.cash.gte(price.mul(size));
  }

  return balance.held >= size;
}

/**
 * MARKET se ejecuta al último `close`; LIMIT al precio enviado. Una orden sin
 * fondos o sin acciones (o cuyo monto no alcanza para una acción) queda
 * REJECTED, con el precio al que se habría ejecutado. `balance` es el saldo y
 * la tenencia actuales del usuario en ese instrumento.
 */
export function decideOrder(
  request: OrderRequest,
  close: number,
  balance: OrderBalance,
): OrderDecision {
  const isMarket = request.type === ORDER_TYPE.MARKET;
  const price = new Decimal(isMarket ? close : (request.price ?? 0));
  const size = resolveSize(request, price);

  if (size < 1 || !canAfford(request, size, price, balance)) {
    return { size, price: price.toNumber(), status: ORDER_STATUS.REJECTED };
  }

  return {
    size,
    price: price.toNumber(),
    status: isMarket ? ORDER_STATUS.FILLED : ORDER_STATUS.NEW,
  };
}
