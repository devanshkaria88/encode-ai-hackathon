import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Proposal } from './proposal.entity.js';

export type VoteChoice = 'for' | 'against' | 'abstain';

@Entity('votes')
export class Vote {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  proposal_id!: number;

  @Column({ type: 'text' })
  voter_address!: string;

  @Column({ type: 'varchar', length: 10 })
  vote!: VoteChoice;

  @Column({ type: 'decimal', precision: 18, scale: 6 })
  voting_power!: number;

  @Column({ type: 'timestamptz' })
  voted_at!: Date;

  @ManyToOne(() => Proposal, (proposal) => proposal.votes)
  @JoinColumn({ name: 'proposal_id' })
  proposal!: Proposal;
}
