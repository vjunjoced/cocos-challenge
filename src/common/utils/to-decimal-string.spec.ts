import { Decimal } from 'decimal.js';
import { toDecimalString } from './to-decimal-string.js';

describe('toDecimalString', () => {
  it('completa con ceros hasta la cantidad de decimales', () => {
    expect(toDecimalString(new Decimal(5), 2)).toBe('5.00');
    expect(toDecimalString(new Decimal('840'), 6)).toBe('840.000000');
  });

  it('no altera un valor que ya cabe en la escala', () => {
    expect(toDecimalString(new Decimal('7222.45'), 2)).toBe('7222.45');
  });

  it('redondea con el modo explícito (half up) cuando no cabe', () => {
    expect(toDecimalString(new Decimal('1.005'), 2)).toBe('1.01');
    expect(
      toDecimalString(new Decimal('1000').sub(new Decimal(1000).div(3)), 6),
    ).toBe('666.666667');
  });

  it('no usa notación exponencial con valores grandes', () => {
    expect(toDecimalString(new Decimal('1e21'), 2)).toBe(
      '1000000000000000000000.00',
    );
  });
});
