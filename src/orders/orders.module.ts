import { Module } from '@nestjs/common';
import { PersistenceModule } from '../persistence/persistence.module.js';
import { OrdersController } from './controllers/orders.controller.js';
import { OrdersService } from './services/orders.service.js';

@Module({
  imports: [PersistenceModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
