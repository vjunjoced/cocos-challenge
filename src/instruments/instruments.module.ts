import { Module } from '@nestjs/common';
import { PersistenceModule } from '../persistence/persistence.module.js';
import { InstrumentsController } from './controllers/instruments.controller.js';
import { InstrumentsService } from './services/instruments.service.js';

@Module({
  imports: [PersistenceModule],
  controllers: [InstrumentsController],
  providers: [InstrumentsService],
})
export class InstrumentsModule {}
