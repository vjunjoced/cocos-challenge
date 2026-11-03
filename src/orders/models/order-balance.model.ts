import type { Decimal } from 'decimal.js';

export interface OrderBalance {
  cash: Decimal;
  held: number;
}
