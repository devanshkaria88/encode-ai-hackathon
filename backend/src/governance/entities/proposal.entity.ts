import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Vote } from './vote.entity.js';

export type ProposalStatus =
  | 'active'
  | 'passed'
  | 'rejected'
  | 'executed'
  | 'cancelled';

@Entity('proposals')
export class Proposal {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  proposal_number!: number;

  @Column({ type: 'text' })
  title!: string;

  @Column({ type: 'text' })
  body!: string;

  @Column({ type: 'text' })
  proposer_address!: string;

  @Column({ type: 'decimal', precision: 18, scale: 6 })
  requested_amount!: number;

  @Column({ type: 'text', nullable: true })
  recipient_address!: string | null;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status!: ProposalStatus;

  @Column({ type: 'timestamptz' })
  vote_start!: Date;

  @Column({ type: 'timestamptz' })
  vote_end!: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @OneToMany(() => Vote, (vote) => vote.proposal)
  votes!: Vote[];
}
