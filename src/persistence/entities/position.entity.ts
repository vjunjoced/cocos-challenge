import { Column, Entity, PrimaryColumn } from 'typeorm';
import {
  POSITION_COST_SCALE,
  POSITION_QUANTITY_SCALE,
} from '../constants/positions.constants.js';

@Entity('positions')
export class PositionEntity {
  @PrimaryColumn({ name: 'userid', type: 'int' })
  userId: number;

  @PrimaryColumn({ name: 'instrumentid', type: 'int' })
  instrumentId: number;

  @Column({ type: 'numeric', precision: 18, scale: POSITION_QUANTITY_SCALE })
  quantity: string;

  @Column({ type: 'numeric', precision: 18, scale: POSITION_COST_SCALE })
  cost: string;

  @Column({ name: 'updatedat', type: 'timestamp' })
  updatedAt: Date;
}
