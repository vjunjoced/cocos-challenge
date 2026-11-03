import type { Decimal } from 'decimal.js';

/**
 * Tenencia de un usuario en un instrumento. Para el efectivo, `quantity` son
 * los pesos disponibles (con centavos) y `cost` es 0.
 */
export interface Position {
  instrumentId: number;
  quantity: Decimal;
  cost: Decimal;
}
