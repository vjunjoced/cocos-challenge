import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import type { AppConfig } from '../common/config/configuration.js';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig, true>) => {
        const { uri, pool } = config.get('database', { infer: true });

        return {
          type: 'postgres',
          url: uri,
          autoLoadEntities: true,
          synchronize: false,
          poolSize: pool.max,
          connectTimeoutMS: pool.connectTimeoutMs,
          extra: {
            min: pool.min,
            idleTimeoutMillis: pool.idleTimeoutMs,
          },
        };
      },
    }),
  ],
})
export class DatabaseModule {}
