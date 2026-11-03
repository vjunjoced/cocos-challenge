import type { Decimal } from 'decimal.js';
import { MONEY_ROUNDING } from '../constants/money.constants.js';

/**
 * Texto con exactamente `decimals` decimales, para columnas `numeric`. Redondea
 * con el mismo modo explícito que `toMoney` y nunca usa notación exponencial.
 */
export function toDecimalString(value: Decimal, decimals: number): string {
  return value.toFixed(decimals, MONEY_ROUNDING);
}
