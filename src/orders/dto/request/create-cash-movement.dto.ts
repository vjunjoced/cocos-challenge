import { IsIn, IsInt, Max, Min } from 'class-validator';
import {
  ORDER_LIMITS,
  ORDER_SIDE,
} from '../../../core/constants/order.constants.js';
import type { CashMovementRequest } from '../../models/cash-movement-request.model.js';

export class CreateCashMovementDto implements CashMovementRequest {
  @IsInt()
  @Min(1)
  userId: number;

  @IsIn([ORDER_SIDE.CASH_IN, ORDER_SIDE.CASH_OUT])
  side: typeof ORDER_SIDE.CASH_IN | typeof ORDER_SIDE.CASH_OUT;

  @IsInt()
  @Min(1)
  @Max(ORDER_LIMITS.MAX_SIZE)
  amount: number;
}
