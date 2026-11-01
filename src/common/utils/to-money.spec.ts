import { Decimal } from 'decimal.js';
import { toMoney } from './to-money.js';

describe('toMoney', () => {
  it('redondea a 2 decimales', () => {
    expect(toMoney(new Decimal('1.005'))).toBe(1.01);
    expect(toMoney(new Decimal('2.344'))).toBe(2.34);
  });

  it('redondea los empates hacia arriba (half up), no al par', () => {
    expect(toMoney(new Decimal('2.345'))).toBe(2.35);
    expect(toMoney(new Decimal('0.125'))).toBe(0.13);
  });

  it('no arrastra error de punto flotante', () => {
    expect(toMoney(new Decimal('0.1').add('0.2'))).toBe(0.3);
  });

  it('mantiene enteros y negativos', () => {
    expect(toMoney(new Decimal(1000))).toBe(1000);
    expect(toMoney(new Decimal('-0.125'))).toBe(-0.13);
  });
});
