import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('members')
export class Member {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'text', unique: true })
  address!: string;

  @Column({ type: 'text', nullable: true })
  display_name!: string | null;

  @Column({ type: 'decimal', precision: 18, scale: 6 })
  token_balance!: number;

  @Column({ type: 'timestamptz' })
  join_date!: Date;

  @Column({ type: 'text', nullable: true })
  luffa_user_id!: string | null;
}
