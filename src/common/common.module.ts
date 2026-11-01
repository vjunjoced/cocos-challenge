import { Global, Module, ValidationPipe } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_PIPE } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import type { AppConfig } from './config/configuration.js';
import configuration from './config/configuration.js';
import { validateEnv } from './config/env.validation.js';
import { ValidationFailedError } from './errors/validation-failed.error.js';
import { NotFoundFilter } from './filters/not-found.filter.js';
import { ValidationFailedFilter } from './filters/validation-failed.filter.js';
import { toValidationDetails } from './mappers/validation-details.mapper.js';
import { HealthController } from './health/health.controller.js';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnv,
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig, true>) => {
        const { ttlMs, maxRequests } = config.get('rateLimit', { infer: true });

        return { throttlers: [{ ttl: ttlMs, limit: maxRequests }] };
      },
    }),
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: NotFoundFilter },
    { provide: APP_FILTER, useClass: ValidationFailedFilter },
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        exceptionFactory: (errors) =>
          new ValidationFailedError(toValidationDetails(errors)),
      }),
    },
  ],
})
export class CommonModule {}
