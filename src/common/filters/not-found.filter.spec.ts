import type { ArgumentsHost } from '@nestjs/common';
import type { HttpAdapterHost } from '@nestjs/core';
import { ERROR_CODE } from '../constants/error-codes.constants.js';
import { NotFoundError } from '../errors/not-found.error.js';
import { NotFoundFilter } from './not-found.filter.js';

describe('NotFoundFilter', () => {
  it('traduce NotFoundError a una respuesta 404', () => {
    const reply = vi.fn();
    const response = { id: 'response' };
    const adapterHost = {
      httpAdapter: { reply },
    } as unknown as HttpAdapterHost;
    const host = {
      switchToHttp: () => ({ getResponse: () => response }),
    } as unknown as ArgumentsHost;

    new NotFoundFilter(adapterHost).catch(
      new NotFoundError(ERROR_CODE.USER_NOT_FOUND),
      host,
    );

    expect(reply).toHaveBeenCalledWith(
      response,
      { error: 'USER_NOT_FOUND' },
      404,
    );
  });
});
