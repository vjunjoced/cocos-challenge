import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { ERROR_CODE } from '../constants/error-codes.constants.js';
import { ValidationFailedError } from '../errors/validation-failed.error.js';

@Catch(ValidationFailedError)
export class ValidationFailedFilter implements ExceptionFilter<ValidationFailedError> {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: ValidationFailedError, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;

    httpAdapter.reply(
      host.switchToHttp().getResponse(),
      { error: ERROR_CODE.VALIDATION_FAILED, details: exception.details },
      HttpStatus.BAD_REQUEST,
    );
  }
}
