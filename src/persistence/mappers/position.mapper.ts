import { Decimal } from 'decimal.js';
import { toDecimalString } from '../../common/utils/to-decimal-string.js';
import type { Position } from '../../core/models/position.model.js';
import {
  POSITION_COST_SCALE,
  POSITION_QUANTITY_SCALE,
} from '../constants/positions.constants.js';
import type { PositionEntity } from '../entities/position.entity.js';

export function toPositionModel(entity: PositionEntity): Position {
  return {
    instrumentId: entity.instrumentId,
    quantity: new Decimal(entity.quantity),
    cost: new Decimal(entity.cost),
  };
}

export function toPositionEntity(
  userId: number,
  position: Position,
  updatedAt: Date,
): PositionEntity {
  return {
    userId,
    instrumentId: position.instrumentId,
    quantity: toDecimalString(position.quantity, POSITION_QUANTITY_SCALE),
    cost: toDecimalString(position.cost, POSITION_COST_SCALE),
    updatedAt,
  };
}
