import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InstrumentEntity } from './entities/instrument.entity.js';
import { MarketDataEntity } from './entities/market-data.entity.js';
import { OrderEntity } from './entities/order.entity.js';
import { PositionEntity } from './entities/position.entity.js';
import { UserEntity } from './entities/user.entity.js';
import { INSTRUMENTS_REPOSITORY } from '../core/repositories/instruments.repository.js';
import { InstrumentsTypeOrmRepository } from './repositories/instruments.typeorm.repository.js';
import { MARKET_DATA_REPOSITORY } from '../core/repositories/market-data.repository.js';
import { MarketDataTypeOrmRepository } from './repositories/market-data.typeorm.repository.js';
import { ORDERS_REPOSITORY } from '../core/repositories/orders.repository.js';
import { OrdersTypeOrmRepository } from './repositories/orders.typeorm.repository.js';
import { POSITIONS_REPOSITORY } from '../core/repositories/positions.repository.js';
import { PositionsTypeOrmRepository } from './repositories/positions.typeorm.repository.js';
import { USERS_REPOSITORY } from '../core/repositories/users.repository.js';
import { UsersTypeOrmRepository } from './repositories/users.typeorm.repository.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      OrderEntity,
      MarketDataEntity,
      InstrumentEntity,
      PositionEntity,
    ]),
  ],
  providers: [
    { provide: USERS_REPOSITORY, useClass: UsersTypeOrmRepository },
    { provide: ORDERS_REPOSITORY, useClass: OrdersTypeOrmRepository },
    { provide: MARKET_DATA_REPOSITORY, useClass: MarketDataTypeOrmRepository },
    { provide: INSTRUMENTS_REPOSITORY, useClass: InstrumentsTypeOrmRepository },
    { provide: POSITIONS_REPOSITORY, useClass: PositionsTypeOrmRepository },
  ],
  exports: [
    USERS_REPOSITORY,
    ORDERS_REPOSITORY,
    MARKET_DATA_REPOSITORY,
    INSTRUMENTS_REPOSITORY,
    POSITIONS_REPOSITORY,
  ],
})
export class PersistenceModule {}
