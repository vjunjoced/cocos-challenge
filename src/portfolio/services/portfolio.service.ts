import { Inject, Injectable } from '@nestjs/common';
import { ERROR_CODE } from '../../common/constants/error-codes.constants.js';
import { NotFoundError } from '../../common/errors/not-found.error.js';
import { ORDER_SIDE } from '../../core/constants/order.constants.js';
import {
  INSTRUMENTS_REPOSITORY,
  type IInstrumentsRepository,
} from '../../core/repositories/instruments.repository.js';
import {
  MARKET_DATA_REPOSITORY,
  type IMarketDataRepository,
} from '../../core/repositories/market-data.repository.js';
import {
  ORDERS_REPOSITORY,
  type IOrdersRepository,
} from '../../core/repositories/orders.repository.js';
import {
  USERS_REPOSITORY,
  type IUsersRepository,
} from '../../core/repositories/users.repository.js';
import { calculatePortfolio } from '../calculators/portfolio.calculator.js';
import type { Portfolio } from '../models/portfolio.model.js';

@Injectable()
export class PortfolioService {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
    @Inject(ORDERS_REPOSITORY)
    private readonly ordersRepository: IOrdersRepository,
    @Inject(MARKET_DATA_REPOSITORY)
    private readonly marketDataRepository: IMarketDataRepository,
    @Inject(INSTRUMENTS_REPOSITORY)
    private readonly instrumentsRepository: IInstrumentsRepository,
  ) {}

  async getPortfolio(userId: number): Promise<Portfolio> {
    const existsUser = await this.usersRepository.exists(userId);
    if (!existsUser) throw new NotFoundError(ERROR_CODE.USER_NOT_FOUND);

    const orders = await this.ordersRepository.findFilledByUser(userId);
    const tradedInstrumentIds = [
      ...new Set(
        orders
          .filter(
            ({ side }) => side === ORDER_SIDE.BUY || side === ORDER_SIDE.SELL,
          )
          .map(({ instrumentId }) => instrumentId),
      ),
    ];
    const [prices, instruments] = await Promise.all([
      this.marketDataRepository.findLatestPrices(tradedInstrumentIds),
      this.instrumentsRepository.findByIds(tradedInstrumentIds),
    ]);

    return calculatePortfolio(orders, prices, instruments);
  }
}
