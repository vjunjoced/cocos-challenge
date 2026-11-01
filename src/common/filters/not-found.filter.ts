import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { NotFoundError } from '../errors/not-found.error.js';

@Catch(NotFoundError)
export class NotFoundFilter implements ExceptionFilter<NotFoundError> {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: NotFoundError, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;

    httpAdapter.reply(
      host.switchToHttp().getResponse(),
      { error: exception.code },
      HttpStatus.NOT_FOUND,
    );
  }
}
