import type { ArgumentsHost } from '@nestjs/common';
import type { HttpAdapterHost } from '@nestjs/core';
import { ValidationFailedError } from '../errors/validation-failed.error.js';
import { ValidationFailedFilter } from './validation-failed.filter.js';

describe('ValidationFailedFilter', () => {
  it('traduce ValidationFailedError a una respuesta 400 con detalles', () => {
    const reply = vi.fn();
    const response = { id: 'response' };
    const adapterHost = {
      httpAdapter: { reply },
    } as unknown as HttpAdapterHost;
    const host = {
      switchToHttp: () => ({ getResponse: () => response }),
    } as unknown as ArgumentsHost;
    const details = [{ field: 'q', code: 'IS_NOT_EMPTY' }];

    new ValidationFailedFilter(adapterHost).catch(
      new ValidationFailedError(details),
      host,
    );

    expect(reply).toHaveBeenCalledWith(
      response,
      { error: 'VALIDATION_FAILED', details },
      400,
    );
  });
});
