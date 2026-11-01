import type { ValidationError } from 'class-validator';
import { toValidationDetails } from './validation-details.mapper.js';

const error = (
  property: string,
  constraints?: Record<string, string>,
  children?: ValidationError[],
): ValidationError => ({ property, constraints, children });

describe('toValidationDetails', () => {
  it('genera un detalle por cada regla incumplida', () => {
    const result = toValidationDetails([
      error('q', { isNotEmpty: 'x', maxLength: 'y' }),
    ]);

    expect(result).toEqual([
      { field: 'q', code: 'IS_NOT_EMPTY' },
      { field: 'q', code: 'MAX_LENGTH' },
    ]);
  });

  it('traduce un campo no declarado a NOT_ALLOWED', () => {
    expect(
      toValidationDetails([error('extra', { whitelistValidation: 'x' })]),
    ).toEqual([{ field: 'extra', code: 'NOT_ALLOWED' }]);
  });

  it('aplana errores anidados con la ruta del campo', () => {
    const result = toValidationDetails([
      error('item', undefined, [error('size', { min: 'x' })]),
    ]);

    expect(result).toEqual([{ field: 'item.size', code: 'MIN' }]);
  });

  it('devuelve vacío si no hay errores', () => {
    expect(toValidationDetails([])).toEqual([]);
  });
});
