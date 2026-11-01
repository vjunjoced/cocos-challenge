import { ValidationFailedError } from './validation-failed.error.js';

describe('ValidationFailedError', () => {
  it('conserva el detalle y se identifica por nombre', () => {
    const details = [{ field: 'q', code: 'IS_NOT_EMPTY' }];
    const error = new ValidationFailedError(details);

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('ValidationFailedError');
    expect(error.details).toBe(details);
  });
});
