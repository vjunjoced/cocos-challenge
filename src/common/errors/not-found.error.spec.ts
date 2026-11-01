import { ERROR_CODE } from '../constants/error-codes.constants.js';
import { NotFoundError } from './not-found.error.js';

describe('NotFoundError', () => {
  it('conserva el código y se identifica por nombre', () => {
    const error = new NotFoundError(ERROR_CODE.USER_NOT_FOUND);

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('NotFoundError');
    expect(error.code).toBe('USER_NOT_FOUND');
  });
});
