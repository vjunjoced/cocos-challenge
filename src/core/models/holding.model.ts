import type { Decimal } from 'decimal.js';

export interface Holding {
  instrumentId: number;
  quantity: number;
  cost: Decimal;
}
