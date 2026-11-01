import { Module } from '@nestjs/common';
import { PersistenceModule } from '../persistence/persistence.module.js';
import { PortfolioController } from './controllers/portfolio.controller.js';
import { PortfolioService } from './services/portfolio.service.js';

@Module({
  imports: [PersistenceModule],
  controllers: [PortfolioController],
  providers: [PortfolioService],
})
export class PortfolioModule {}
