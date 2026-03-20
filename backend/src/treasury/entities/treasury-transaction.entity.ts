import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export type TransactionDirection = 'inflow' | 'outflow';

@Entity('treasury_transactions')
export class TreasuryTransaction {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'text' })
  tx_hash!: string;

  @Column({ type: 'varchar', length: 10 })
  direction!: TransactionDirection;

  @Column({ type: 'decimal', precision: 18, scale: 6 })
  amount!: number;

  @Column({ type: 'text' })
  token!: string;

  @Column({ type: 'text' })
  counterparty!: string;

  @Column({ type: 'text' })
  category!: string;

  @Column({ type: 'text', nullable: true })
  memo!: string | null;

  @Column({ type: 'timestamptz' })
  timestamp!: Date;
}
