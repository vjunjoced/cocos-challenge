import { Module } from '@nestjs/common';
import { PersistenceModule } from '../persistence/persistence.module.js';
import { UsersController } from './controllers/users.controller.js';
import { UsersService } from './services/users.service.js';

@Module({
  imports: [PersistenceModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
