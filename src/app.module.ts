import { Module } from '@nestjs/common';
import { CommonModule } from './common/common.module.js';
import { DatabaseModule } from './database/database.module.js';
import { InstrumentsModule } from './instruments/instruments.module.js';
import { OrdersModule } from './orders/orders.module.js';
import { PortfolioModule } from './portfolio/portfolio.module.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [
    CommonModule,
    DatabaseModule,
    PortfolioModule,
    InstrumentsModule,
    OrdersModule,
    UsersModule,
  ],
})
export class AppModule {}
