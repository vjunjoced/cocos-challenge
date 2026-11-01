export const ORDER_TYPE = {
  MARKET: 'MARKET',
  LIMIT: 'LIMIT',
} as const;

export const ORDER_SIDE = {
  BUY: 'BUY',
  SELL: 'SELL',
  CASH_IN: 'CASH_IN',
  CASH_OUT: 'CASH_OUT',
} as const;

export const ORDER_STATUS = {
  NEW: 'NEW',
  FILLED: 'FILLED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
} as const;

export const ORDER_LIMITS = {
  MAX_SIZE: 2_147_483_647,
  MAX_MONEY: 99_999_999.99,
  MONEY_DECIMALS: 2,
} as const;
