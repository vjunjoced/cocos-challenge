import type { Decimal } from 'decimal.js';
import {
  MONEY_DECIMALS,
  MONEY_ROUNDING,
} from '../constants/money.constants.js';

export function toMoney(value: Decimal): number {
  return value.toDecimalPlaces(MONEY_DECIMALS, MONEY_ROUNDING).toNumber();
}
