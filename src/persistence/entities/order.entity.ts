import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('orders')
export class OrderEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'instrumentid', type: 'int' })
  instrumentId: number;

  @Column({ name: 'userid', type: 'int' })
  userId: number;

  @Column({ type: 'int' })
  size: number;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  price: string;

  @Column({ type: 'varchar' })
  type: string;

  @Column({ type: 'varchar' })
  side: string;

  @Column({ type: 'varchar' })
  status: string;

  @Column({ type: 'timestamp' })
  datetime: Date;
}
