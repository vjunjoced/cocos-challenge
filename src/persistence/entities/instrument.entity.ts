import { Column, Entity, PrimaryColumn } from 'typeorm';
import type { Instrument } from '../../core/models/instrument.model.js';

@Entity('instruments')
export class InstrumentEntity implements Instrument {
  @PrimaryColumn({ type: 'int' })
  id: number;

  @Column({ type: 'varchar' })
  ticker: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar' })
  type: string;
}
