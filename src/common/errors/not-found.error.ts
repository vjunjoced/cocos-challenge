import type { ErrorCode } from '../constants/error-codes.constants.js';

export class NotFoundError extends Error {
  constructor(readonly code: ErrorCode) {
    super(code);
    this.name = 'NotFoundError';
  }
}
