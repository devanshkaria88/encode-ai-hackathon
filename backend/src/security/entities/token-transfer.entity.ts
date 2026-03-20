import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('token_transfers')
export class TokenTransfer {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'text' })
  from_address!: string;

  @Column({ type: 'text' })
  to_address!: string;

  @Column({ type: 'decimal', precision: 18, scale: 6 })
  amount!: number;

  @Column({ type: 'timestamptz' })
  timestamp!: Date;
}
