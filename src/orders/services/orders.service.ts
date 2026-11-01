import { Inject, Injectable } from '@nestjs/common';
import { ERROR_CODE } from '../../common/constants/error-codes.constants.js';
import { VALIDATION_CODE } from '../../common/constants/validation.constants.js';
import { NotFoundError } from '../../common/errors/not-found.error.js';
import { ValidationFailedError } from '../../common/errors/validation-failed.error.js';
import {
  CASH_INSTRUMENT_ID,
  CASH_INSTRUMENT_TYPE,
  CASH_PRICE,
} from '../../core/constants/instrument.constants.js';
import { ORDER_TYPE } from '../../core/constants/order.constants.js';
import type { Order } from '../../core/models/order.model.js';
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
import { decideCashMovement } from '../calculators/cash-decision.calculator.js';
import { decideOrder } from '../calculators/order-decision.calculator.js';
import type { CashMovementRequest } from '../models/cash-movement-request.model.js';
import type { OrderRequest } from '../models/order-request.model.js';

@Injectable()
export class OrdersService {
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

  async placeOrder(request: OrderRequest): Promise<Order> {
    await this.assertUserExists(request.userId);
    const close = await this.resolveClose(request);

    return this.ordersRepository.withUserLock(request.userId, async (scope) => {
      const history = await scope.findFilledHistory();
      const decision = decideOrder(request, close, history);

      return scope.save({
        userId: request.userId,
        instrumentId: request.instrumentId,
        side: request.side,
        type: request.type,
        ...decision,
      });
    });
  }

  async placeCashMovement(request: CashMovementRequest): Promise<Order> {
    await this.assertUserExists(request.userId);

    return this.ordersRepository.withUserLock(request.userId, async (scope) => {
      const history = await scope.findFilledHistory();
      const status = decideCashMovement(request.side, request.amount, history);

      return scope.save({
        userId: request.userId,
        instrumentId: CASH_INSTRUMENT_ID,
        side: request.side,
        type: ORDER_TYPE.MARKET,
        size: request.amount,
        price: CASH_PRICE,
        status,
      });
    });
  }

  private async assertUserExists(userId: number): Promise<void> {
    if (!(await this.usersRepository.exists(userId))) {
      throw new NotFoundError(ERROR_CODE.USER_NOT_FOUND);
    }
  }

  /**
   * Valida el instrumento y devuelve el precio de ejecución de mercado. En una
   * LIMIT el precio lo envía el usuario, así que no se consulta.
   */
  private async resolveClose(request: OrderRequest): Promise<number> {
    const [instrument] = await this.instrumentsRepository.findByIds([
      request.instrumentId,
    ]);

    if (!instrument) {
      throw new NotFoundError(ERROR_CODE.INSTRUMENT_NOT_FOUND);
    }

    if (instrument.type === CASH_INSTRUMENT_TYPE) {
      throw new ValidationFailedError([
        { field: 'instrumentId', code: VALIDATION_CODE.NOT_TRADABLE },
      ]);
    }

    if (request.type === ORDER_TYPE.LIMIT) {
      return 0;
    }

    const [price] = await this.marketDataRepository.findLatestPrices([
      request.instrumentId,
    ]);

    if (!price) {
      throw new NotFoundError(ERROR_CODE.PRICE_NOT_FOUND);
    }

    return price.close;
  }
}
