import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('treasury_balances')
export class TreasuryBalance {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'text' })
  token!: string;

  @Column({ type: 'decimal', precision: 18, scale: 6 })
  balance!: number;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  usd_value!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  percentage!: number;

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  updated_at!: Date;
}
