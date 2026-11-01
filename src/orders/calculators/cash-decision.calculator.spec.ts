import type { AccountMovement } from '../../core/models/account-movement.model.js';
import { decideCashMovement } from './cash-decision.calculator.js';

const cashIn = (size: number): AccountMovement => ({
  instrumentId: 66,
  side: 'CASH_IN',
  size,
  price: 1,
});

describe('decideCashMovement', () => {
  it('ejecuta un ingreso aunque no haya saldo', () => {
    expect(decideCashMovement('CASH_IN', 1_000, [])).toBe('FILLED');
  });

  it('ejecuta un egreso cuando hay saldo suficiente', () => {
    expect(decideCashMovement('CASH_OUT', 500, [cashIn(1_000)])).toBe('FILLED');
  });

  it('ejecuta un egreso por exactamente todo el saldo', () => {
    expect(decideCashMovement('CASH_OUT', 1_000, [cashIn(1_000)])).toBe(
      'FILLED',
    );
  });

  it('rechaza un egreso mayor al saldo', () => {
    expect(decideCashMovement('CASH_OUT', 1_001, [cashIn(1_000)])).toBe(
      'REJECTED',
    );
  });

  it('rechaza un egreso sin historial', () => {
    expect(decideCashMovement('CASH_OUT', 1, [])).toBe('REJECTED');
  });
});
