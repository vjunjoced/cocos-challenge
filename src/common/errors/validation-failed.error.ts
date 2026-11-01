import { ERROR_CODE } from '../constants/error-codes.constants.js';
import type { ValidationDetail } from '../models/validation-detail.model.js';

export class ValidationFailedError extends Error {
  constructor(readonly details: ValidationDetail[]) {
    super(ERROR_CODE.VALIDATION_FAILED);
    this.name = 'ValidationFailedError';
  }
}
