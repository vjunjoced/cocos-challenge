import {
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { IsAbsentWhen } from '../../../common/utils/is-absent-when.js';
import {
  ORDER_LIMITS,
  ORDER_SIDE,
  ORDER_TYPE,
} from '../../../core/constants/order.constants.js';
import type { OrderSide, OrderType } from '../../../core/models/order.model.js';

const MONEY_OPTIONS = {
  allowNaN: false,
  allowInfinity: false,
  maxDecimalPlaces: ORDER_LIMITS.MONEY_DECIMALS,
};

export class CreateOrderDto {
  @IsInt()
  @Min(1)
  userId: number;

  @IsInt()
  @Min(1)
  instrumentId: number;

  @IsIn([ORDER_SIDE.BUY, ORDER_SIDE.SELL])
  side: OrderSide;

  @IsIn(Object.values(ORDER_TYPE))
  type: OrderType;

  @ValidateIf((order: CreateOrderDto) => order.amount === undefined)
  @IsInt()
  @Min(1)
  @Max(ORDER_LIMITS.MAX_SIZE)
  size?: number;

  @IsOptional()
  @IsNumber(MONEY_OPTIONS)
  @IsPositive()
  @Max(ORDER_LIMITS.MAX_MONEY)
  @IsAbsentWhen<CreateOrderDto>((order) => order.size !== undefined)
  amount?: number;

  @ValidateIf(
    (order: CreateOrderDto) =>
      order.type === ORDER_TYPE.LIMIT || order.price !== undefined,
  )
  @IsNumber(MONEY_OPTIONS)
  @IsPositive()
  @Max(ORDER_LIMITS.MAX_MONEY)
  @IsAbsentWhen<CreateOrderDto>((order) => order.type === ORDER_TYPE.MARKET)
  price?: number;
}
