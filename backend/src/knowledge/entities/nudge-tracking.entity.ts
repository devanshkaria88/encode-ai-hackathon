import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('nudge_tracking')
export class NudgeTracking {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  proposal_id!: number;

  @Column({ type: 'text' })
  member_address!: string;

  @Column({ type: 'int' })
  nudge_level!: number;

  @Column({ type: 'timestamptz' })
  sent_at!: Date;
}
