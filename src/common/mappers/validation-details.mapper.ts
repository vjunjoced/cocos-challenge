import type { ValidationError } from 'class-validator';
import { VALIDATION_CODE_BY_CONSTRAINT } from '../constants/validation.constants.js';
import type { ValidationDetail } from '../models/validation-detail.model.js';
import { toConstantCase } from '../utils/to-constant-case.js';

export function toValidationDetails(
  errors: ValidationError[],
  parentPath = '',
): ValidationDetail[] {
  return errors.flatMap((error) => {
    const field = parentPath
      ? `${parentPath}.${error.property}`
      : error.property;
    const own = Object.keys(error.constraints ?? {}).map((constraint) => ({
      field,
      code:
        VALIDATION_CODE_BY_CONSTRAINT[constraint] ?? toConstantCase(constraint),
    }));

    return [...own, ...toValidationDetails(error.children ?? [], field)];
  });
}
