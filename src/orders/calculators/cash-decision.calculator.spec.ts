import { Decimal } from 'decimal.js';
import { decideCashMovement } from './cash-decision.calculator.js';

describe('decideCashMovement', () => {
  it('ejecuta un ingreso aunque no haya saldo', () => {
    expect(decideCashMovement('CASH_IN', 1_000, new Decimal(0))).toBe('FILLED');
  });

  it('ejecuta un egreso cuando hay saldo suficiente', () => {
    expect(decideCashMovement('CASH_OUT', 500, new Decimal(1_000))).toBe(
      'FILLED',
    );
  });

  it('ejecuta un egreso por exactamente todo el saldo', () => {
    expect(decideCashMovement('CASH_OUT', 1_000, new Decimal(1_000))).toBe(
      'FILLED',
    );
  });

  it('rechaza un egreso mayor al saldo', () => {
    expect(decideCashMovement('CASH_OUT', 1_001, new Decimal(1_000))).toBe(
      'REJECTED',
    );
  });

  it('considera los centavos del saldo', () => {
    expect(decideCashMovement('CASH_OUT', 1_000, new Decimal('999.99'))).toBe(
      'REJECTED',
    );
  });

  it('rechaza un egreso con saldo 0', () => {
    expect(decideCashMovement('CASH_OUT', 1, new Decimal(0))).toBe('REJECTED');
  });
});
