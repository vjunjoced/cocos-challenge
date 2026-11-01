import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('marketdata')
export class MarketDataEntity {
  @PrimaryColumn({ type: 'int' })
  id: number;

  @Column({ name: 'instrumentid', type: 'int' })
  instrumentId: number;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  high: string;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  low: string;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  open: string;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  close: string;

  @Column({ name: 'previousclose', type: 'numeric', precision: 10, scale: 2 })
  previousClose: string;

  @Column({ type: 'date' })
  date: string;
}
